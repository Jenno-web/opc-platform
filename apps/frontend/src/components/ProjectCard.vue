<script setup lang="ts">
import type { ProjectListItem } from '@/types'
import { formatRelativeTime } from '@/utils/time'
import Icon from '@/components/Icon.vue'

const props = defineProps<{
  project: ProjectListItem
}>()

const emit = defineEmits<{ (e: 'click', id: string): void }>()

const statusLabel: Record<string, string> = {
  RECRUITING: '招募中',
  IN_PROGRESS: '进行中',
  PENDING_CONFIRM: '待确认',
  COMPLETED: '已完成',
  ARCHIVED: '已归档',
}

const kindLabel: Record<string, string> = {
  DEMAND: '需求',
  SUPPLY: '供给',
  MUTUAL: '互助',
}

function handleClick() {
  emit('click', props.project.id)
}
</script>

<template>
  <view class="project-card" hover-class="opc-hover" @click="handleClick">
    <view class="project-card__header">
      <view class="project-card__badges">
        <text class="project-card__kind">{{ kindLabel[project.kind] }}</text>
        <text v-if="project.publishTier === 'BOUNTY'" class="project-card__bounty">悬赏</text>
      </view>
      <text class="project-card__status" :class="`is-${project.status.toLowerCase()}`">
        {{ statusLabel[project.status] }}
      </text>
    </view>

    <text class="project-card__title">{{ project.title }}</text>
    <text class="project-card__desc">{{ project.background }}</text>

    <view class="project-card__tags">
      <text v-for="tag in project.skillTags" :key="tag.id" class="project-card__tag">{{ tag.name }}</text>
    </view>

    <view v-if="project.matchScore" class="project-card__match">
      <view class="project-card__match-score">
        <Icon name="sparkle" size="18rpx" color="#ffffff" />
        <text>匹配 {{ project.matchScore }}%</text>
      </view>
      <text class="project-card__match-reason">{{ project.matchReason }}</text>
    </view>

    <view class="project-card__meta">
      <text>{{ project.publisher.nickname }} · {{ project.heat }} 人看过</text>
      <text>{{ formatRelativeTime(project.createdAt) }}</text>
    </view>

    <view class="project-card__footer">
      <text>预算 {{ project.budgetMin }}-{{ project.budgetMax }} 元</text>
      <text>{{ project.cycleWeeks }} 周周期</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

// 间距/字号取值来自 Figma「01 发现&机会信息流」画板里 Section 卡片的 Auto Layout 实测值
// （itemSpacing≈30rpx、padding≈31rpx、标题字号 35rpx、正文 28rpx），不是随手写的
.project-card {
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card;
  box-shadow: $opc-shadow-sm;
  padding: $opc-spacing-md;
  margin-bottom: $opc-spacing-sm;
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__badges {
    display: flex;
    gap: $opc-spacing-xxs;
  }

  &__kind {
    font-size: $opc-font-xs;
    font-weight: 600;
    color: $opc-color-text;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    padding: $opc-spacing-micro 14rpx;
    border-radius: $opc-radius-tag;
  }

  &__bounty {
    font-size: $opc-font-xs;
    font-weight: 700;
    color: #ffffff;
    background: $opc-color-primary;
    padding: $opc-spacing-micro 14rpx;
    border-radius: $opc-radius-tag;
  }

  &__status {
    font-size: $opc-font-xs;
    padding: 6rpx 14rpx;
    border-radius: $opc-radius-tag;
    background: $opc-bg-subtle;
    color: $opc-color-text-secondary;
    white-space: nowrap;

    &.is-completed {
      color: $opc-color-success;
    }
  }

  &__title {
    font-size: $opc-font-xl;
    font-weight: 500;
    color: $opc-color-text;
  }

  &__desc {
    font-size: $opc-font-base;
    color: $opc-color-text-secondary;
    line-height: 1.5;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $opc-spacing-xxs;
  }

  &__tag {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
    background: $opc-bg-subtle;
    padding: 4rpx 12rpx;
    border-radius: $opc-radius-tag;
  }

  // AI 匹配度是这张卡片里唯一"AI 算出来的"信息，之前跟其他文字一样纯黑，识别不出来。
  // 用强调色实心徽标 + 闪光图标，跟 AiHint 是同一套视觉语言
  &__match {
    display: flex;
    align-items: center;
    gap: $opc-spacing-xxs;
    font-size: $opc-font-sm;
  }

  &__match-score {
    display: flex;
    align-items: center;
    gap: 4rpx;
    flex-shrink: 0;
    color: #ffffff;
    background: $opc-color-accent;
    padding: 2rpx $opc-spacing-xxs;
    border-radius: $opc-radius-tag;
    font-weight: 700;
    font-size: $opc-font-xs;
  }

  &__match-reason {
    color: $opc-color-text-secondary;
  }

  &__meta,
  &__footer {
    display: flex;
    justify-content: space-between;
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }
}
</style>
