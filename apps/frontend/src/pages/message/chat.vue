<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  extractTodosFromConversation,
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
  messages.value.push(message)
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

function scrollToBottom() {
  nextTick(() => {
    uni.pageScrollTo({ scrollTop: 999999, duration: 100 })
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
    await loadMessages()
    scrollToBottom()
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
    <view v-if="aiSummary" class="chat__summary">
      <text class="chat__summary-label">AI 对话总结</text>
      <text class="chat__summary-text">{{ aiSummary }}</text>
    </view>

    <view v-if="loading" class="chat__messages">
      <SkeletonBlock :rows="1" avatar />
      <SkeletonBlock :rows="1" avatar />
    </view>
    <view v-else class="chat__messages">
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

.chat {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 180rpx;

  &__summary {
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

  // 消息区用 flex-end 贴底：聊天窗口应该跟真实聊天软件一样，消息从底部往上堆，
  // 消息少的时候上面留白，而不是消息挤在顶部、下面一大片空白（之前的 bug）
  &__messages {
    flex: 1;
    padding: $opc-spacing;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
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
    position: fixed;
    left: 0;
    right: 0;
    bottom: 100rpx;
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
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: $opc-spacing-xs;
    padding: $opc-spacing-xs $opc-spacing;
    background: $opc-bg-card;
    border-top: 1px solid $opc-bg-page;
  }

  &__input {
    flex: 1;
    background: $opc-bg-page;
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
