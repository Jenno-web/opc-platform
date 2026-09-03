<script setup lang="ts">
import type { PublisherDetail } from '@/types'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'

defineProps<{ publisher: PublisherDetail }>()
</script>

<template>
  <aside class="publisher-sidebar">
    <div class="publisher-sidebar__identity">
      <Avatar :name="publisher.nickname" :avatar-url="publisher.avatarUrl" size="56px" />
      <div>
        <div class="publisher-sidebar__name">{{ publisher.nickname }}</div>
        <div class="publisher-sidebar__role">{{ publisher.professionalIdentity }}</div>
      </div>
    </div>

    <div class="publisher-sidebar__stats">
      <div class="publisher-sidebar__stat">
        <Icon name="star" filled size="14px" color="#fbbf24" />
        <span>{{ publisher.ratingAvg.toFixed(1) }}（{{ publisher.ratingCount }}）</span>
      </div>
      <div class="publisher-sidebar__stat">
        <span>入驻 {{ publisher.daysSinceJoin }} 天 · {{ publisher.collaborationCount }} 次合作</span>
      </div>
    </div>

    <slot />
  </aside>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.publisher-sidebar {
  // 应用内页现在是左侧侧边栏布局，没有横向的顶部导航条占用垂直空间了，
  // 吸顶偏移量不用再算 $opc-nav-height 进去
  position: sticky;
  top: $opc-spacing-lg;
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card;
  box-shadow: $opc-shadow-sm;
  padding: $opc-spacing-md;
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-md;

  &__identity {
    display: flex;
    align-items: center;
    gap: $opc-spacing-sm;
  }

  &__name {
    font-size: $opc-font-base;
    font-weight: 700;
  }

  &__role {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }

  &__stats {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
    padding: $opc-spacing-sm 0;
    border-top: 1px solid $opc-border-color;
    border-bottom: 1px solid $opc-border-color;
  }

  &__stat {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}
</style>
