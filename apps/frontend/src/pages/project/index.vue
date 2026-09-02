<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PublishFab from '@/components/PublishFab.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import Icon from '@/components/Icon.vue'
import CountUp from '@/components/CountUp.vue'
import { fetchMyProjectStats, fetchMyProjects, updateProjectStatus } from '@/api/projects'
import { useUserStore } from '@/store/user'
import type { ProjectListItem, ProjectStatus } from '@/types'

const userStore = useUserStore()

const tabs: { label: string; value: ProjectStatus | 'ALL' }[] = [
  { label: '全部', value: 'ALL' },
  { label: '待响应', value: 'RECRUITING' },
  { label: '沟通中', value: 'IN_PROGRESS' },
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

function goResponses() {
  uni.navigateTo({ url: '/pages/project/responses' })
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
      <view class="task-board__stat" hover-class="opc-hover" @click="switchTab('RECRUITING')">
        <text class="task-board__stat-num"><CountUp :value="stats.publishing" /></text>
        <view class="task-board__stat-label-row">
          <text class="task-board__stat-label">发布中</text>
          <Icon name="chevron-right" size="20rpx" color="#9a9a9a" />
        </view>
      </view>
      <view class="task-board__stat" hover-class="opc-hover" @click="goResponses">
        <text class="task-board__stat-num"><CountUp :value="stats.responses" /></text>
        <view class="task-board__stat-label-row">
          <text class="task-board__stat-label">响应</text>
          <Icon name="chevron-right" size="20rpx" color="#9a9a9a" />
        </view>
      </view>
      <view class="task-board__stat" hover-class="opc-hover" @click="switchTab('IN_PROGRESS')">
        <text class="task-board__stat-num"><CountUp :value="stats.inConversation" /></text>
        <view class="task-board__stat-label-row">
          <text class="task-board__stat-label">沟通中</text>
          <Icon name="chevron-right" size="20rpx" color="#9a9a9a" />
        </view>
      </view>
    </view>

    <view class="task-board__tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="task-board__tab"
        hover-class="opc-hover"
        :class="{ 'is-active': activeTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <view v-if="loading" class="task-board__list">
      <SkeletonBlock v-for="i in 3" :key="i" :rows="2" />
    </view>
    <view v-else class="task-board__list">
      <view
        v-for="(p, index) in list"
        :key="p.id"
        class="task-board__item opc-fade-in"
        :style="{ '--opc-stagger': Math.min(index, 6) }"
      >
        <ProjectCard :project="p" @click="goDetail" />
        <view v-if="isMine(p)" class="task-board__actions">
          <view
            v-if="p.status !== 'COMPLETED'"
            class="task-board__action"
            hover-class="opc-hover"
            @click.stop="handleComplete(p)"
          >
            <text>标记解决</text>
          </view>
          <view
            v-if="p.status !== 'ARCHIVED'"
            class="task-board__action is-danger"
            hover-class="opc-hover"
            @click.stop="handleArchive(p)"
          >
            <text>下架</text>
          </view>
        </view>
      </view>
      <EmptyState v-if="list.length === 0" text="当前分类下暂无内容" />
    </view>

    <PublishFab />
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.task-board {
  padding: $opc-spacing;
  // PublishFab 是 position:fixed，占的屏幕空间是 bottom:120rpx + 自身高度 96rpx = 216rpx，
  // 之前这里只留 160rpx，页面内容不够长的时候最后一块会被悬浮按钮真实挡住、点不到
  padding-bottom: 240rpx;
  min-height: 100vh;

  &__header {
    display: flex;
    align-items: baseline;
    gap: $opc-spacing-xxs;
    margin-bottom: $opc-spacing-sm;
  }

  &__title {
    font-size: $opc-font-xl;
    font-weight: 700;
  }

  &__subtitle {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
  }

  &__stats {
    display: flex;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    box-shadow: $opc-shadow-sm;
    padding: $opc-spacing 0;
    margin-bottom: $opc-spacing-sm;
  }

  &__stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    padding: $opc-spacing-xxs 0;
  }

  &__stat-num {
    font-size: $opc-font-lg;
    font-weight: 700;
    color: $opc-color-accent;
  }

  // 加个箭头图标提示这三个数字是能点进去看详情的，之前完全看不出可以点
  &__stat-label-row {
    display: flex;
    align-items: center;
    gap: 2rpx;
  }

  &__stat-label {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }

  &__tabs {
    display: flex;
    gap: $opc-spacing-xxs;
    margin-bottom: $opc-spacing-sm;
    overflow-x: auto;
    white-space: nowrap;
  }

  &__tab {
    display: inline-block;
    font-size: $opc-font-sm;
    padding: $opc-spacing-xxs $opc-spacing-sm;
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
    margin-bottom: $opc-spacing-xxs;
  }

  &__actions {
    display: flex;
    gap: $opc-spacing-xs;
    margin: -8rpx 0 $opc-spacing-sm;
  }

  &__action {
    display: inline-block;
    font-size: $opc-font-sm;
    color: $opc-color-text;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    padding: $opc-spacing-xxs $opc-spacing-xs;
    border-radius: $opc-radius-tag;

    &.is-danger {
      color: $opc-color-danger;
    }
  }
}
</style>
