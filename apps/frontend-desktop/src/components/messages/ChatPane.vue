<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  fetchConversation,
  fetchConversationMessages,
  sendChatMessage,
  summarizeConversation,
  suggestReply,
  extractTodosFromConversation,
} from '@/api/messages'
import { useUserStore } from '@/store/user'
import { getSocket } from '@/utils/socket'
import { showToast } from '@/composables/useToast'
import { formatClockTime } from '@/utils/time'
import type { ChatMessageItem, ConversationDetail } from '@/types'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'
import EmptyState from '@/components/EmptyState.vue'

// 同一个人连着发的消息分到一组：组内只在第一条上露头像/昵称，只在最后一条
// 下面露时间戳——超过 3 分钟的间隔算新的一组。是常见聊天软件的分组习惯
// （Slack/iMessage 都这样），不分组的话头像/昵称/时间戳会在每一条消息上
// 重复刷一遍，密集对话时很吵
const GROUP_GAP_MS = 3 * 60 * 1000

const props = defineProps<{ conversationId: string }>()
const emit = defineEmits<{ (e: 'sent'): void }>()

const userStore = useUserStore()
const detail = ref<ConversationDetail | null>(null)
const messages = ref<ChatMessageItem[]>([])
const draft = ref('')
const loading = ref(true)
const sending = ref(false)
const aiWorking = ref(false)
const aiSummary = ref('')
const messageListRef = ref<HTMLElement | null>(null)
const composerRef = ref<HTMLTextAreaElement | null>(null)

async function scrollToBottom() {
  await nextTick()
  const el = messageListRef.value
  if (el) el.scrollTop = el.scrollHeight
}

async function load() {
  loading.value = true
  aiSummary.value = ''
  try {
    const [d, m] = await Promise.all([
      fetchConversation(props.conversationId),
      fetchConversationMessages(props.conversationId),
    ])
    detail.value = d
    messages.value = m
  } finally {
    loading.value = false
  }
  scrollToBottom()
}

async function handleSend() {
  if (!draft.value.trim()) return
  sending.value = true
  const content = draft.value.trim()
  draft.value = ''
  if (composerRef.value) composerRef.value.style.height = 'auto'
  try {
    const message = await sendChatMessage(props.conversationId, content)
    if (!messages.value.some((m) => m.id === message.id)) messages.value.push(message)
    emit('sent')
    scrollToBottom()
  } finally {
    sending.value = false
  }
}

async function handleSummarize() {
  aiWorking.value = true
  try {
    const res = await summarizeConversation(props.conversationId)
    aiSummary.value = res.summary
  } finally {
    aiWorking.value = false
  }
}

async function handleSuggestReply() {
  aiWorking.value = true
  try {
    const res = await suggestReply(props.conversationId)
    draft.value = res.reply
  } finally {
    aiWorking.value = false
  }
}

async function handleExtractTodos() {
  aiWorking.value = true
  try {
    const todos = await extractTodosFromConversation(props.conversationId)
    showToast(`已提取 ${todos.length} 条待办到任务页`)
  } finally {
    aiWorking.value = false
  }
}

function handleIncomingMessage(message: ChatMessageItem) {
  if (message.conversationId !== props.conversationId) return
  if (messages.value.some((m) => m.id === message.id)) return
  messages.value.push(message)
  scrollToBottom()
}

function isMine(message: ChatMessageItem) {
  return message.senderId === userStore.currentUser?.id
}

