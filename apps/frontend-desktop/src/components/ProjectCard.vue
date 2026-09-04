<script setup lang="ts">
import type { ProjectListItem } from '@/types'
import { formatRelativeTime } from '@/utils/time'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'

defineProps<{
  project: ProjectListItem
  matchScore?: number
  matchReason?: string
}>()

const kindLabel: Record<string, string> = { DEMAND: '需求', SUPPLY: '供给', MUTUAL: '互助' }
const statusLabel: Record<string, string> = {
  RECRUITING: '招募中',
  IN_PROGRESS: '进行中',
  PENDING_CONFIRM: '待确认',
  COMPLETED: '已完成',
  ARCHIVED: '已归档',
}
</script>

<template>
  <RouterLink :to="`/discover/${project.id}`" class="project-card">
    <div class="project-card__header">
      <div class="project-card__badges">
        <span class="project-card__kind" :class="`is-${project.kind.toLowerCase()}`">{{ kindLabel[project.kind] }}</span>
        <span v-if="project.publishTier === 'BOUNTY'" class="project-card__bounty">悬赏</span>
      </div>
      <span class="project-card__status" :class="`is-${project.status.toLowerCase()}`">{{ statusLabel[project.status] }}</span>
    </div>

    <h3 class="project-card__title">{{ project.title }}</h3>
    <p class="project-card__desc">{{ project.background }}</p>

    <div class="project-card__tags">
      <span v-for="tag in project.skillTags" :key="tag.id" class="project-card__tag">{{ tag.name }}</span>
    </div>

    <div v-if="matchScore ?? project.matchScore" class="project-card__match">
      <span class="project-card__match-score">
        <Icon name="sparkle" size="12px" color="#ffffff" />
        <span>匹配 {{ matchScore ?? project.matchScore }}%</span>
      </span>
      <span class="project-card__match-reason">{{ matchReason ?? project.matchReason }}</span>
    </div>

    <div class="project-card__footer">
      <div class="project-card__publisher">
        <Avatar :name="project.publisher.nickname" :avatar-url="project.publisher.avatarUrl" size="24px" />
        <span>{{ project.publisher.nickname }} · {{ project.heat }} 人看过</span>
      </div>
      <span class="project-card__time">{{ formatRelativeTime(project.createdAt) }}</span>
    </div>

    <div class="project-card__meta">
      <span>预算 {{ project.budgetMin }}-{{ project.budgetMax }} 元</span>
      <span>{{ project.cycleWeeks }} 周周期</span>
    </div>
  </RouterLink>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.project-card {
  display: flex;
  flex-direction: column;
  gap: $opc-spacing;
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card;
  box-shadow: $opc-shadow-sm;
  padding: $opc-spacing-lg;
  // transition 是单值属性，跟用 v-reveal 时全局 .opc-reveal 的揭示过渡声明
  // 会互相顶掉，不会合并——之前 opacity 因此完全没有过渡、一进视口瞬间可见，
  // 看着像"哐"一下弹出来。这里把 opacity/transform 的揭示过渡合并进这条
  // hover 用的声明里（这个组件在发现页网格、任务列表等多处都配合 v-reveal 用）
  transition: opacity 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $opc-shadow-glow;
    border-color: rgba($opc-color-accent, 0.5);
  }

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
    padding: 2px 10px;
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
    padding: 2px 10px;
    border-radius: $opc-radius-tag;
  }

  &__status {
    font-size: $opc-font-xs;
    padding: 3px 10px;
    border-radius: $opc-radius-tag;
    background: $opc-bg-subtle;
    color: $opc-color-text-secondary;
    white-space: nowrap;

    &.is-recruiting {
      color: $opc-color-accent;
      background: rgba($opc-color-accent, 0.1);
    }
    &.is-in_progress {
      color: $opc-color-kind-supply;
      background: rgba($opc-color-kind-supply, 0.1);
    }
    &.is-pending_confirm {
      color: $opc-color-warning;
      background: rgba($opc-color-warning, 0.1);
    }
    &.is-completed {
      color: $opc-color-success;
      background: rgba($opc-color-success, 0.1);
    }
  }

  &__title {
    margin: 0;
    font-size: $opc-font-lg;
    font-weight: 700;
    color: $opc-color-text;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__desc {
    margin: 0;
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: calc(1.6em * 2);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $opc-spacing-xxs;
  }

  &__tag {
    font-size: 11px;
    color: $opc-color-text-secondary;
    background: $opc-bg-subtle;
    padding: 3px 10px;
    border-radius: $opc-radius-tag;
  }

  &__match {
    display: flex;
    align-items: center;
    gap: $opc-spacing-xxs;
    font-size: $opc-font-xs;
  }

  &__match-score {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
    color: #fff;
    background: $opc-gradient-primary;
    padding: 2px 8px;
    border-radius: $opc-radius-tag;
    font-weight: 700;
  }

  &__match-reason {
    color: $opc-color-text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
    padding-top: $opc-spacing-sm;
    border-top: 1px solid $opc-border-color;
  }

  &__publisher {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__time {
    flex-shrink: 0;
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }
}
</style>
