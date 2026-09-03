<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchProjectDetail } from '@/api/projects'
import { createApplication } from '@/api/applications'
import { getOrCreatePrivateConversation } from '@/api/messages'
import { useUserStore } from '@/store/user'
import { showToast } from '@/composables/useToast'
import type { ProjectDetail } from '@/types'
import PageContainer from '@/components/layout/PageContainer.vue'
import PublisherSidebar from '@/components/project/PublisherSidebar.vue'
import Icon from '@/components/Icon.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const detail = ref<ProjectDetail | null>(null)
const loading = ref(true)
const applying = ref(false)
const contacting = ref(false)
const applyDraft = ref('')
const showApplyForm = ref(false)

const kindLabel: Record<string, string> = { DEMAND: '需求', SUPPLY: '供给', MUTUAL: '互助' }
const statusLabel: Record<string, string> = {
  RECRUITING: '招募中',
  IN_PROGRESS: '进行中',
  PENDING_CONFIRM: '待确认',
  COMPLETED: '已完成',
  ARCHIVED: '已归档',
}

const isOwnProject = computed(() => detail.value?.publisher.id === userStore.currentUser?.id)

async function load() {
  loading.value = true
  try {
    detail.value = await fetchProjectDetail(route.params.id as string)
  } finally {
    loading.value = false
  }
}

async function handleApply() {
  if (!detail.value) return
  if (!applyDraft.value.trim()) {
    showToast('请先填写响应说明')
    return
  }
  applying.value = true
  try {
    await createApplication({ projectId: detail.value.id, content: applyDraft.value.trim() })
    showToast('已发送响应')
    showApplyForm.value = false
    applyDraft.value = ''
  } finally {
    applying.value = false
  }
}

async function handleContact() {
  if (!detail.value) return
  contacting.value = true
  try {
    const conversation = await getOrCreatePrivateConversation(detail.value.publisher.id, detail.value.id)
    router.push(`/messages?id=${conversation.id}`)
  } finally {
    contacting.value = false
  }
}

onMounted(() => {
  if (!userStore.currentUser) userStore.loadCurrentUser()
  load()
})
</script>

<template>
  <PageContainer>
    <div v-if="loading" class="detail-loading">
      <SkeletonBlock :rows="4" />
      <SkeletonBlock :rows="6" />
    </div>

    <div v-else-if="detail" class="detail-layout">
      <div class="detail-main">
        <div class="detail-main__badges">
          <span class="detail-main__kind" :class="`is-${detail.kind.toLowerCase()}`">{{ kindLabel[detail.kind] }}</span>
          <span v-if="detail.publishTier === 'BOUNTY'" class="detail-main__bounty">悬赏</span>
          <span class="detail-main__status">{{ statusLabel[detail.status] }}</span>
        </div>

        <h1 class="detail-main__title">{{ detail.title }}</h1>
        <p class="detail-main__background">{{ detail.background }}</p>

        <div class="detail-main__tags">
          <span v-for="tag in detail.skillTags" :key="tag.id" class="detail-main__tag">{{ tag.name }}</span>
        </div>

        <div class="detail-main__meta">
          <span>预算 {{ detail.budgetMin }}-{{ detail.budgetMax }} 元</span>
          <span>{{ detail.cycleWeeks }} 周周期</span>
        </div>

        <div v-if="detail.aiSummary" class="ai-callout">
          <div class="ai-callout__label">
            <Icon name="sparkle" size="14px" color="#7c6cff" />
            <span>AI 摘要</span>
          </div>
          <p>{{ detail.aiSummary }}</p>
        </div>

        <div v-reveal class="content-card">
          <section class="content-section">
            <h3>项目目标</h3>
            <p>{{ detail.goal }}</p>
          </section>
          <section class="content-section">
            <h3>核心功能</h3>
            <p>{{ detail.coreFeatures }}</p>
          </section>
          <section class="content-section">
            <h3>交付内容</h3>
            <p>{{ detail.deliverables }}</p>
          </section>
          <section class="content-section">
            <h3>验收标准</h3>
            <p>{{ detail.acceptanceCriteria }}</p>
          </section>
        </div>

        <div v-if="detail.roles.length" v-reveal class="content-card">
          <section class="content-section">
            <h3>正在招募</h3>
            <div v-for="role in detail.roles" :key="role.id" class="role-row">
              <span>{{ role.roleName }}</span>
              <span>{{ role.filledCount }}/{{ role.headcount }} 人</span>
            </div>
          </section>
        </div>
      </div>

      <div class="detail-side">
        <PublisherSidebar :publisher="detail.publisher">
          <div v-if="detail.aiMatch" class="ai-match">
            <Icon name="sparkle" size="12px" color="#7c6cff" />
            <span>匹配度 {{ detail.aiMatch.score }}% · {{ detail.aiMatch.reason }}</span>
          </div>

          <template v-if="!isOwnProject">
            <button class="btn btn--primary" :disabled="contacting" @click="handleContact">发起对话</button>
            <button v-if="!showApplyForm" class="btn btn--outline" @click="showApplyForm = true">我要响应</button>
            <div v-else class="apply-form">
              <textarea v-model="applyDraft" placeholder="说说你能提供什么、为什么合适" rows="4" />
              <button class="btn btn--primary" :disabled="applying" @click="handleApply">发送响应</button>
            </div>
          </template>
          <p v-else class="own-hint">这是你发布的项目，去"任务"页查看收到的响应</p>
        </PublisherSidebar>
      </div>
    </div>
  </PageContainer>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.detail-loading {
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-md;
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr $opc-sidebar-width;
  gap: $opc-spacing-xl;
  align-items: start;
}

