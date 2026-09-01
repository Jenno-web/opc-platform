<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  extractTodosFromConversation,
  fetchConversation,
  fetchConversationMessages,
  sendChatMessage,
  suggestReply,
  summarizeConversation,
} from '@/api/messages'
import { useUserStore } from '@/store/user'
import { getSocket } from '@/utils/socket'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import Avatar from '@/components/Avatar.vue'
import type { ChatMessageItem } from '@/types'

const userStore = useUserStore()
const conversationId = ref('')
const messages = ref<ChatMessageItem[]>([])
const inputText = ref('')
const loading = ref(true)
const aiWorking = ref(false)
const aiSummary = ref('')
const realtimeConnected = ref(false)
// 对方是通过哪个项目找过来的，只有从项目详情页"提问"发起的私信才会有
const projectTitle = ref<string | null>(null)

function handleIncomingMessage(message: ChatMessageItem) {
  if (message.conversationId !== conversationId.value) return
  if (messages.value.some((m) => m.id === message.id)) return
  messages.value.push(message)
  scrollToBottom()
}

async function loadMessages() {
  messages.value = await fetchConversationMessages(conversationId.value)
}

async function handleSend() {
  const content = inputText.value.trim()
  if (!content) return
  inputText.value = ''
  const message = await sendChatMessage(conversationId.value, content)
  // 发送成功后端也会把这条消息通过 WebSocket 广播给会话里所有人（包括自己），
  // 如果广播先一步到达（跟这个 HTTP 响应之间没有先后保证），handleIncomingMessage
  // 会先把它塞进列表；这里必须跟那边一样做去重检查，不然一条消息会显示两次
  if (!messages.value.some((m) => m.id === message.id)) {
    messages.value.push(message)
  }
  scrollToBottom()
}

async function handleSuggestReply() {
  aiWorking.value = true
  try {
    const { reply } = await suggestReply(conversationId.value)
    inputText.value = reply
  } finally {
    aiWorking.value = false
  }
}

async function handleSummarize() {
  aiWorking.value = true
  try {
    const { summary } = await summarizeConversation(conversationId.value)
    aiSummary.value = summary
  } finally {
    aiWorking.value = false
  }
}

async function handleExtractTodos() {
  aiWorking.value = true
  try {
    const todos = await extractTodosFromConversation(conversationId.value)
    uni.showToast({ title: `已提取 ${todos.length} 条待办，请到消息页确认`, icon: 'none' })
  } finally {
    aiWorking.value = false
  }
}

