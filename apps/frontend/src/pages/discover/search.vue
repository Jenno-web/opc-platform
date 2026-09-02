<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ProjectCard from '@/components/ProjectCard.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import { searchProjects } from '@/api/projects'
import type { ProjectKind, SearchResult } from '@/types'

// 对应"02 搜索与筛选"画板。核心三个筛选项（类型/技能/预算）真实生效；
// "合作方式"这排 chip 是画板里"可远程/首章新所/长期共创"的视觉还原，暂不接入真实筛选逻辑（见 README 边界声明）。
const keyword = ref('')
const kindOptions: { label: string; value: ProjectKind }[] = [
  { label: '需求', value: 'DEMAND' },
  { label: '供给', value: 'SUPPLY' },
  { label: '互助', value: 'MUTUAL' },
]
const activeKind = ref<ProjectKind | null>(null)

const skillOptions = ['AI工具', '产品设计', '前端开发', '后端开发', 'UI设计', '增长运营']
const activeSkills = ref<string[]>([])

const budgetMin = ref<string>('')
const budgetMax = ref<string>('')

const cooperationOptions = ['可远程', '首选沪上', '长期共创']

const results = ref<SearchResult[]>([])
const loading = ref(false)

function toggleKind(kind: ProjectKind) {
  activeKind.value = activeKind.value === kind ? null : kind
}

function toggleSkill(skill: string) {
  const index = activeSkills.value.indexOf(skill)
  if (index === -1) activeSkills.value.push(skill)
  else activeSkills.value.splice(index, 1)
}

async function runSearch() {
  loading.value = true
  try {
    results.value = await searchProjects({
      keyword: keyword.value || undefined,
      kind: activeKind.value ?? undefined,
      skillNames: activeSkills.value.length ? activeSkills.value : undefined,
      budgetMin: budgetMin.value ? Number(budgetMin.value) : undefined,
      budgetMax: budgetMax.value ? Number(budgetMax.value) : undefined,
    })
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  keyword.value = ''
  activeKind.value = null
  activeSkills.value = []
  budgetMin.value = ''
  budgetMax.value = ''
  runSearch()
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/project/detail?id=${id}` })
}

onMounted(runSearch)
</script>

<template>
  <view class="search">
    <input
      v-model="keyword"
      class="search__input"
      placeholder="搜索项目关键词"
      confirm-type="search"
      @confirm="runSearch"
    />

    <!-- 之前四个筛选分组是纯堆叠、只靠 margin 隔开，现在合并进一个卡片，内部用分隔线区隔 -->
    <view class="search__filter-card">
      <view class="search__group">
        <text class="search__group-title">供需类型</text>
        <view class="search__chips">
          <view
            v-for="opt in kindOptions"
            :key="opt.value"
            class="search__chip"
            hover-class="opc-hover"
            :class="{ 'is-active': activeKind === opt.value }"
            @click="toggleKind(opt.value); runSearch()"
          >
            <text>{{ opt.label }}</text>
          </view>
        </view>
      </view>

      <view class="search__group">
        <text class="search__group-title">能力领域（可多选）</text>
        <view class="search__chips">
          <view
            v-for="skill in skillOptions"
            :key="skill"
            class="search__chip"
            hover-class="opc-hover"
            :class="{ 'is-active': activeSkills.includes(skill) }"
            @click="toggleSkill(skill); runSearch()"
          >
            <text>{{ skill }}</text>
          </view>
        </view>
      </view>

      <view class="search__group">
        <text class="search__group-title">预算 / 回报</text>
        <view class="search__budget-row">
          <input v-model="budgetMin" class="search__budget-input" type="number" placeholder="最低" @blur="runSearch" />
          <text class="search__budget-sep">-</text>
          <input v-model="budgetMax" class="search__budget-input" type="number" placeholder="最高" @blur="runSearch" />
          <text class="search__unit">元</text>
        </view>
        <view class="search__chips">
          <text class="search__chip is-static">资源置换</text>
          <text class="search__chip is-static">分成</text>
          <text class="search__chip is-static">算力额度</text>
        </view>
      </view>

      <view class="search__group">
        <text class="search__group-title">合作方式</text>
        <view class="search__chips">
          <text v-for="opt in cooperationOptions" :key="opt" class="search__chip is-static">{{ opt }}</text>
        </view>
      </view>
    </view>

    <view class="search__toolbar">
      <text class="search__clear" hover-class="opc-hover" @click="clearFilters">清除</text>
      <text class="search__count">共 {{ results.length }} 条结果</text>
    </view>

    <template v-if="loading">
      <SkeletonBlock v-for="i in 3" :key="i" :rows="2" />
    </template>
    <template v-else>
      <ProjectCard
        v-for="(r, index) in results"
        :key="r.project.id"
        class="opc-fade-in"
        :style="{ '--opc-stagger': Math.min(index, 6) }"
        :project="{ ...r.project, matchScore: r.matchScore, matchReason: r.matchReason }"
        @click="goDetail"
      />
      <EmptyState v-if="results.length === 0" text="没有找到匹配的机会" hint="试试调整筛选条件" />
    </template>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.search {
  padding: $opc-spacing;
  padding-bottom: 80rpx;

  &__input {
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-tag;
    padding: $opc-spacing-xs $opc-spacing-sm;
    font-size: $opc-font-base;
    margin-bottom: $opc-spacing-lg;
  }

  &__filter-card {
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    box-shadow: $opc-shadow-sm;
    padding: $opc-spacing 0;
    margin-bottom: $opc-spacing-sm;
  }

  &__group {
    padding: $opc-spacing-sm $opc-spacing;

    &:not(:first-child) {
      border-top: 1px solid $opc-border-color;
    }
  }

  &__group-title {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    margin-bottom: $opc-spacing-xxs;
    display: block;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: $opc-spacing-xxs;
  }

  &__chip {
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

    // 仅视觉还原，未接入真实筛选逻辑
    &.is-static {
      opacity: 0.5;
    }
  }

  &__budget-row {
    display: flex;
    align-items: center;
    gap: $opc-spacing-xxs;
    margin-bottom: $opc-spacing-xxs;
  }

  &__budget-input {
    flex: 1;
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card-sm;
    padding: $opc-spacing-xxs $opc-spacing-xs;
    font-size: $opc-font-base;
  }

  &__budget-sep {
    color: $opc-color-text-secondary;
  }

  &__unit {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
  }

  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: $opc-spacing-sm 0 $opc-spacing-sm;
    padding-top: $opc-spacing-sm;
    border-top: 1px solid $opc-border-color;
  }

  &__clear {
    display: inline-block;
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    padding: $opc-spacing-xxs;
  }

  &__count {
    font-size: $opc-font-sm;
    font-weight: 600;
  }
}
</style>
