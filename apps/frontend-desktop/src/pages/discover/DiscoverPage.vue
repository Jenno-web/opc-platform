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
      <div class="hero__glow hero__glow--a" />
      <div class="hero__glow hero__glow--b" />
      <div class="hero__orbit hero__orbit--1" />
      <div class="hero__orbit hero__orbit--2" />
      <div class="hero__orbit hero__orbit--3" />
      <h1 class="hero__title opc-fade-up">发现真实的<span class="hero__title-accent">协作机会</span></h1>
      <p class="hero__subtitle opc-fade-up" style="--opc-stagger: 1">需求、供给、互助——找到值得投入的项目，或者被值得信任的人找到</p>
      <div class="hero__search opc-fade-up" style="--opc-stagger: 2">
        <Icon name="search" size="18px" />
        <input
          v-model="keyword"
          class="hero__search-input"
          placeholder="搜索项目关键词"
          @keyup.enter="load"
        />
        <button class="hero__search-btn" @click="load">
          <Icon name="send" size="14px" color="#ffffff" />
        </button>
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
        <Icon name="sparkle" size="16px" color="#7c6cff" />
        <span>为你推荐</span>
      </div>
      <div class="recommend-rail__list">
        <ProjectCard
          v-for="(r, index) in recommendations"
          :key="r.project.id"
          :project="r.project"
          :match-score="r.matchScore"
          :match-reason="r.reason"
          class="recommend-rail__card opc-fade-up"
          :style="{ '--opc-stagger': Math.min(index, 6) }"
        />
      </div>
    </section>

    <section class="project-grid">
      <template v-if="loading">
        <SkeletonBlock v-for="i in 6" :key="i" :rows="3" />
      </template>
      <template v-else>
        <ProjectCard
          v-for="(p, index) in projects"
          :key="p.id"
          :project="p"
          class="opc-fade-up"
          :style="{ '--opc-stagger': Math.min(index, 8) }"
        />
        <EmptyState v-if="projects.length === 0" text="没有找到匹配的机会" hint="试试调整筛选条件" />
      </template>
    </section>
  </PageContainer>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

// hero 背景用两块模糊的渐变光晕做装饰，纯 CSS radial-gradient + blur，参考案例首屏
// 那种"暗背景上飘着几团色块光晕"的效果，不是图片素材
.hero {
  position: relative;
  overflow: hidden;
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card;
  padding: $opc-spacing-xl;
  margin-bottom: $opc-spacing-lg;

  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    pointer-events: none;
    opacity: 0.35;

    &--a {
      width: 320px;
      height: 320px;
      top: -120px;
      right: 80px;
      background: #4f6ef7;
    }

    &--b {
      width: 280px;
      height: 280px;
      bottom: -140px;
      right: -60px;
      background: #9333ea;
    }
  }

  // 同心圆装饰环，慢速自转，实测参考站用的是三个不同速度、部分反向的圆环叠在一起——
  // 这里照同一个思路做三层，圆心对齐在 hero 右上方那团光晕附近
  // 圆环用 dashed 边框而不是 solid——实心圆环转到哪个角度看起来都一样，
  // 虚线的间隔感才能让转动这件事真的被看出来
  &__orbit {
    position: absolute;
    top: -60px;
    right: 40px;
    border-radius: 50%;
    border: 1px dashed rgba(124, 108, 255, 0.22);
    pointer-events: none;

    &--1 {
      width: 260px;
      height: 260px;
      animation: opc-orbit-spin 26s linear infinite;
    }
    &--2 {
      width: 340px;
      height: 340px;
      top: -100px;
      right: 0;
      animation: opc-orbit-spin-reverse 42s linear infinite;
    }
    &--3 {
      width: 420px;
      height: 420px;
      top: -140px;
      right: -40px;
      animation: opc-orbit-spin 62s linear infinite;
    }
  }

  &__title {
    position: relative;
    margin: 0 0 $opc-spacing-xs;
    font-size: $opc-font-display;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: $opc-color-text;
  }

  &__title-accent {
    background: $opc-gradient-text;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  &__subtitle {
    position: relative;
    margin: 0 0 $opc-spacing-md;
    font-size: $opc-font-base;
    color: $opc-color-text-secondary;
  }

  &__search {
    position: relative;
    display: flex;
    align-items: center;
    gap: $opc-spacing-xs;
    max-width: 480px;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-tag;
    padding: 6px 8px 6px 16px;
    color: $opc-color-text-secondary;

    &:focus-within {
      border-color: $opc-color-accent;
    }
  }

  &__search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: $opc-font-base;
    background: transparent;
    color: $opc-color-text;

    &::placeholder {
      color: $opc-color-text-placeholder;
    }
  }

  &__search-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: $opc-gradient-primary;
    flex-shrink: 0;
    transition: filter 0.15s ease;

    &:hover {
      filter: brightness(1.1);
    }
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
    background: $opc-gradient-primary;
    border-color: transparent;
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
