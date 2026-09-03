<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchMyProjectStats, fetchMyProjects, updateProjectStatus } from '@/api/projects'
import { fetchMyApplications, fetchReceivedApplications } from '@/api/applications'
import { formatRelativeTime } from '@/utils/time'
import type { ApplicationItem, ProjectListItem, ProjectStatus, ReceivedApplicationItem } from '@/types'
import PageContainer from '@/components/layout/PageContainer.vue'
import StatusColumn from '@/components/tasks/StatusColumn.vue'
import TodoPanel from '@/components/tasks/TodoPanel.vue'
import CountUp from '@/components/CountUp.vue'
import EmptyState from '@/components/EmptyState.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'

const stats = ref({ publishing: 0, responses: 0, inConversation: 0 })
const activeView = ref<'published' | 'applied' | 'received'>('published')

const myProjects = ref<ProjectListItem[]>([])
const myApplications = ref<ApplicationItem[]>([])
const receivedApplications = ref<ReceivedApplicationItem[]>([])
const loading = ref(false)

const statusColumns: { status: ProjectStatus; label: string }[] = [
  { status: 'RECRUITING', label: '招募中' },
  { status: 'IN_PROGRESS', label: '进行中' },
  { status: 'PENDING_CONFIRM', label: '待确认' },
  { status: 'COMPLETED', label: '已完成' },
  { status: 'ARCHIVED', label: '已归档' },
]

const statusLabel: Record<string, string> = {
  PENDING: '待处理',
  ACCEPTED: '已通过',
  REJECTED: '未通过',
}

const projectsByStatus = computed(() => {
  const map: Record<string, ProjectListItem[]> = {}
  for (const col of statusColumns) map[col.status] = []
  for (const p of myProjects.value) map[p.status]?.push(p)
  return map
})

async function loadStats() {
  stats.value = await fetchMyProjectStats()
}

async function loadView() {
  loading.value = true
  try {
    if (activeView.value === 'published') myProjects.value = await fetchMyProjects()
    else if (activeView.value === 'applied') myApplications.value = await fetchMyApplications()
    else receivedApplications.value = await fetchReceivedApplications()
  } finally {
    loading.value = false
  }
}

function switchView(view: typeof activeView.value) {
  activeView.value = view
  loadView()
}

async function handleComplete(id: string) {
  await updateProjectStatus(id, 'COMPLETED')
  loadView()
  loadStats()
}

async function handleArchive(id: string) {
  await updateProjectStatus(id, 'ARCHIVED')
  loadView()
  loadStats()
}

onMounted(() => {
  loadStats()
  loadView()
})
</script>

<template>
  <PageContainer>
    <div class="tasks-layout">
      <div class="tasks-main">
        <div class="stats-row">
          <div class="stats-row__tile">
            <div class="stats-row__num"><CountUp :value="stats.publishing" /></div>
            <div class="stats-row__label">发布中</div>
          </div>
          <div class="stats-row__tile">
            <div class="stats-row__num"><CountUp :value="stats.responses" /></div>
            <div class="stats-row__label">响应</div>
          </div>
          <div class="stats-row__tile">
            <div class="stats-row__num"><CountUp :value="stats.inConversation" /></div>
            <div class="stats-row__label">沟通中</div>
          </div>
        </div>

        <div class="view-tabs">
          <button class="view-tab" :class="{ 'is-active': activeView === 'published' }" @click="switchView('published')">我发布的</button>
          <button class="view-tab" :class="{ 'is-active': activeView === 'applied' }" @click="switchView('applied')">我响应的</button>
          <button class="view-tab" :class="{ 'is-active': activeView === 'received' }" @click="switchView('received')">收到的申请</button>
        </div>

        <template v-if="loading">
          <SkeletonBlock v-for="i in 3" :key="i" :rows="2" />
        </template>

        <div v-else-if="activeView === 'published'" class="kanban">
          <StatusColumn
            v-for="col in statusColumns"
            :key="col.status"
            :label="col.label"
            :status="col.status"
            :projects="projectsByStatus[col.status]"
            @complete="handleComplete"
            @archive="handleArchive"
          />
        </div>

        <div v-else-if="activeView === 'applied'" class="list-view">
          <div v-for="app in myApplications" :key="app.id" class="list-item">
            <div class="list-item__header">
              <span class="list-item__title">{{ app.project.title }}</span>
              <span class="list-item__status" :class="`is-${app.status.toLowerCase()}`">{{ statusLabel[app.status] }}</span>
            </div>
            <span v-if="app.aiGenerated" class="list-item__ai-tag">AI 生成申请文案</span>
            <p class="list-item__content">{{ app.content }}</p>
          </div>
          <EmptyState v-if="myApplications.length === 0" text="还没有响应过项目" />
        </div>

        <div v-else class="list-view">
          <div v-for="app in receivedApplications" :key="app.id" class="list-item">
            <div class="list-item__header">
              <span class="list-item__title">{{ app.applicant.nickname }} · {{ app.project.title }}</span>
              <span class="list-item__status" :class="`is-${app.status.toLowerCase()}`">{{ statusLabel[app.status] }}</span>
            </div>
            <span class="list-item__meta">{{ app.applicant.professionalIdentity }} · {{ formatRelativeTime(app.createdAt) }}</span>
            <p class="list-item__content">{{ app.content }}</p>
          </div>
          <EmptyState v-if="receivedApplications.length === 0" text="还没有人响应你的项目" />
        </div>
      </div>

      <div class="tasks-side">
        <TodoPanel />
      </div>
    </div>
  </PageContainer>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.tasks-layout {
  display: grid;
  grid-template-columns: 1fr $opc-sidebar-width;
  gap: $opc-spacing-xl;
  align-items: start;
}