// 之前用 uni.pageScrollTo 滚整个页面，前提是页面本身会滚动；但输入框是靠 position:fixed
// 钉在屏幕底部的，只要外层容器不是"整页面"在滚（比如被 uni-app 的页面包裹层裁切成内部滚动），
// fixed 就不一定是相对浏览器视口，会导致滑到底也够不着输入框。现在把消息区改成自己的滚动容器
// （见 .chat__messages 的 overflow-y），这里改成直接操作这个容器的 scrollTop，不依赖整页滚动
const messagesRef = ref<HTMLElement | null>(null)
function scrollToBottom() {
  nextTick(() => {
    const el = messagesRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

onLoad((query) => {
  conversationId.value = (query?.id as string) ?? ''
  if (query?.title) {
    uni.setNavigationBarTitle({ title: decodeURIComponent(query.title as string) })
  }
})

onMounted(async () => {
  if (!userStore.currentUser) await userStore.loadCurrentUser()
  loading.value = true
  try {
    // 消息从顶部开始排列，进页面就该直接看到，不用像贴底部聊天软件那样自动滚到底部
    const [, detail] = await Promise.all([loadMessages(), fetchConversation(conversationId.value)])
    projectTitle.value = detail.projectTitle
  } finally {
    loading.value = false
  }

  const socket = getSocket()
  if (socket) {
    socket.on('connect', () => (realtimeConnected.value = true))
    socket.on('disconnect', () => (realtimeConnected.value = false))
    socket.on('message:new', handleIncomingMessage)
    // 频道场景：刚进频道时后端参与者列表可能还没来得及包含自己，额外加入会话房间兜底
    socket.emit('joinConversation', conversationId.value)
    realtimeConnected.value = socket.connected
  }
})

onUnmounted(() => {
  const socket = getSocket()
  socket?.emit('leaveConversation', conversationId.value)
  socket?.off('message:new', handleIncomingMessage)
})
</script>

<template>
  <view class="chat">
    <view v-if="projectTitle" class="chat__context">
      <text>关于项目《{{ projectTitle }}》</text>
    </view>

    <view v-if="aiSummary" class="chat__summary">
      <text class="chat__summary-label">AI 对话总结</text>
      <text class="chat__summary-text">{{ aiSummary }}</text>
    </view>

    <view v-if="loading" class="chat__messages">
      <SkeletonBlock :rows="1" avatar />
      <SkeletonBlock :rows="1" avatar />
    </view>
    <view v-else ref="messagesRef" class="chat__messages">
      <view
        v-for="message in messages"
        :key="message.id"
        class="chat__bubble-row opc-fade-in"
        :class="{ 'is-mine': message.senderId === userStore.currentUser?.id }"
      >
        <Avatar
          class="chat__avatar"
          :name="message.sender.nickname"
          :avatar-url="message.sender.avatarUrl"
          size="56rpx"
        />
        <view class="chat__bubble-col">
          <text class="chat__sender">{{ message.sender.nickname }}</text>
          <view class="chat__bubble">{{ message.content }}</view>
        </view>
      </view>
      <EmptyState v-if="messages.length === 0" text="暂无消息" />
    </view>

    <view class="chat__ai-bar">
      <view class="chat__ai-btn" hover-class="opc-hover" :class="{ 'is-disabled': aiWorking }" @click="handleSummarize">
        <text>对话总结</text>
      </view>
      <view class="chat__ai-btn" hover-class="opc-hover" :class="{ 'is-disabled': aiWorking }" @click="handleExtractTodos">
        <text>提取待办</text>
      </view>
      <view class="chat__ai-btn" hover-class="opc-hover" :class="{ 'is-disabled': aiWorking }" @click="handleSuggestReply">
        <text>回复建议</text>
      </view>
    </view>

    <view class="chat__input-bar">
      <input v-model="inputText" class="chat__input" placeholder="输入消息..." confirm-type="send" @confirm="handleSend" />
      <button class="chat__send-btn" hover-class="opc-hover" size="mini" @click="handleSend">发送</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

// 改成固定高度 + 内部滚动，而不是"整页滚动 + 输入框 fixed 钉在屏幕底部"——后者依赖页面本身
// 就是唯一的滚动容器这个假设，一旦这个假设不成立（比如被外层容器裁切成内部滚动），
// fixed 元素就会变成"看得见摸不着"，这正是之前"滑不到输入框"这个问题的根源。
// 高度用 100%（继承 uni-page-wrapper 已经算好、排除了顶部导航栏的高度），不能用 100vh——
// 100vh 是整个浏览器视口高度，会比 uni-page-wrapper 实际可用高度多出一个导航栏的高度，
// 导致这个容器本身就溢出了它该在的范围
.chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  &__context {
    flex-shrink: 0;
    margin: $opc-spacing $opc-spacing 0;
    padding: $opc-spacing-xxs $opc-spacing-sm;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-tag;
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
    align-self: flex-start;
  }

  &__summary {
    flex-shrink: 0;
    margin: $opc-spacing $opc-spacing 0;
    padding: $opc-spacing-xs $opc-spacing-sm;
    background: $opc-color-primary-soft;
    border-radius: $opc-radius-card-sm;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  &__summary-label {
    font-size: $opc-font-xs;
    font-weight: 600;
    color: $opc-color-ai;
  }

  &__summary-text {
    font-size: $opc-font-base;
    color: $opc-color-text;
  }

  &__messages {
    flex: 1;
    min-height: 0; // flex 子项默认 min-height:auto 会撑破父容器导致内部滚动失效，必须显式清零
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: $opc-spacing;
    display: flex;
    flex-direction: column;
    gap: $opc-spacing-sm;
  }

  &__bubble-row {
    display: flex;
    align-items: flex-end;
    gap: $opc-spacing-xxs;

    &.is-mine {
      flex-direction: row-reverse;

      .chat__bubble-col {
        align-items: flex-end;
      }

      .chat__bubble {
        background: $opc-color-primary;
        color: #fff;
      }
    }
  }

  &__avatar {
    flex-shrink: 0;
  }

  &__bubble-col {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 70%;
  }

  &__sender {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
    margin-bottom: 6rpx;
  }

  &__bubble {
    background: $opc-bg-card;
    color: $opc-color-text;
    padding: $opc-spacing-xs $opc-spacing-sm;
    border-radius: $opc-radius-card-sm;
    box-shadow: $opc-shadow-sm;
    font-size: $opc-font-base;
    line-height: 1.5;
  }

  &__ai-bar {
    flex-shrink: 0;
    display: flex;
    gap: $opc-spacing-xs;
    padding: $opc-spacing-xxs $opc-spacing;
    background: $opc-bg-page;
  }

  &__ai-btn {
    display: inline-block;
    font-size: $opc-font-sm;
    color: $opc-color-ai;
    background: $opc-color-primary-soft;
    padding: $opc-spacing-xxs $opc-spacing-sm;
    border-radius: $opc-radius-tag;

    &.is-disabled {
      opacity: 0.5;
    }
  }

  &__input-bar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: $opc-spacing-xs;
    padding: $opc-spacing-xs $opc-spacing;
    padding-bottom: max($opc-spacing-xs, env(safe-area-inset-bottom));
    background: $opc-bg-card;
    border-top: 1px solid $opc-border-color;
    box-shadow: $opc-shadow-md;
  }

  // 之前这里背景色跟外面 .chat__input-bar 是同一个白，输入框跟条形背景完全融在一起看不出来，
  // 换成浅灰底 + 边框，才能看出这是个可以点的输入框
  &__input {
    flex: 1;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-tag;
    padding: $opc-spacing-xs $opc-spacing-sm;
    font-size: $opc-font-base;
  }

  &__send-btn {
    background: $opc-color-primary;
    color: #fff;
    border-radius: $opc-radius-tag;
    font-size: $opc-font-sm;
  }
}
</style>
