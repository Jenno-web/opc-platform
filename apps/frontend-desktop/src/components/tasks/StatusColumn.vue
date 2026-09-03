<script setup lang="ts">
import type { ProjectListItem, ProjectStatus } from '@/types'

defineProps<{
  label: string
  status: ProjectStatus
  projects: ProjectListItem[]
}>()

const emit = defineEmits<{
  (e: 'complete', id: string): void
  (e: 'archive', id: string): void
}>()
</script>

<template>
  <div class="status-column">
    <div class="status-column__header">
      <span>{{ label }}</span>
      <span class="status-column__count">{{ projects.length }}</span>
    </div>
    <div class="status-column__list">
      <div
        v-for="(p, index) in projects"
        :key="p.id"
        v-reveal
        class="kanban-card"
        :style="{ '--opc-stagger': Math.min(index, 6) }"
      >
        <RouterLink :to="`/discover/${p.id}`" class="kanban-card__link">
          <div class="kanban-card__title">{{ p.title }}</div>
          <div class="kanban-card__meta">
            <span>{{ p.budgetMin }}-{{ p.budgetMax }} 元</span>
            <span>{{ p.cycleWeeks }} 周</span>
          </div>
        </RouterLink>
        <div v-if="status !== 'COMPLETED' && status !== 'ARCHIVED'" class="kanban-card__actions">
          <button class="kanban-card__action" @click="emit('complete', p.id)">标记解决</button>
          <button class="kanban-card__action is-danger" @click="emit('archive', p.id)">下架</button>
        </div>
      </div>
      <p v-if="projects.length === 0" class="status-column__empty">暂无</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.status-column {
  flex: 0 0 260px;
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-sm;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: $opc-font-sm;
    font-weight: 700;
    color: $opc-color-text-secondary;
    padding: 0 4px;
  }

  &__count {
    background: $opc-bg-subtle;
    border-radius: $opc-radius-tag;
    padding: 1px 8px;
    font-size: 11px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $opc-spacing-sm;
    background: $opc-bg-subtle;
    border-radius: $opc-radius-card;
    padding: $opc-spacing-sm;
    min-height: 80px;
  }

  &__empty {
    text-align: center;
    font-size: $opc-font-xs;
    color: $opc-color-text-placeholder;
    margin: $opc-spacing-sm 0;
  }
}

.kanban-card {
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card-sm;
  box-shadow: $opc-shadow-sm;
  overflow: hidden;

  &__link {
    display: block;
    padding: $opc-spacing-sm $opc-spacing;

    &:hover {
      background: $opc-bg-subtle;
    }
  }

  &__title {
    font-size: $opc-font-sm;
    font-weight: 600;
    line-height: 1.5;
    margin-bottom: 6px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: $opc-color-text-secondary;
  }

  &__actions {
    display: flex;
    border-top: 1px solid $opc-border-color;
  }

  &__action {
    flex: 1;
    font-size: 11px;
    padding: 6px;
    color: $opc-color-text-secondary;

    &:hover {
      background: $opc-bg-subtle;
    }

    &.is-danger {
      color: $opc-color-danger;
      border-left: 1px solid $opc-border-color;
    }
  }
}
</style>
