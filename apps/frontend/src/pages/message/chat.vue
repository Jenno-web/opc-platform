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

    <view class="chat__messages">
      <view
        v-for="message in messages"
        :key="message.id"
        class="chat__bubble-row"
        :class="{ 'is-mine': message.senderId === userStore.currentUser?.id }"
      >
        <text class="chat__sender">{{ message.sender.nickname }}</text>
        <view class="chat__bubble">{{ message.content }}</view>
      </view>
      <view v-if="!loading && messages.length === 0" class="chat__empty">暂无消息</view>
    </view>

    <view class="chat__ai-bar">
      <text class="chat__ai-btn" :class="{ 'is-disabled': aiWorking }" @click="handleSummarize">对话总结</text>
      <text class="chat__ai-btn" :class="{ 'is-disabled': aiWorking }" @click="handleExtractTodos">提取待办</text>
      <text class="chat__ai-btn" :class="{ 'is-disabled': aiWorking }" @click="handleSuggestReply">回复建议</text>
    </view>

    <view class="chat__input-bar">
      <input v-model="inputText" class="chat__input" placeholder="输入消息..." confirm-type="send" @confirm="handleSend" />
      <button class="chat__send-btn" size="mini" @click="handleSend">发送</button>
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
    padding: 16rpx 20rpx;
    background: $opc-color-primary-soft;
    border-radius: 16rpx;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  &__summary-label {
    font-size: 20rpx;
    font-weight: 600;
    color: $opc-color-ai;
  }

  &__summary-text {
    font-size: 24rpx;
    color: $opc-color-text;
  }

  &__messages {
    flex: 1;
    padding: $opc-spacing;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  &__bubble-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    &.is-mine {
      align-items: flex-end;

      .chat__bubble {
        background: $opc-color-primary;
        color: #fff;
      }
    }
  }

  &__sender {
    font-size: 20rpx;
    color: $opc-color-text-secondary;
    margin-bottom: 6rpx;
  }

  &__bubble {
    max-width: 70%;
    background: $opc-bg-card;
    color: $opc-color-text;
    padding: 16rpx 24rpx;
    border-radius: 20rpx;
    font-size: 26rpx;
    line-height: 1.5;
  }

  &__empty {
    text-align: center;
    color: $opc-color-text-secondary;
    font-size: 24rpx;
    padding: 60rpx 0;
  }

  &__ai-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 100rpx;
    display: flex;
    gap: 16rpx;
    padding: 12rpx $opc-spacing;
    background: $opc-bg-page;
  }

  &__ai-btn {
    font-size: 22rpx;
    color: $opc-color-ai;
    background: $opc-color-primary-soft;
    padding: 10rpx 20rpx;
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
    gap: 16rpx;
    padding: 16rpx $opc-spacing;
    background: $opc-bg-card;
    border-top: 1px solid $opc-bg-page;
  }

  &__input {
    flex: 1;
    background: $opc-bg-page;
    border-radius: $opc-radius-tag;
    padding: 16rpx 24rpx;
    font-size: 26rpx;
  }

  &__send-btn {
    background: $opc-color-primary;
    color: #fff;
    border-radius: $opc-radius-tag;
    font-size: 24rpx;
  }
}
</style>
