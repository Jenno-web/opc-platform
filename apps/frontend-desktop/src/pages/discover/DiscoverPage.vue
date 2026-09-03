<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchProjectList, fetchRecommendations } from '@/api/projects'
import type { ProjectKind, ProjectListItem, RecommendationResult } from '@/types'
import ProjectCard from '@/components/ProjectCard.vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import EmptyState from '@/components/EmptyState.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import Icon from '@/components/Icon.vue'

const keyword = ref('')
const activeKind = ref<ProjectKind | null>(null)
const sort = ref<'createdAt' | 'heat'>('createdAt')

const kindOptions: { label: string; value: ProjectKind }[] = [
  { label: '需求', value: 'DEMAND' },
  { label: '供给', value: 'SUPPLY' },
  { label: '互助', value: 'MUTUAL' },
]

const projects = ref<ProjectListItem[]>([])
const recommendations = ref<RecommendationResult[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    projects.value = await fetchProjectList({
      keyword: keyword.value || undefined,
      kind: activeKind.value ?? undefined,
    })
    if (sort.value === 'heat') {
      projects.value = [...projects.value].sort((a, b) => b.heat - a.heat)
    }
  } finally {
    loading.value = false
  }
}

function toggleKind(kind: ProjectKind) {
  activeKind.value = activeKind.value === kind ? null : kind
  load()
}

onMounted(async () => {
  load()
  try {
    recommendations.value = await fetchRecommendations()
  } catch {
    // 推荐加载失败不影响主列表
  }
})
</script>

<template>
  <PageContainer>
    <section class="hero">
      <h1 class="hero__title">发现真实的协作机会</h1>
      <p class="hero__subtitle">需求、供给、互助——找到值得投入的项目，或者被值得信任的人找到</p>
      <div class="hero__search">
        <Icon name="search" size="18px" color="#9a9a9a" />
        <input
          v-model="keyword"
          class="hero__search-input"
          placeholder="搜索项目关键词"
          @keyup.enter="load"
        />
      </div>
    </section>

    <div class="filter-row">
      <div class="filter-row__chips">
        <button
          v-for="opt in kindOptions"
          :key="opt.value"
          class="filter-chip"
          :class="{ 'is-active': activeKind === opt.value }"
          @click="toggleKind(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
      <select v-model="sort" class="filter-row__sort" @change="load">
        <option value="createdAt">最新发布</option>
        <option value="heat">最多关注</option>
      </select>
    </div>

    <section v-if="recommendations.length" class="recommend-rail">
      <div class="recommend-rail__title">
        <Icon name="sparkle" size="16px" color="#3B4BC4" />
        <span>为你推荐</span>
      </div>
      <div class="recommend-rail__list">
        <ProjectCard
          v-for="r in recommendations"
          :key="r.project.id"
          :project="r.project"
          :match-score="r.matchScore"
          :match-reason="r.reason"
          class="recommend-rail__card"
        />
      </div>
    </section>

    <section class="project-grid">
      <template v-if="loading">
        <SkeletonBlock v-for="i in 6" :key="i" :rows="3" />
      </template>
      <template v-else>
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <EmptyState v-if="projects.length === 0" text="没有找到匹配的机会" hint="试试调整筛选条件" />
      </template>
    </section>
  </PageContainer>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.hero {
  background: $opc-color-accent-soft;
  border-radius: $opc-radius-card;
  padding: $opc-spacing-xl;
  margin-bottom: $opc-spacing-lg;

  &__title {
    margin: 0 0 $opc-spacing-xs;
    font-size: $opc-font-display;
    font-weight: 700;
    color: $opc-color-text;
  }

  &__subtitle {
    margin: 0 0 $opc-spacing-md;
    font-size: $opc-font-base;
    color: $opc-color-text-secondary;
  }

  &__search {
    display: flex;
    align-items: center;
    gap: $opc-spacing-xs;
    max-width: 480px;
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-tag;
    padding: 10px 16px;
  }

  &__search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: $opc-font-base;
    background: transparent;
  }
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $opc-spacing-lg;

  &__chips {
    display: flex;
    gap: $opc-spacing-xxs;
  }

  &__sort {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card-sm;
    padding: 6px 10px;
    background: $opc-bg-card;
  }
}

.filter-chip {
  font-size: $opc-font-sm;
  padding: 8px 18px;
  border-radius: $opc-radius-tag;
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  color: $opc-color-text-secondary;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  &:hover {
    border-color: $opc-color-accent;
  }

  &.is-active {
    background: $opc-color-accent;
    border-color: $opc-color-accent;
    color: #fff;
    font-weight: 600;
  }
}

.recommend-rail {
  margin-bottom: $opc-spacing-lg;

  &__title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: $opc-font-base;
    font-weight: 700;
    margin-bottom: $opc-spacing-sm;
  }

  &__list {
    display: flex;
    gap: $opc-spacing-md;
    overflow-x: auto;
    padding-bottom: $opc-spacing-xs;
  }

  &__card {
    flex: 0 0 320px;
  }
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: $opc-spacing-md;
}
</style>
