<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchReceivedApplications } from '@/api/applications'
import { getOrCreatePrivateConversation } from '@/api/messages'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import Avatar from '@/components/Avatar.vue'
import { formatRelativeTime } from '@/utils/time'
import type { ReceivedApplicationItem } from '@/types'

// 对应任务页统计条"响应"数字的详情页——之前这个数字点不进去，看不到具体是谁申请了我的哪个项目
const applications = ref<ReceivedApplicationItem[]>([])
const loading = ref(true)
const chatting = ref('')

const statusLabel: Record<string, string> = {
  PENDING: '待处理',
  ACCEPTED: '已通过',
  REJECTED: '未通过',
}

onMounted(async () => {
  loading.value = true
  try {
    applications.value = await fetchReceivedApplications()
  } finally {
    loading.value = false
  }
})

async function goChat(app: ReceivedApplicationItem) {
  chatting.value = app.id
  try {
    const conversation = await getOrCreatePrivateConversation(app.applicant.id, app.project.id)
    uni.navigateTo({
      url: `/pages/message/chat?id=${conversation.id}&title=${encodeURIComponent(app.applicant.nickname)}`,
    })
  } finally {
    chatting.value = ''
  }
}
</script>

<template>
  <view class="responses">
    <template v-if="loading">
      <SkeletonBlock v-for="i in 3" :key="i" :rows="2" avatar />
    </template>
    <template v-else>
      <view v-for="app in applications" :key="app.id" class="responses__item opc-fade-in">
        <view class="responses__header">
          <Avatar :name="app.applicant.nickname" :avatar-url="app.applicant.avatarUrl" size="64rpx" />
          <view class="responses__identity">
            <text class="responses__name">{{ app.applicant.nickname }}</text>
            <text class="responses__meta">{{ app.applicant.professionalIdentity }} · {{ formatRelativeTime(app.createdAt) }}</text>
          </view>
          <text class="responses__status" :class="`is-${app.status.toLowerCase()}`">
            {{ statusLabel[app.status] }}
          </text>
        </view>

        <text class="responses__project">关于《{{ app.project.title }}》</text>
        <text class="responses__content">{{ app.content }}</text>

        <button
          class="responses__chat-btn"
          hover-class="opc-hover"
          size="mini"
          :loading="chatting === app.id"
          @click="goChat(app)"
        >
          去聊天
        </button>
      </view>
      <EmptyState v-if="applications.length === 0" text="还没有人响应你的项目" />
    </template>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.responses {
  padding: $opc-spacing;

  &__item {
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    box-shadow: $opc-shadow-sm;
    padding: $opc-spacing;
    margin-bottom: $opc-spacing-sm;
    display: flex;
    flex-direction: column;
    gap: $opc-spacing-xs;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $opc-spacing-xs;
  }

  &__identity {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2rpx;
  }

  &__name {
    font-size: $opc-font-base;
    font-weight: 600;
  }

  &__meta {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
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

  &__project {
    display: inline-block;
    font-size: $opc-font-xs;
    color: $opc-color-ai;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-tag;
    padding: 4rpx 16rpx;
    align-self: flex-start;
  }

  &__content {
    font-size: $opc-font-base;
    color: $opc-color-text-secondary;
    line-height: 1.6;
  }

  &__chat-btn {
    align-self: flex-start;
    background: $opc-color-primary;
    color: #fff;
    border-radius: $opc-radius-tag;
    font-size: $opc-font-sm;
    margin: 0;
  }
}
</style>
