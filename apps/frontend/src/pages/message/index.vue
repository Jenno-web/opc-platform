<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PublishFab from '@/components/PublishFab.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import Icon from '@/components/Icon.vue'
import Avatar from '@/components/Avatar.vue'
import CountUp from '@/components/CountUp.vue'
import { confirmTodo, fetchConversations, fetchTodos } from '@/api/messages'
import { getSocket } from '@/utils/socket'
import type { ConversationItem, TodoItem } from '@/types'

const conversations = ref<ConversationItem[]>([])
const todos = ref<TodoItem[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const [c, t] = await Promise.all([fetchConversations(), fetchTodos()])
    conversations.value = c
    todos.value = t
  } finally {
    loading.value = false
  }
}

const typeLabel: Record<string, string> = {
  PROJECT: '项目群',
  PRIVATE: '私信',
  SYSTEM: '系统通知',
  APPLICATION: '申请通知',
}

async function handleConfirmTodo(todo: TodoItem) {
  const updated = await confirmTodo(todo.id)
  const index = todos.value.findIndex((t) => t.id === todo.id)
  if (index !== -1) todos.value[index] = updated
}

function openConversation(conversation: ConversationItem) {
  uni.navigateTo({
    url: `/pages/message/chat?id=${conversation.id}&title=${encodeURIComponent(conversation.title)}`,
  })
}

function openChannels() {
  uni.navigateTo({ url: '/pages/message/channels' })
}

function handleRealtimeRefresh() {
  load()
}

// 用 onShow 而不是 onMounted 加载数据：从聊天页 navigateBack 回来这个页面组件不会重新
// mount（uni-app 页面栈机制），onMounted 只会跑一次，未读数清零这类在别的页面发生的变化
// 刷不出来。onShow 每次页面重新可见都会触发（包括第一次打开），一个钩子顶两个用
onShow(() => {
  load()
})

onMounted(() => {
  const socket = getSocket()
  socket?.on('message:new', handleRealtimeRefresh)
  socket?.on('todos:extracted', handleRealtimeRefresh)
})

onUnmounted(() => {
  const socket = getSocket()
  socket?.off('message:new', handleRealtimeRefresh)
  socket?.off('todos:extracted', handleRealtimeRefresh)
})
</script>

