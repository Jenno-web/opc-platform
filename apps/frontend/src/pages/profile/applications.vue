<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchMyApplications } from '@/api/applications'
import type { ApplicationItem } from '@/types'

const applications = ref<ApplicationItem[]>([])
const loading = ref(true)

const statusLabel: Record<string, string> = {
  PENDING: '待处理',
  ACCEPTED: '已通过',
  REJECTED: '未通过',
}

onMounted(async () => {
  loading.value = true
  try {
    applications.value = await fetchMyApplications()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <view class="applications">
    <view v-for="app in applications" :key="app.id" class="applications__item">
      <view class="applications__header">
        <text class="applications__title">{{ app.project.title }}</text>
        <text class="applications__status" :class="`is-${app.status.toLowerCase()}`">
          {{ statusLabel[app.status] }}
        </text>
      </view>
      <text v-if="app.aiGenerated" class="applications__ai-tag">AI 生成申请文案</text>
      <text class="applications__content">{{ app.content }}</text>
    </view>
    <view v-if="!loading && applications.length === 0" class="applications__empty">暂无申请记录</view>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.applications {
  padding: $opc-spacing;

  &__item {
    background: $opc-bg-card;
    border-radius: $opc-radius-card;
    padding: $opc-spacing;
    margin-bottom: 20rpx;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12rpx;
  }

  &__title {
    font-size: 28rpx;
    font-weight: 600;
  }

  &__status {
    font-size: 20rpx;
    padding: 4rpx 16rpx;
    border-radius: $opc-radius-tag;
    background: $opc-color-primary-soft;
    color: $opc-color-primary;

    &.is-accepted {
      background: rgba(34, 197, 94, 0.12);
      color: $opc-color-success;
    }
    &.is-rejected {
      background: rgba(239, 68, 68, 0.12);
      color: $opc-color-danger;
    }
  }

  &__ai-tag {
    display: inline-block;
    font-size: 18rpx;
    color: $opc-color-ai;
    background: $opc-color-primary-soft;
    padding: 4rpx 12rpx;
    border-radius: $opc-radius-tag;
    margin-bottom: 10rpx;
  }

  &__content {
    display: block;
    font-size: 24rpx;
    color: $opc-color-text-secondary;
    line-height: 1.6;
  }

  &__empty {
    text-align: center;
    color: $opc-color-text-secondary;
    font-size: 24rpx;
    padding: 80rpx 0;
  }
}
</style>
