<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchMyApplications } from '@/api/applications'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
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
    <template v-if="loading">
      <SkeletonBlock v-for="i in 3" :key="i" :rows="2" />
    </template>
    <template v-else>
      <view v-for="app in applications" :key="app.id" class="applications__item opc-fade-in">
        <view class="applications__header">
          <text class="applications__title">{{ app.project.title }}</text>
          <text class="applications__status" :class="`is-${app.status.toLowerCase()}`">
            {{ statusLabel[app.status] }}
          </text>
        </view>
        <text v-if="app.aiGenerated" class="applications__ai-tag">AI 生成申请文案</text>
        <text class="applications__content">{{ app.content }}</text>
      </view>
      <EmptyState v-if="applications.length === 0" text="暂无申请记录" />
    </template>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.applications {
  padding: $opc-spacing;

  &__item {
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    padding: $opc-spacing;
    margin-bottom: $opc-spacing-sm;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: $opc-spacing-xxs;
  }

  &__title {
    font-size: $opc-font-base;
    font-weight: 600;
  }

  &__status {
    font-size: $opc-font-xs;
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
    margin-bottom: $opc-spacing-xxs;
  }

  &__content {
    display: block;
    font-size: $opc-font-base;
    color: $opc-color-text-secondary;
    line-height: 1.6;
  }
}
</style>