.detail-main {
  // grid item 默认 min-width:auto，长文本/宽内容会把 1fr 轨道撑宽、挤掉右侧 sidebar
  // （tasks 页 kanban 就实际踩到过这个问题），这里提前加上防止同样的坑
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-lg;

  &__badges {
    display: flex;
    gap: $opc-spacing-xxs;
  }

  &__kind {
    font-size: $opc-font-xs;
    font-weight: 600;
    padding: 3px 12px;
    border-radius: $opc-radius-tag;

    &.is-demand {
      color: $opc-color-kind-demand;
      background: rgba($opc-color-kind-demand, 0.1);
    }
    &.is-supply {
      color: $opc-color-kind-supply;
      background: rgba($opc-color-kind-supply, 0.1);
    }
    &.is-mutual {
      color: $opc-color-kind-mutual;
      background: rgba($opc-color-kind-mutual, 0.1);
    }
  }

  &__bounty {
    font-size: $opc-font-xs;
    font-weight: 700;
    color: #fff;
    background: $opc-gradient-primary;
    padding: 3px 12px;
    border-radius: $opc-radius-tag;
  }

  &__status {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
    padding: 3px 12px;
    border-radius: $opc-radius-tag;
    background: $opc-bg-subtle;
  }

  &__title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
  }

  &__background {
    margin: 0;
    font-size: $opc-font-base;
    color: $opc-color-text-secondary;
    line-height: 1.6;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $opc-spacing-xxs;
  }

  &__tag {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    background: $opc-bg-subtle;
    padding: 4px 14px;
    border-radius: $opc-radius-tag;
  }

  &__meta {
    display: flex;
    gap: $opc-spacing-md;
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
  }
}

.ai-callout {
  background: $opc-color-accent-soft;
  border-radius: $opc-radius-card-sm;
  padding: $opc-spacing-sm $opc-spacing-md;

  &__label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: $opc-font-sm;
    font-weight: 700;
    color: $opc-color-accent;
    margin-bottom: 4px;
  }

  p {
    margin: 0;
    font-size: $opc-font-sm;
    color: $opc-color-text;
    line-height: 1.6;
  }
}

.content-card {
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card;
  box-shadow: $opc-shadow-sm;
  padding: 0 $opc-spacing-lg;
}

.content-section {
  padding: $opc-spacing-lg 0;
  border-top: 1px solid $opc-border-color;

  &:first-child {
    border-top: none;
  }

  h3 {
    position: relative;
    margin: 0 0 $opc-spacing-sm;
    padding-left: 10px;
    font-size: $opc-font-base;
    font-weight: 700;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 3px;
      bottom: 3px;
      width: 3px;
      border-radius: $opc-radius-tag;
      background: $opc-color-accent;
    }
  }

  p {
    margin: 0;
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    line-height: 1.6;
  }
}

.role-row {
  display: flex;
  justify-content: space-between;
  padding: $opc-spacing-xs $opc-spacing-sm;
  background: $opc-bg-subtle;
  border-radius: $opc-radius-card-sm;
  font-size: $opc-font-sm;
  margin-bottom: $opc-spacing-xxs;

  &:last-child {
    margin-bottom: 0;
  }
}

.ai-match {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: $opc-color-accent;
  background: $opc-color-accent-soft;
  border-radius: $opc-radius-card-sm;
  padding: $opc-spacing-xs;
  line-height: 1.5;
}

.btn {
  width: 100%;
  padding: 10px;
  border-radius: $opc-radius-tag;
  font-size: $opc-font-sm;
  font-weight: 600;
  transition: opacity 0.15s ease, background 0.15s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--primary {
    background: $opc-gradient-primary;
    color: #fff;

    &:hover:not(:disabled) {
      filter: brightness(1.08);
    }
  }

  &--outline {
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    color: $opc-color-text;

    &:hover {
      background: $opc-bg-subtle;
    }
  }
}

.apply-form {
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-xs;

  textarea {
    width: 100%;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card-sm;
    padding: $opc-spacing-xs;
    font-size: $opc-font-sm;
    resize: vertical;
  }
}

.own-hint {
  font-size: $opc-font-xs;
  color: $opc-color-text-placeholder;
  text-align: center;
  margin: 0;
}
</style>
