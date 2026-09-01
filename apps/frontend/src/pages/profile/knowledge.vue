<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchKnowledgeEntries, updateKnowledgeEntry } from '@/api/knowledge'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import type { KnowledgeEntryItem } from '@/types'

const entries = ref<KnowledgeEntryItem[]>([])
const loading = ref(true)
const editingId = ref('')
const draftText = ref('')

onMounted(async () => {
  loading.value = true
  try {
    entries.value = await fetchKnowledgeEntries()
  } finally {
    loading.value = false
  }
})

function startEdit(entry: KnowledgeEntryItem) {
  editingId.value = entry.id
  draftText.value = entry.lessonsLearned
}

async function saveEdit(entry: KnowledgeEntryItem) {
  const updated = await updateKnowledgeEntry(entry.id, { lessonsLearned: draftText.value })
  const index = entries.value.findIndex((e) => e.id === entry.id)
  if (index !== -1) entries.value[index] = updated
  editingId.value = ''
}
</script>

<template>
  <view class="knowledge">
    <template v-if="loading">
      <SkeletonBlock v-for="i in 3" :key="i" :rows="3" />
    </template>
    <template v-else>
      <view v-for="entry in entries" :key="entry.id" class="knowledge__item opc-fade-in">
        <view class="knowledge__header">
          <text class="knowledge__project">{{ entry.project?.title ?? '通用经验' }}</text>
          <text v-if="entry.aiGenerated" class="knowledge__ai-tag">
            AI 生成{{ entry.editedByUser ? ' · 已编辑' : '' }}
          </text>
        </view>

        <text class="knowledge__label">复盘总结</text>
        <text class="knowledge__summary">{{ entry.summary }}</text>

        <text class="knowledge__label">经验沉淀</text>
        <template v-if="editingId === entry.id">
          <textarea v-model="draftText" class="knowledge__textarea" />
          <view class="knowledge__actions">
            <text class="knowledge__action" hover-class="opc-hover" @click="saveEdit(entry)">保存</text>
            <text class="knowledge__action is-secondary" hover-class="opc-hover" @click="editingId = ''">取消</text>
          </view>
        </template>
        <template v-else>
          <text class="knowledge__lessons">{{ entry.lessonsLearned }}</text>
          <text class="knowledge__action" hover-class="opc-hover" @click="startEdit(entry)">编辑</text>
        </template>
      </view>
      <EmptyState v-if="entries.length === 0" text="暂无知识库沉淀" />
    </template>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.knowledge {
  padding: $opc-spacing;

  &__item {
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    box-shadow: $opc-shadow-sm;
    padding: $opc-spacing;
    margin-bottom: $opc-spacing-sm;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $opc-spacing-xxs;
  }

  &__project {
    font-size: $opc-font-base;
    font-weight: 600;
  }

  &__ai-tag {
    font-size: $opc-font-micro;
    color: $opc-color-ai;
    background: $opc-color-primary-soft;
    padding: 4rpx 12rpx;
    border-radius: $opc-radius-tag;
  }

  &__label {
    display: block;
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
    margin: $opc-spacing-xs 0 6rpx;
  }

  &__summary,
  &__lessons {
    display: block;
    font-size: $opc-font-base;
    line-height: 1.6;
  }

  &__textarea {
    width: 100%;
    min-height: 120rpx;
    font-size: $opc-font-base;
    background: $opc-bg-page;
    border-radius: 12rpx;
    padding: $opc-spacing-xxs;
  }

  &__actions {
    display: flex;
    gap: $opc-spacing-sm;
    margin-top: $opc-spacing-xxs;
  }

  &__action {
    font-size: $opc-font-sm;
    color: $opc-color-primary;
    margin-top: $opc-spacing-xxs;
    display: inline-block;

    &.is-secondary {
      color: $opc-color-text-secondary;
    }
  }
}
</style>
