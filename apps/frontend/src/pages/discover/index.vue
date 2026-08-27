<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PublishFab from '@/components/PublishFab.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
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
      <view class="discover__search-icon" hover-class="opc-hover" @click="goSearch">🔍</view>
    </view>
    <text class="discover__title">发现机会</text>

    <view class="discover__chips">
      <view
        v-for="chip in chips"
        :key="chip.value"
        class="discover__chip"
        hover-class="opc-hover"
        :class="{ 'is-active': activeChip === chip.value }"
        @click="switchChip(chip.value)"
      >
        <text>{{ chip.label }}</text>
      </view>
    </view>

    <template v-if="loading">
      <SkeletonBlock v-for="i in 3" :key="i" :rows="2" />
    </template>

    <template v-else-if="activeChip === 'recommend'">
      <view v-if="recommendations.length" class="discover__banner opc-fade-in">
        <text class="discover__banner-title">今日匹配</text>
        <text class="discover__banner-desc">{{ recommendations.length }} 条机会与你的方向相关</text>
      </view>

      <ProjectCard
        v-for="r in recommendations"
        :key="r.project.id"
        class="opc-fade-in"
        :project="{ ...r.project, matchScore: r.matchScore, matchReason: r.reason }"
        @click="goDetail"
      />
      <EmptyState v-if="recommendations.length === 0" text="暂无推荐" hint="去搜索页看看全部机会" />
    </template>

    <template v-else>
      <ProjectCard v-for="p in listItems" :key="p.id" class="opc-fade-in" :project="p" @click="goDetail" />
      <EmptyState v-if="listItems.length === 0" text="这个分类下暂无内容" />
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
    margin-bottom: $opc-spacing-xxs;
  }

  // Figma 里"培风社 OPC"是大标题上方的小 kicker（21rpx/700/#666），不是页面主标题
  &__brand {
    font-size: $opc-font-sm;
    font-weight: 700;
    color: $opc-color-text-secondary;
  }

  &__search-icon {
    font-size: 32rpx;
    padding: $opc-spacing-xxs;
    border-radius: 50%;
  }

  // 页面主标题，对应画板里的 Heading 1「发现机会」，56rpx/860
  &__title {
    display: block;
    font-size: $opc-font-display;
    font-weight: 800;
    color: $opc-color-text;
    margin-bottom: $opc-spacing-sm;
  }

  &__chips {
    display: flex;
    gap: $opc-spacing-xxs;
    overflow-x: auto;
    white-space: nowrap;
    margin-bottom: $opc-spacing-lg;
  }

  &__chip {
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
      color: #ffffff;
      font-weight: 600;
    }
  }

  &__banner {
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    padding: $opc-spacing-sm;
    margin-bottom: $opc-spacing-sm;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__banner-title {
    font-size: $opc-font-sm;
    font-weight: 700;
    color: $opc-color-text;
  }

  &__banner-desc {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
  }
}
</style>
