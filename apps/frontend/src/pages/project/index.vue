<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PublishFab from '@/components/PublishFab.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { fetchMyProjectStats, fetchMyProjects, updateProjectStatus } from '@/api/projects'
import { useUserStore } from '@/store/user'
import type { ProjectListItem, ProjectStatus } from '@/types'

const userStore = useUserStore()

const tabs: { label: string; value: ProjectStatus | 'ALL' }[] = [
  { label: '全部', value: 'ALL' },
  { label: '待响应', value: 'RECRUITING' },
  { label: '已解决', value: 'COMPLETED' },
  { label: '已过期', value: 'ARCHIVED' },
]
const activeTab = ref<ProjectStatus | 'ALL'>('ALL')

const stats = ref({ publishing: 0, responses: 0, inConversation: 0 })
const list = ref<ProjectListItem[]>([])
const loading = ref(false)

async function loadStats() {
  stats.value = await fetchMyProjectStats()
}

async function loadList() {
  loading.value = true
  try {
    list.value = await fetchMyProjects(activeTab.value === 'ALL' ? undefined : activeTab.value)
  } finally {
    loading.value = false
  }
}

function switchTab(tab: ProjectStatus | 'ALL') {
  activeTab.value = tab
  loadList()
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/project/detail?id=${id}` })
}

function isMine(project: ProjectListItem) {
  return project.publisher.id === userStore.currentUser?.id
}

async function handleArchive(project: ProjectListItem) {
  await updateProjectStatus(project.id, 'ARCHIVED')
  loadList()
  loadStats()
}

async function handleComplete(project: ProjectListItem) {
  await updateProjectStatus(project.id, 'COMPLETED')
  loadList()
  loadStats()
}

onMounted(async () => {
  if (!userStore.currentUser) await userStore.loadCurrentUser()
  loadStats()
  loadList()
})
</script>

<template>
  <view class="task-board">
    <view class="task-board__header">
      <text class="task-board__title">任务</text>
      <text class="task-board__subtitle">状态台</text>
    </view>

    <view class="task-board__stats">
      <view class="task-board__stat">
        <text class="task-board__stat-num">{{ stats.publishing }}</text>
        <text class="task-board__stat-label">发布中</text>
      </view>
      <view class="task-board__stat">
        <text class="task-board__stat-num">{{ stats.responses }}</text>
        <text class="task-board__stat-label">响应</text>
      </view>
      <view class="task-board__stat">
        <text class="task-board__stat-num">{{ stats.inConversation }}</text>
        <text class="task-board__stat-label">沟通中</text>
      </view>
    </view>

    <view class="task-board__tabs">
      <text
        v-for="tab in tabs"
        :key="tab.value"
        class="task-board__tab"
        :class="{ 'is-active': activeTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </text>
    </view>

    <view class="task-board__list">
      <view v-for="p in list" :key="p.id" class="task-board__item">
        <ProjectCard :project="p" @click="goDetail" />
        <view v-if="isMine(p)" class="task-board__actions">
          <text
            v-if="p.status !== 'COMPLETED'"
            class="task-board__action"
            @click.stop="handleComplete(p)"
          >
            标记解决
          </text>
          <text
            v-if="p.status !== 'ARCHIVED'"
            class="task-board__action is-danger"
            @click.stop="handleArchive(p)"
          >
            下架
          </text>
        </view>
      </view>
      <view v-if="!loading && list.length === 0" class="task-board__empty">当前分类下暂无内容</view>
    </view>

    <PublishFab />
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.task-board {
  padding: $opc-spacing;
  padding-bottom: 160rpx;
  min-height: 100vh;

  &__header {
    display: flex;
    align-items: baseline;
    gap: 12rpx;
    margin-bottom: 24rpx;
  }

  &__title {
    font-size: 34rpx;
    font-weight: 700;
  }

  &__subtitle {
    font-size: 22rpx;
    color: $opc-color-text-secondary;
  }

  &__stats {
    display: flex;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    padding: $opc-spacing 0;
    margin-bottom: 24rpx;
  }

  &__stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
  }

  &__stat-num {
    font-size: 32rpx;
    font-weight: 700;
  }

  &__stat-label {
    font-size: 20rpx;
    color: $opc-color-text-secondary;
  }

  &__tabs {
    display: flex;
    gap: 16rpx;
    margin-bottom: 24rpx;
    overflow-x: auto;
    white-space: nowrap;
  }

  &__tab {
    font-size: 24rpx;
    padding: 12rpx 28rpx;
    border-radius: $opc-radius-tag;
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    color: $opc-color-text-secondary;

    &.is-active {
      background: $opc-color-primary;
      border-color: $opc-color-primary;
      color: #fff;
      font-weight: 600;
    }
  }

  &__item {
    margin-bottom: 8rpx;
  }

  &__actions {
    display: flex;
    gap: 16rpx;
    margin: -8rpx 0 20rpx;
  }

  &__action {
    font-size: 22rpx;
    color: $opc-color-text;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    padding: 8rpx 20rpx;
    border-radius: $opc-radius-tag;

    &.is-danger {
      color: $opc-color-danger;
    }
  }

  &__empty {
    text-align: center;
    color: $opc-color-text-secondary;
    font-size: 24rpx;
    padding: 60rpx 0;
  }
}
</style>
