<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchKnowledgeEntries, updateKnowledgeEntry } from '@/api/knowledge'
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
    <view v-for="entry in entries" :key="entry.id" class="knowledge__item">
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
          <text class="knowledge__action" @click="saveEdit(entry)">保存</text>
          <text class="knowledge__action is-secondary" @click="editingId = ''">取消</text>
        </view>
      </template>
      <template v-else>
        <text class="knowledge__lessons">{{ entry.lessonsLearned }}</text>
        <text class="knowledge__action" @click="startEdit(entry)">编辑</text>
      </template>
    </view>
    <view v-if="!loading && entries.length === 0" class="knowledge__empty">暂无知识库沉淀</view>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.knowledge {
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
    align-items: center;
    margin-bottom: 12rpx;
  }

  &__project {
    font-size: 26rpx;
    font-weight: 600;
  }

  &__ai-tag {
    font-size: 18rpx;
    color: $opc-color-ai;
    background: $opc-color-primary-soft;
    padding: 4rpx 12rpx;
    border-radius: $opc-radius-tag;
  }

  &__label {
    display: block;
    font-size: 20rpx;
    color: $opc-color-text-secondary;
    margin: 16rpx 0 6rpx;
  }

  &__summary,
  &__lessons {
    display: block;
    font-size: 24rpx;
    line-height: 1.6;
  }

  &__textarea {
    width: 100%;
    min-height: 120rpx;
    font-size: 24rpx;
    background: $opc-bg-page;
    border-radius: 12rpx;
    padding: 12rpx;
  }

  &__actions {
    display: flex;
    gap: 20rpx;
    margin-top: 12rpx;
  }

  &__action {
    font-size: 22rpx;
    color: $opc-color-primary;
    margin-top: 12rpx;
    display: inline-block;

    &.is-secondary {
      color: $opc-color-text-secondary;
    }
  }

  &__empty {
    text-align: center;
    color: $opc-color-text-secondary;
    font-size: 24rpx;
    padding: 80rpx 0;
  }
}
</style>
