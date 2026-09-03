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
import type { ChatMessageItem, ConversationDetail } from '@/types'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'
import EmptyState from '@/components/EmptyState.vue'

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
      <span class="chat-pane__title">{{ detail.title }}</span>
      <span v-if="detail.projectTitle" class="chat-pane__context">关于《{{ detail.projectTitle }}》</span>
    </div>

    <div class="chat-pane__ai-bar" :class="{ 'is-working': aiWorking }">
      <button class="ai-btn" :disabled="aiWorking" @click="handleSummarize">
        <Icon name="sparkle" size="12px" color="#7c6cff" />
        <span>总结对话</span>
      </button>
      <button class="ai-btn" :disabled="aiWorking" @click="handleSuggestReply">
        <Icon name="sparkle" size="12px" color="#7c6cff" />
        <span>建议回复</span>
      </button>
      <button class="ai-btn" :disabled="aiWorking" @click="handleExtractTodos">
        <Icon name="sparkle" size="12px" color="#7c6cff" />
        <span>提取待办</span>
      </button>
    </div>

    <div v-if="aiSummary" class="chat-pane__summary">
      <Icon name="sparkle" size="12px" color="#7c6cff" />
      <span>{{ aiSummary }}</span>
    </div>

    <div ref="messageListRef" class="chat-pane__messages">
      <EmptyState v-if="!loading && messages.length === 0" text="还没有消息，说点什么吧" />
      <div
        v-for="m in messages"
        :key="m.id"
        class="message-row"
        :class="{ 'is-mine': isMine(m) }"
      >
        <Avatar v-if="!isMine(m)" :name="m.sender.nickname" :avatar-url="m.sender.avatarUrl" size="28px" />
        <div class="message-row__bubble">
          <span v-if="!isMine(m)" class="message-row__sender">{{ m.sender.nickname }}</span>
          <p class="message-row__content">{{ m.content }}</p>
        </div>
      </div>
    </div>

    <div class="chat-pane__composer">
      <input
        v-model="draft"
        class="chat-pane__input"
        placeholder="输入消息，回车发送"
        @keyup.enter="handleSend"
      />
      <button class="chat-pane__send" :disabled="sending || !draft.trim()" @click="handleSend">
        <Icon name="send" size="16px" color="#ffffff" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.chat-pane {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: baseline;
    gap: $opc-spacing-xs;
    padding: $opc-spacing-md $opc-spacing-lg;
    border-bottom: 1px solid $opc-border-color;
  }

  &__title {
    font-size: $opc-font-lg;
    font-weight: 700;
  }

  &__context {
    font-size: $opc-font-xs;
    color: $opc-color-accent;
  }

  // AI 工具条给一层浅底色，跟下面纯白的消息区分出"这是一条工具栏"而不是
  // 悬浮在消息流最上面的孤立按钮
  &__ai-bar {
    display: flex;
    gap: $opc-spacing-xs;
    padding: $opc-spacing-sm $opc-spacing-lg;
    background: $opc-bg-subtle;
    border-bottom: 1px solid $opc-border-color;

    &.is-working {
      opacity: 0.6;
    }
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

  &__messages {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: $opc-spacing-sm;
    padding: $opc-spacing-lg;
    box-sizing: border-box;
  }

  &__composer {
    display: flex;
    gap: $opc-spacing-xs;
    padding: $opc-spacing-md $opc-spacing-lg;
    border-top: 1px solid $opc-border-color;
  }

  &__input {
    flex: 1;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-tag;
    padding: 10px 18px;
    font-size: $opc-font-sm;
    outline: none;

    &:focus {
      border-color: $opc-color-accent;
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

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: min(70%, 640px);

  &.is-mine {
    align-self: flex-end;
    flex-direction: row-reverse;

    .message-row__bubble {
      background: $opc-gradient-primary;
      color: #fff;
    }

    .message-row__content {
      color: #fff;
    }
  }

  &__bubble {
    background: $opc-bg-subtle;
    border-radius: $opc-radius-card-sm;
    padding: $opc-spacing-xs $opc-spacing;
  }

  &__sender {
    display: block;
    font-size: 11px;
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
}
</style>
