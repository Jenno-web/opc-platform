<script setup lang="ts">
import type { ProjectListItem } from '@/types'
import { formatRelativeTime } from '@/utils/time'

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
  <view class="project-card" @click="handleClick">
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
      <text class="project-card__match-score">匹配 {{ project.matchScore }}%</text>
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

.project-card {
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card;
  padding: $opc-spacing;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__badges {
    display: flex;
    gap: 10rpx;
  }

  &__kind {
    font-size: 20rpx;
    font-weight: 600;
    color: $opc-color-text;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    padding: 2rpx 14rpx;
    border-radius: $opc-radius-tag;
  }

  &__bounty {
    font-size: 20rpx;
    font-weight: 700;
    color: #ffffff;
    background: $opc-color-primary;
    padding: 2rpx 14rpx;
    border-radius: $opc-radius-tag;
  }

  &__status {
    font-size: 20rpx;
    padding: 4rpx 14rpx;
    border-radius: $opc-radius-tag;
    background: $opc-bg-subtle;
    color: $opc-color-text-secondary;
    white-space: nowrap;

    &.is-completed {
      color: $opc-color-success;
    }
  }

  &__title {
    font-size: 30rpx;
    font-weight: 600;
    color: $opc-color-text;
  }

  &__desc {
    font-size: 24rpx;
    color: $opc-color-text-secondary;
    line-height: 1.5;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;
  }

  &__tag {
    font-size: 20rpx;
    color: $opc-color-text-secondary;
    background: $opc-bg-subtle;
    padding: 4rpx 12rpx;
    border-radius: $opc-radius-tag;
  }

  &__match {
    display: flex;
    align-items: center;
    gap: 10rpx;
    font-size: 22rpx;
  }

  &__match-score {
    color: $opc-color-text;
    font-weight: 700;
  }

  &__match-reason {
    color: $opc-color-text-secondary;
  }

  &__meta,
  &__footer {
    display: flex;
    justify-content: space-between;
    font-size: 20rpx;
    color: $opc-color-text-secondary;
  }
}
</style>