function isGrouped(index: number) {
  if (index === 0) return false
  const prev = messages.value[index - 1]
  const cur = messages.value[index]
  if (prev.senderId !== cur.senderId) return false
  return new Date(cur.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_GAP_MS
}

function isLastInGroup(index: number) {
  if (index === messages.value.length - 1) return true
  const cur = messages.value[index]
  const next = messages.value[index + 1]
  if (next.senderId !== cur.senderId) return true
  return new Date(next.createdAt).getTime() - new Date(cur.createdAt).getTime() >= GROUP_GAP_MS
}

function handleComposerKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function autoGrow(e: Event) {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

watch(() => props.conversationId, (next, prev) => {
  const socket = getSocket()
  if (prev) socket?.emit('leaveConversation', prev)
  if (next) socket?.emit('joinConversation', next)
  load()
})

onMounted(() => {
  const socket = getSocket()
  socket?.emit('joinConversation', props.conversationId)
  socket?.on('message:new', handleIncomingMessage)
  load()
})

onUnmounted(() => {
  const socket = getSocket()
  socket?.emit('leaveConversation', props.conversationId)
  socket?.off('message:new', handleIncomingMessage)
})
</script>

<template>
  <div class="chat-pane">
    <div v-if="detail" class="chat-pane__header">
      <div class="chat-pane__header-mark">{{ detail.title.slice(0, 1) }}</div>
      <div class="chat-pane__header-text">
        <span class="chat-pane__title">{{ detail.title }}</span>
        <span v-if="detail.projectTitle" class="chat-pane__context">关于《{{ detail.projectTitle }}》</span>
      </div>
    </div>

    <div class="chat-pane__ai-bar" :class="{ 'is-working': aiWorking }">
      <span class="chat-pane__ai-label">
        <Icon name="sparkle" size="12px" color="#7c6cff" />
        AI 助手
      </span>
      <span class="chat-pane__ai-divider" />
      <button class="ai-btn" :disabled="aiWorking" @click="handleSummarize">总结对话</button>
      <button class="ai-btn" :disabled="aiWorking" @click="handleSuggestReply">建议回复</button>
      <button class="ai-btn" :disabled="aiWorking" @click="handleExtractTodos">提取待办</button>
    </div>

    <div v-if="aiSummary" class="chat-pane__summary">
      <Icon name="sparkle" size="12px" color="#7c6cff" />
      <span>{{ aiSummary }}</span>
    </div>

    <div ref="messageListRef" class="chat-pane__messages">
      <EmptyState v-if="!loading && messages.length === 0" text="还没有消息，说点什么吧" />
      <div v-for="(m, i) in messages" :key="m.id" class="message-group" :class="{ 'is-mine': isMine(m) }">
        <div class="message-row" :class="{ 'is-mine': isMine(m), 'is-grouped': isGrouped(i) }">
          <Avatar
            v-if="!isMine(m) && !isGrouped(i)"
            :name="m.sender.nickname"
            :avatar-url="m.sender.avatarUrl"
            size="28px"
          />
          <div v-else-if="!isMine(m)" class="message-row__avatar-spacer" />
          <div class="message-row__bubble">
            <span v-if="!isMine(m) && !isGrouped(i)" class="message-row__sender">{{ m.sender.nickname }}</span>
            <p class="message-row__content">{{ m.content }}</p>
          </div>
        </div>
        <span v-if="isLastInGroup(i)" class="message-row__time" :class="{ 'is-mine': isMine(m) }">{{ formatClockTime(m.createdAt) }}</span>
      </div>
    </div>

    <div class="chat-pane__composer">
      <textarea
        ref="composerRef"
        v-model="draft"
        class="chat-pane__input"
        placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        rows="1"
        @input="autoGrow"
        @keydown="handleComposerKeydown"
      />
      <button class="chat-pane__send" :disabled="sending || !draft.trim()" @click="handleSend">
        <Icon name="send" size="16px" color="#ffffff" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

// .messages-main 是默认横向的 flex 容器（display:flex 没写 flex-direction），
// 横向主轴上子元素不会自动拉伸——之前 .chat-pane 没设 flex/width，
// 实际渲染宽度是内容撑出来的收缩宽度，不是"填满剩余空间"，宽屏下右边
// 大片空白就是这么来的，不是内边距/限宽的问题，是这里从来没真正占满过
.chat-pane {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    gap: $opc-spacing-sm;
    padding: $opc-spacing-md $opc-spacing-lg;
    border-bottom: 1px solid $opc-border-color;
  }

  // 会话对象没有单独的头像数据（群聊/系统通知也不该有单一头像代表整个会话），
  // 用标题首字做一个渐变色标，跟头像同样起到"一眼认出这是哪个会话"的作用，
  // 也让顶栏不是光秃秃一行字
  &__header-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: $opc-gradient-primary;
    color: #fff;
    font-size: $opc-font-base;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__header-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__title {
    font-size: $opc-font-lg;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__context {
    font-size: $opc-font-xs;
    color: $opc-color-accent;
  }

  // AI 工具条给一层浅底色，跟下面纯白的消息区分出"这是一条工具栏"而不是
  // 悬浮在消息流最上面的孤立按钮
  &__ai-bar {
    display: flex;
    align-items: center;
    gap: $opc-spacing-xs;
    padding: $opc-spacing-sm $opc-spacing-lg;
    background: $opc-bg-subtle;
    border-bottom: 1px solid $opc-border-color;

    &.is-working {
      opacity: 0.6;
    }
  }

  &__ai-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 700;
    color: $opc-color-text-secondary;
    flex-shrink: 0;
  }

  &__ai-divider {
    width: 1px;
    height: 12px;
    background: $opc-border-color;
    flex-shrink: 0;
  }

  &__summary {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    background: $opc-color-accent-soft;
    color: $opc-color-text;
    font-size: $opc-font-sm;
    padding: $opc-spacing-xs $opc-spacing-md;
    line-height: 1.6;
  }

  // 之前把这里限宽居中过，用户反馈"填满宽度"又改回了不限宽——但真实用了几天
  // 之后，宽屏下短消息（比如就打一个数字）靠右对齐会贴到很远的右边缘，旁边一大片
  // 空白，看着像"消息滑到外面去了"。这次不是简单限宽收窄容器（那样两边都空出
  // 一截，会重新变成"填不满"的观感），是只给消息列本身封一个上限宽度、
  // 左边缘还是贴着原来的位置——头部/AI 工具条/输入框这些照旧铺满到右边，
  // 只有消息气泡不再无限往右飘
  // flex 子元素默认 min-height:auto，意味着哪怕给了 flex:1，只要内容比可用
  // 空间高，这个元素也不会被压缩——它会撑到内容的实际高度，overflow-y:auto
  // 因此永远不会真正触发（scrollHeight 始终等于自己撑出来的 clientHeight），
  // 而是把整个 .chat-pane 乃至 body 都顶高，变成整页一起滚动。这正是"消息多了
  // 以后下滑会连左边侧边栏一起往下滑走"的根因——不是侧边栏自己的问题，是这里
  // 从来没有真正把滚动限制在消息区内部。加 min-height: 0 让它能被压缩到
  // flex:1 算出来的高度，overflow-y:auto 才会真的生效
  &__messages {
    flex: 1;
    min-height: 0;
    max-width: 900px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: $opc-spacing-lg;
    box-sizing: border-box;
  }

  &__composer {
    display: flex;
    align-items: flex-end;
    gap: $opc-spacing-xs;
    padding: $opc-spacing-md $opc-spacing-lg;
    border-top: 1px solid $opc-border-color;
  }

  // input 换成可以换行的 textarea，配合 JS 自动撑高（最多到 160px）——
  // 之前单行 input 打长一点的话就得靠左右滚动看完，聊天工具没有这样的
  &__input {
    flex: 1;
    resize: none;
    max-height: 160px;
    border: 1px solid $opc-border-color;
    border-radius: 20px;
    padding: 10px 18px;
    font-size: $opc-font-sm;
    font-family: inherit;
    line-height: 1.5;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:focus {
      border-color: $opc-color-accent;
      box-shadow: 0 0 0 3px $opc-color-accent-soft;
    }
  }

  &__send {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: $opc-gradient-primary;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.ai-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: $opc-color-accent;
  background: $opc-color-accent-soft;
  padding: 4px 10px;
  border-radius: $opc-radius-tag;

  &:hover:not(:disabled) {
    background: rgba($opc-color-accent, 0.18);
  }
  &:disabled {
    cursor: not-allowed;
  }
}

// 每条消息包一层 message-group（行 + 时间戳），is-mine 时整组靠右对齐——
// 比在 message-row 上单独处理对齐、时间戳再各写一套居左/居右规则要简单
.message-group {
  display: flex;
  flex-direction: column;
  max-width: min(70%, 640px);

  &.is-mine {
    align-items: flex-end;
    align-self: flex-end;
  }

  &:first-child .message-row {
    margin-top: 0;
  }
}

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-top: $opc-spacing-sm;

  // 同一个人连续发的消息紧挨着，只有换了发送人/间隔超过 3 分钟才拉开距离，
  // 这是 isGrouped() 判断出来的分组结果
  &.is-grouped {
    margin-top: 2px;
  }

  &.is-mine {
    flex-direction: row-reverse;

    .message-row__bubble {
      background: $opc-gradient-primary;
      color: #fff;
    }

    .message-row__content {
      color: #fff;
    }
  }

  &__avatar-spacer {
    width: 28px;
    flex-shrink: 0;
  }

  &__bubble {
    background: $opc-bg-subtle;
    border-radius: $opc-radius-card-sm;
    padding: $opc-spacing-xs $opc-spacing;
  }

  &__sender {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: $opc-color-text-secondary;
    margin-bottom: 2px;
  }

  &__content {
    margin: 0;
    font-size: $opc-font-sm;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__time {
    font-size: 11px;
    color: $opc-color-text-placeholder;
    margin: 3px 0 0 36px;

    &.is-mine {
      margin: 3px 0 0;
    }
  }
}
</style>
