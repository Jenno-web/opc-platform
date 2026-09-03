<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ChannelItem, ConversationItem } from '@/types'
import { formatRelativeTime } from '@/utils/time'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'

const props = defineProps<{
  conversations: ConversationItem[]
  channels: ChannelItem[]
  activeId: string | null
}>()

const emit = defineEmits<{ (e: 'select', id: string): void }>()

const typeLabel: Record<string, string> = {
  PROJECT: '项目群',
  PRIVATE: '私信',
  SYSTEM: '系统通知',
  APPLICATION: '申请通知',
}

const keyword = ref('')

const filteredConversations = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return props.conversations
  return props.conversations.filter(
    (c) => c.title.toLowerCase().includes(kw) || c.lastMessage.toLowerCase().includes(kw),
  )
})

const filteredChannels = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return props.channels
  return props.channels.filter((c) => c.title.toLowerCase().includes(kw))
})
</script>

<template>
  <div class="conversation-list">
    <div class="conversation-list__search">
      <Icon name="search" size="14px" />
      <input v-model="keyword" placeholder="搜索会话" />
    </div>

    <div class="conversation-list__scroll">
      <div class="conversation-list__section-title">会话</div>
      <div
        v-for="c in filteredConversations"
        :key="c.id"
        class="conversation-item"
        :class="{ 'is-active': c.id === activeId, 'is-unread': c.unreadCount > 0 }"
        @click="emit('select', c.id)"
      >
        <Avatar :name="c.title" :avatar-url="c.otherAvatarUrl" size="40px" />
        <div class="conversation-item__body">
          <div class="conversation-item__row">
            <span class="conversation-item__title">{{ c.title }}</span>
            <span class="conversation-item__time">{{ formatRelativeTime(c.lastMessageAt) }}</span>
          </div>
          <div class="conversation-item__row">
            <span class="conversation-item__last">
              <span v-if="c.projectTitle" class="conversation-item__context">《{{ c.projectTitle }}》</span>
              {{ c.lastMessage }}
            </span>
            <span v-if="c.unreadCount" class="conversation-item__badge">{{ c.unreadCount > 99 ? '99+' : c.unreadCount }}</span>
            <span v-else class="conversation-item__type">{{ typeLabel[c.type] }}</span>
          </div>
        </div>
      </div>
      <p v-if="!filteredConversations.length" class="conversation-list__empty">没有匹配的会话</p>

      <div v-if="filteredChannels.length" class="conversation-list__section-title conversation-list__section-title--channels">
        <Icon name="hash" size="14px" />
        <span>培风社官方</span>
      </div>
      <div
        v-for="c in filteredChannels"
        :key="c.id"
        class="conversation-item conversation-item--channel"
        :class="{ 'is-active': c.id === activeId }"
        @click="emit('select', c.id)"
      >
        <div class="conversation-item__channel-icon">
          <Icon :name="c.isVoiceRoom ? 'mic' : 'hash'" size="14px" color="#7c6cff" />
        </div>
        <span class="conversation-item__title">{{ c.title }}</span>
        <span v-if="c.unreadCount" class="conversation-item__badge">{{ c.unreadCount }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.conversation-list {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__search {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: $opc-spacing-sm;
    padding: 8px 12px;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-tag;
    color: $opc-color-text-placeholder;
    transition: border-color 0.15s ease;

    &:focus-within {
      border-color: $opc-color-accent;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: $opc-font-sm;
      color: $opc-color-text;

      &::placeholder {
        color: $opc-color-text-placeholder;
      }
    }
  }

  &__scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  &__empty {
    text-align: center;
    font-size: $opc-font-xs;
    color: $opc-color-text-placeholder;
    padding: $opc-spacing-lg 0;
  }

  &__section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: $opc-font-xs;
    font-weight: 700;
    color: $opc-color-text-secondary;
    text-transform: uppercase;
    padding: $opc-spacing-xs $opc-spacing-sm;

    &--channels {
      margin-top: $opc-spacing-xs;
      border-top: 1px solid $opc-border-color;
      padding-top: $opc-spacing-sm;
    }
  }
}

.conversation-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: $opc-spacing-xs;
  padding: $opc-spacing-xs $opc-spacing-sm;
  cursor: pointer;
  border-radius: $opc-radius-card-sm;
  margin: 1px 6px;
  border-left: 2px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: $opc-bg-subtle;
  }

  &.is-active {
    background: $opc-color-accent-soft;
    border-left-color: $opc-color-accent;
  }

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding-top: 2px;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  &__title {
    font-size: $opc-font-sm;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    flex-shrink: 0;
    font-size: 11px;
    color: $opc-color-text-placeholder;
  }

  &__type {
    flex-shrink: 0;
    font-size: 11px;
    color: $opc-color-text-placeholder;
  }

  &__context {
    color: $opc-color-accent;
    font-weight: 600;
    margin-right: 2px;
  }

  &__last {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    color: $opc-color-text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.is-unread &__title {
    color: $opc-color-text;
  }

  &.is-unread &__last {
    color: $opc-color-text;
    font-weight: 500;
  }

  &__badge {
    flex-shrink: 0;
    background: $opc-gradient-primary;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    min-width: 16px;
    height: 16px;
    border-radius: $opc-radius-tag;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
  }

  &--channel {
    align-items: center;
    gap: 8px;
  }

  &__channel-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: $opc-color-accent-soft;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}
</style>
