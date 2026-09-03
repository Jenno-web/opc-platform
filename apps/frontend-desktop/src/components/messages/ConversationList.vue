<script setup lang="ts">
import type { ChannelItem, ConversationItem } from '@/types'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'

defineProps<{
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
</script>

<template>
  <div class="conversation-list">
    <div class="conversation-list__section-title">会话</div>
    <div
      v-for="c in conversations"
      :key="c.id"
      class="conversation-item"
      :class="{ 'is-active': c.id === activeId }"
      @click="emit('select', c.id)"
    >
      <Avatar :name="c.title" :avatar-url="c.otherAvatarUrl" size="36px" />
      <div class="conversation-item__body">
        <div class="conversation-item__header">
          <span class="conversation-item__title">{{ c.title }}</span>
          <span class="conversation-item__type">{{ typeLabel[c.type] }}</span>
        </div>
        <span v-if="c.projectTitle" class="conversation-item__context">关于《{{ c.projectTitle }}》</span>
        <span class="conversation-item__last">{{ c.lastMessage }}</span>
      </div>
      <span v-if="c.unreadCount" class="conversation-item__badge">{{ c.unreadCount }}</span>
    </div>

    <div v-if="channels.length" class="conversation-list__section-title conversation-list__section-title--channels">
      <Icon name="hash" size="14px" />
      <span>培风社官方</span>
    </div>
    <div
      v-for="c in channels"
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
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.conversation-list {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  &__section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: $opc-font-xs;
    font-weight: 700;
    color: $opc-color-text-secondary;
    text-transform: uppercase;
    padding: $opc-spacing-sm $opc-spacing-sm $opc-spacing-xs;

    &--channels {
      margin-top: $opc-spacing-xs;
      border-top: 1px solid $opc-border-color;
    }
  }
}

.conversation-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: $opc-spacing-xs;
  padding: $opc-spacing-sm;
  cursor: pointer;
  border-radius: $opc-radius-card-sm;
  margin: 0 6px;
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
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 6px;
  }

  &__title {
    font-size: $opc-font-sm;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__type {
    flex-shrink: 0;
    font-size: 11px;
    color: $opc-color-text-secondary;
  }

  &__context {
    font-size: 11px;
    color: $opc-color-accent;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__last {
    font-size: 12px;
    color: $opc-color-text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