<template>
  <view class="message">
    <view class="message__stats">
      <view class="message__stat-item">
        <text class="message__stat-num"><CountUp :value="todos.filter((t) => !t.confirmedByUser).length" /></text>
        <text class="message__stat-label">待办事项</text>
      </view>
      <view class="message__stat-item">
        <text class="message__stat-num"><CountUp :value="conversations.reduce((s, c) => s + c.unreadCount, 0)" /></text>
        <text class="message__stat-label">未读消息</text>
      </view>
    </view>

    <view class="message__server-entry" hover-class="opc-hover" @click="openChannels">
      <text class="message__server-icon">官</text>
      <view class="message__server-info">
        <text class="message__server-name">培风社官方</text>
        <text class="message__server-desc">频道浏览 · 公告 / 休息室 / 项目群聊...</text>
      </view>
      <Icon name="chevron-right" size="28rpx" color="#9a9a9a" />
    </view>

    <template v-if="loading">
      <SkeletonBlock :rows="2" />
      <SkeletonBlock :rows="2" avatar />
      <SkeletonBlock :rows="2" avatar />
    </template>

    <template v-else>
      <view v-if="todos.length" class="message__section">
        <view class="message__section-title message__section-title--ai">
          <Icon name="sparkle" size="24rpx" color="#3B4BC4" />
          <text>AI 待办提取</text>
        </view>
        <view
          v-for="(todo, index) in todos"
          :key="todo.id"
          class="message__todo opc-fade-in"
          :style="{ '--opc-stagger': Math.min(index, 6) }"
        >
          <text class="message__todo-content">{{ todo.content }}</text>
          <view class="message__todo-meta">
            <text v-if="todo.assignee">负责人：{{ todo.assignee }}</text>
            <text v-if="todo.dueDate">{{ todo.dueDate }} 截止</text>
            <text
              v-if="todo.aiExtracted && !todo.confirmedByUser"
              class="message__todo-confirm"
              hover-class="opc-hover"
              @click="handleConfirmTodo(todo)"
            >
              待确认 · 点击确认
            </text>
            <text v-else-if="todo.confirmedByUser" class="message__todo-done">已确认</text>
          </view>
        </view>
      </view>

      <view class="message__section">
        <view class="message__section-title">会话</view>
        <view
          v-for="(c, index) in conversations"
          :key="c.id"
          class="message__conversation opc-fade-in"
          :style="{ '--opc-stagger': Math.min(index, 6) }"
          hover-class="opc-hover"
          @click="openConversation(c)"
        >
          <Avatar :name="c.title" :avatar-url="c.otherAvatarUrl" size="72rpx" />
          <view class="message__conversation-body">
            <view class="message__conversation-header">
              <text class="message__conversation-title">{{ c.title }}</text>
              <text class="message__conversation-type">{{ typeLabel[c.type] }}</text>
            </view>
            <text v-if="c.projectTitle" class="message__conversation-context">关于《{{ c.projectTitle }}》</text>
            <text class="message__conversation-last">{{ c.lastMessage }}</text>
          </view>
          <text v-if="c.unreadCount" class="message__conversation-badge">{{ c.unreadCount }}</text>
        </view>
        <EmptyState v-if="conversations.length === 0" text="暂无会话" />
      </view>
    </template>

    <PublishFab />
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.message {
  padding: $opc-spacing;
  // PublishFab 是 position:fixed，占的屏幕空间是 bottom:120rpx + 自身高度 96rpx = 216rpx，
  // 之前这里只留 160rpx，页面内容不够长的时候最后一块会被悬浮按钮真实挡住、点不到
  padding-bottom: 240rpx;

  &__stats {
    display: flex;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    box-shadow: $opc-shadow-sm;
    padding: $opc-spacing 0;
    margin-bottom: $opc-spacing-sm;
  }

  &__stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
  }

  &__stat-num {
    font-size: $opc-font-lg;
    font-weight: 700;
    color: $opc-color-accent;
  }

  &__stat-label {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
  }

  &__server-entry {
    display: flex;
    align-items: center;
    gap: $opc-spacing-xs;
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    box-shadow: $opc-shadow-sm;
    padding: $opc-spacing-sm;
    margin-bottom: $opc-spacing-lg;
  }

  &__server-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: $opc-radius-card-sm;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  &__server-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__server-name {
    font-size: $opc-font-base;
    font-weight: 600;
  }

  &__server-desc {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }

  &__section {
    margin-bottom: $opc-spacing-lg;
  }

  &__section-title {
    position: relative;
    padding-left: $opc-spacing-xxs;
    font-size: $opc-font-base;
    font-weight: 700;
    margin-bottom: $opc-spacing-xs;

    &::before {
      content: '';
      position: absolute;
      left: -#{$opc-spacing-xxs};
      top: 4rpx;
      bottom: 4rpx;
      width: 6rpx;
      border-radius: $opc-radius-tag;
      background: $opc-color-accent;
    }

    &--ai {
      display: flex;
      align-items: center;
      gap: 6rpx;
      padding-left: 0;

      &::before {
        display: none;
      }
    }
  }

  &__todo {
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card-sm;
    box-shadow: $opc-shadow-sm;
    padding: $opc-spacing-sm;
    margin-bottom: $opc-spacing-xxs;
  }

  &__todo-content {
    font-size: $opc-font-base;
    display: block;
    margin-bottom: $opc-spacing-xxs;
  }

  &__todo-meta {
    display: flex;
    gap: $opc-spacing-xs;
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }

  &__todo-confirm {
    color: $opc-color-text;
    font-weight: 600;
    text-decoration: underline;
  }

  &__todo-done {
    color: $opc-color-success;
  }

  &__conversation {
    position: relative;
    display: flex;
    align-items: center;
    gap: $opc-spacing-xs;
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card-sm;
    box-shadow: $opc-shadow-sm;
    padding: $opc-spacing-sm;
    margin-bottom: $opc-spacing-xxs;
  }

  &__conversation-body {
    flex: 1;
    min-width: 0;
    padding-right: 40rpx;
  }

  &__conversation-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6rpx;
  }

  &__conversation-title {
    font-size: $opc-font-base;
    font-weight: 600;
  }

  &__conversation-type {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }

  &__conversation-context {
    display: block;
    font-size: $opc-font-xs;
    color: $opc-color-ai;
    margin-bottom: 4rpx;
  }

  &__conversation-last {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
  }

  &__conversation-badge {
    position: absolute;
    top: 20rpx;
    right: 20rpx;
    background: $opc-color-primary;
    color: #fff;
    font-size: $opc-font-micro;
    min-width: 32rpx;
    height: 32rpx;
    line-height: 32rpx;
    text-align: center;
    border-radius: 50%;
  }
}
</style>