.tasks-main {
  // grid item 默认 min-width:auto，内容（kanban 横向滚动区）比 1fr 轨道宽的时候会把
  // 轨道本身撑宽，导致右边 sidebar 被推出视口——加 min-width:0 让这一列能正常收缩，
  // 溢出交给 .kanban 自己的 overflow-x 处理，不是让父级网格轨道跟着变宽
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-lg;
}

.stats-row {
  display: flex;
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card;
  box-shadow: $opc-shadow-sm;
  padding: $opc-spacing-lg 0;

  &__tile {
    flex: 1;
    text-align: center;
    border-left: 1px solid $opc-border-color;

    &:first-child {
      border-left: none;
    }
  }

  &__num {
    font-size: 28px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: $opc-color-accent;
  }

  &__label {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    margin-top: 4px;
  }
}

// 看板本身内容一少，页面下面会空出一大截——之前 view-tabs/kanban 是裸露
// 在页面背景上的，跟页面背景同色，空白部分和"内容区"完全分不清，显得像
// 没加载完。包一层有边框/阴影的卡片，看板到这里就结束了，卡片外面是正常
// 的页面留白，不是内容区域断在半空
.view-tabs {
  display: flex;
  gap: $opc-spacing-md;
  border-bottom: 1px solid $opc-border-color;
}

.view-tab {
  padding: $opc-spacing-xs $opc-spacing-sm;
  font-size: $opc-font-sm;
  color: $opc-color-text-secondary;
  border-bottom: 2px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: $opc-color-text;
  }

  &.is-active {
    color: $opc-color-accent;
    font-weight: 700;
    border-bottom-color: $opc-color-accent;
  }
}

.kanban {
  display: flex;
  gap: $opc-spacing-md;
  overflow-x: auto;
  padding-bottom: $opc-spacing-xs;
}

.list-view {
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-sm;
}

.list-item {
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card;
  box-shadow: $opc-shadow-sm;
  padding: $opc-spacing-lg;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $opc-shadow-glow;
    border-color: rgba($opc-color-accent, 0.4);
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
    padding: 2px 10px;
    border-radius: $opc-radius-tag;
    background: $opc-bg-subtle;
    color: $opc-color-text-secondary;

    &.is-accepted {
      background: rgba($opc-color-success, 0.12);
      color: $opc-color-success;
    }
    &.is-rejected {
      background: rgba($opc-color-danger, 0.12);
      color: $opc-color-danger;
    }
  }

  &__ai-tag {
    display: inline-block;
    font-size: 11px;
    color: $opc-color-accent;
    background: $opc-color-accent-soft;
    padding: 2px 10px;
    border-radius: $opc-radius-tag;
    margin-bottom: 6px;
  }

  &__meta {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
    display: block;
    margin-bottom: 4px;
  }

  &__content {
    margin: 0;
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    line-height: 1.6;
  }
}
</style>
