<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PublishFab from '@/components/PublishFab.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { fetchHotProjects, fetchProjectList, fetchRecommendations } from '@/api/projects'
import type { ProjectKind, ProjectListItem, PublishTier, RecommendationResult } from '@/types'

// 对应"01 发现&机会信息流"画板顶部的分类 chips
type ChipValue = 'recommend' | 'bounty' | 'certified' | 'supply' | 'demand'
const chips: { label: string; value: ChipValue }[] = [
  { label: '推荐', value: 'recommend' },
  { label: '悬赏', value: 'bounty' },
  { label: '认证机会', value: 'certified' },
  { label: '供给', value: 'supply' },
  { label: '需求', value: 'demand' },
]
const activeChip = ref<ChipValue>('recommend')

const recommendations = ref<RecommendationResult[]>([])
const listItems = ref<ProjectListItem[]>([])
const loading = ref(false)

async function loadRecommend() {
  recommendations.value = await fetchRecommendations()
}

async function loadByChip(chip: ChipValue) {
  loading.value = true
  try {
    if (chip === 'recommend') {
      if (!recommendations.value.length) await loadRecommend()
      listItems.value = []
      return
    }
    if (chip === 'bounty') {
      listItems.value = await fetchProjectList({ publishTier: 'BOUNTY' as PublishTier })
      return
    }
    if (chip === 'certified') {
      // 低保真稿里的"认证机会"没有独立的后端字段，先用热度排序近似（见 README 边界声明）
      listItems.value = await fetchHotProjects()
      return
    }
    if (chip === 'supply') {
      listItems.value = await fetchProjectList({ kind: 'SUPPLY' as ProjectKind })
      return
    }
    listItems.value = await fetchProjectList({ kind: 'DEMAND' as ProjectKind })
  } finally {
    loading.value = false
  }
}

function switchChip(chip: ChipValue) {
  activeChip.value = chip
  loadByChip(chip)
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/project/detail?id=${id}` })
}

function goSearch() {
  uni.navigateTo({ url: '/pages/discover/search' })
}

onMounted(() => loadByChip('recommend'))
</script>

<template>
  <view class="discover">
    <view class="discover__header">
      <text class="discover__brand">培风社 OPC</text>
      <text class="discover__search-icon" @click="goSearch">🔍</text>
    </view>

    <view class="discover__chips">
      <text
        v-for="chip in chips"
        :key="chip.value"
        class="discover__chip"
        :class="{ 'is-active': activeChip === chip.value }"
        @click="switchChip(chip.value)"
      >
        {{ chip.label }}
      </text>
    </view>

    <template v-if="activeChip === 'recommend'">
      <view v-if="recommendations.length" class="discover__banner">
        <text class="discover__banner-title">今日匹配</text>
        <text class="discover__banner-desc">{{ recommendations.length }} 条机会与你的方向相关</text>
      </view>

      <ProjectCard
        v-for="r in recommendations"
        :key="r.project.id"
        :project="{ ...r.project, matchScore: r.matchScore, matchReason: r.reason }"
        @click="goDetail"
      />
      <view v-if="!loading && recommendations.length === 0" class="discover__empty">暂无推荐，去搜索页看看全部机会</view>
    </template>

    <template v-else>
      <ProjectCard v-for="p in listItems" :key="p.id" :project="p" @click="goDetail" />
      <view v-if="!loading && listItems.length === 0" class="discover__empty">这个分类下暂无内容</view>
    </template>

    <PublishFab />
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.discover {
  padding: $opc-spacing;
  padding-bottom: 160rpx;
  min-height: 100vh;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
  }

  &__brand {
    font-size: 34rpx;
    font-weight: 700;
    color: $opc-color-text;
  }

  &__search-icon {
    font-size: 32rpx;
  }

  &__chips {
    display: flex;
    gap: 16rpx;
    overflow-x: auto;
    white-space: nowrap;
    margin-bottom: 28rpx;
  }

  &__chip {
    font-size: 24rpx;
    padding: 12rpx 26rpx;
    border-radius: $opc-radius-tag;
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    color: $opc-color-text-secondary;

    &.is-active {
      background: $opc-color-primary;
      border-color: $opc-color-primary;
      color: #ffffff;
      font-weight: 600;
    }
  }

  &__banner {
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    padding: 20rpx 24rpx;
    margin-bottom: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__banner-title {
    font-size: 24rpx;
    font-weight: 700;
    color: $opc-color-text;
  }

  &__banner-desc {
    font-size: 22rpx;
    color: $opc-color-text-secondary;
  }

  &__empty {
    text-align: center;
    color: $opc-color-text-secondary;
    font-size: 24rpx;
    padding: 60rpx 0;
  }
}
</style>
