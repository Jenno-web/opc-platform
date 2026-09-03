<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchHotProjects, fetchProjectList } from '@/api/projects'
import type { ProjectListItem } from '@/types'
import ProjectCard from '@/components/ProjectCard.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import Icon from '@/components/Icon.vue'

const kindCards = [
  {
    kind: 'demand',
    icon: 'target' as const,
    label: '需求',
    title: '我有事要做',
    desc: '把项目想法写清楚：目标、预算、周期。AI 帮你拆成可执行的任务，等对的人来响应。',
  },
  {
    kind: 'supply',
    icon: 'package' as const,
    label: '供给',
    title: '我有能力接',
    desc: '亮出技能标签和过往作品，浏览别人发布的真实需求，看中了直接发响应说明。',
  },
  {
    kind: 'mutual',
    icon: 'users' as const,
    label: '互助',
    title: '我们一起搞',
    desc: '没有谁雇谁，找到同频的人平等协作——一起把模糊的想法做成看得见的结果。',
  },
]

const steps = [
  {
    icon: 'sparkle' as const,
    title: '说出你的想法',
    desc: '一句话描述项目背景和目标，AI 生成结构化草稿，缺什么字段会明确标出来。',
  },
  {
    icon: 'list-checks' as const,
    title: '补全关键信息',
    desc: '确认或修改预算区间、协作周期、需要的技能标签——AI 的建议始终可编辑。',
  },
  {
    icon: 'send' as const,
    title: '发布，等人响应',
    desc: '项目进入发现页的推荐流，系统按技能匹配度把它推给合适的人。',
  },
]

const hotProjects = ref<ProjectListItem[]>([])
const allProjects = ref<ProjectListItem[]>([])
const loading = ref(true)

const stats = computed(() => {
  const list = allProjects.value
  const recruiting = list.filter((p) => p.status === 'RECRUITING').length
  const skillSet = new Set<string>()
  list.forEach((p) => p.skillTags.forEach((t) => skillSet.add(t.id)))
  const ratings = new Map<string, number>()
  list.forEach((p) => ratings.set(p.publisher.id, p.publisher.ratingAvg))
  const avgRating = ratings.size
    ? Array.from(ratings.values()).reduce((a, b) => a + b, 0) / ratings.size
    : 0
  return [
    { label: '真实项目', value: String(list.length) },
    { label: '招募中', value: String(recruiting) },
    { label: '覆盖技能', value: String(skillSet.size) },
    { label: '发起人平均评分', value: avgRating ? avgRating.toFixed(1) : '—' },
  ]
})

onMounted(async () => {
  loading.value = true
  try {
    const [hot, all] = await Promise.all([fetchHotProjects(), fetchProjectList()])
    hotProjects.value = hot.slice(0, 4)
    allProjects.value = all
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="landing">
    <header class="landing-nav">
      <div class="landing-nav__inner">
        <RouterLink to="/" class="landing-nav__logo">
          <span class="landing-nav__logo-mark">培</span>
          <span>培风社 OPC</span>
        </RouterLink>
        <nav class="landing-nav__links">
          <a href="#kinds">协作类型</a>
          <a href="#process">怎么用</a>
          <a href="#trending">热门项目</a>
        </nav>
        <RouterLink to="/discover" class="landing-nav__cta">进入平台</RouterLink>
      </div>
    </header>

    <section class="hero">
      <div class="hero__glow hero__glow--a" />
      <div class="hero__glow hero__glow--b" />
      <div class="hero__orbit hero__orbit--1" />
      <div class="hero__orbit hero__orbit--2" />
      <div class="hero__orbit hero__orbit--3" />

      <div class="hero__inner">
        <p class="hero__eyebrow opc-fade-up">需求 · 供给 · 互助</p>
        <h1 class="hero__title opc-fade-up" style="--opc-stagger: 1">
          把想法<span class="hero__title-accent">变成一起做成的事</span>
        </h1>
        <p class="hero__subtitle opc-fade-up" style="--opc-stagger: 2">
          发布你的项目，或者亮出你的技能。AI 负责拆任务、配技能标签、算匹配度，
          剩下的交给真实的人来协作完成。
        </p>
        <div class="hero__actions opc-fade-up" style="--opc-stagger: 3">
          <RouterLink to="/discover" class="hero__btn hero__btn--primary opc-pulse-glow">
            浏览项目
          </RouterLink>
          <RouterLink to="/publish" class="hero__btn hero__btn--outline">
            <Icon name="plus" size="16px" />
            <span>发布我的项目</span>
          </RouterLink>
        </div>

        <div class="hero__stats opc-fade-up" style="--opc-stagger: 4">
          <div v-for="s in stats" :key="s.label" class="hero__stat">
            <span class="hero__stat-value">{{ loading ? '—' : s.value }}</span>
            <span class="hero__stat-label">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <section id="kinds" class="kinds">
      <!-- 手画的"协作网络"装饰图：三个大节点对应需求/供给/互助三个色，周围小节点通过
           曲线互连，配色直接用已有的 kind 颜色 token（不是新配色）。三条主干曲线上各有
           一个小圆点沿路径循环移动（SVG 原生 animateMotion，不需要 JS/库），暗示"匹配
           信号在网络里流动"——呼应"协作网络"这个产品概念本身，不是纯装饰性的插画 -->
      <svg class="kinds__mesh" viewBox="0 0 1200 260" aria-hidden="true">
        <defs>
          <linearGradient id="meshEdgeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#6d5ef5" stop-opacity="0.5" />
            <stop offset="50%" stop-color="#2dd4bf" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.5" />
          </linearGradient>
        </defs>

        <!-- 主干曲线：三大节点两两相连 -->
        <path id="meshEdgeA" class="mesh-edge mesh-edge--main" d="M150,170 C320,80 420,60 600,60" />
        <path id="meshEdgeB" class="mesh-edge mesh-edge--main" d="M600,60 C780,60 880,80 1050,170" />
        <path
          id="meshEdgeC"
          class="mesh-edge mesh-edge--faint"
          d="M150,170 C450,260 750,260 1050,170"
        />

        <!-- 卫星节点到主节点的连线 -->
        <line class="mesh-edge mesh-edge--thin" x1="90" y1="110" x2="150" y2="170" />
        <line class="mesh-edge mesh-edge--thin" x1="210" y1="90" x2="150" y2="170" />
        <line class="mesh-edge mesh-edge--thin" x1="110" y1="220" x2="150" y2="170" />
        <line class="mesh-edge mesh-edge--thin" x1="500" y1="30" x2="600" y2="60" />
        <line class="mesh-edge mesh-edge--thin" x1="650" y1="140" x2="600" y2="60" />
        <line class="mesh-edge mesh-edge--thin" x1="720" y1="20" x2="600" y2="60" />
        <line class="mesh-edge mesh-edge--thin" x1="960" y1="110" x2="1050" y2="170" />
        <line class="mesh-edge mesh-edge--thin" x1="1110" y1="90" x2="1050" y2="170" />
        <line class="mesh-edge mesh-edge--thin" x1="990" y1="230" x2="1050" y2="170" />
        <line class="mesh-edge mesh-edge--thin" x1="350" y1="150" x2="150" y2="170" />
        <line class="mesh-edge mesh-edge--thin" x1="350" y1="150" x2="600" y2="60" />
        <line class="mesh-edge mesh-edge--thin" x1="850" y1="150" x2="600" y2="60" />
        <line class="mesh-edge mesh-edge--thin" x1="850" y1="150" x2="1050" y2="170" />

        <!-- 卫星节点：小圆点，缓慢浮动 -->
        <circle class="mesh-node mesh-node--sat" style="--d: 0s" cx="90" cy="110" r="4" />
        <circle class="mesh-node mesh-node--sat" style="--d: 0.4s" cx="210" cy="90" r="3" />
        <circle class="mesh-node mesh-node--sat" style="--d: 0.8s" cx="110" cy="220" r="3" />
        <circle class="mesh-node mesh-node--sat" style="--d: 1.2s" cx="500" cy="30" r="4" />
        <circle class="mesh-node mesh-node--sat" style="--d: 0.2s" cx="650" cy="140" r="3" />
        <circle class="mesh-node mesh-node--sat" style="--d: 0.6s" cx="720" cy="20" r="3" />
        <circle class="mesh-node mesh-node--sat" style="--d: 1s" cx="960" cy="110" r="4" />
        <circle class="mesh-node mesh-node--sat" style="--d: 0.3s" cx="1110" cy="90" r="3" />
        <circle class="mesh-node mesh-node--sat" style="--d: 0.7s" cx="990" cy="230" r="3" />
        <circle class="mesh-node mesh-node--sat" style="--d: 1.1s" cx="350" cy="150" r="3" />
        <circle class="mesh-node mesh-node--sat" style="--d: 0.5s" cx="850" cy="150" r="3" />

        <!-- 三大节点：需求/供给/互助，同一套 kind 颜色，带呼吸缩放 -->
        <circle class="mesh-node mesh-node--hub is-demand" cx="150" cy="170" r="10" />
        <circle class="mesh-node mesh-node--hub is-supply" style="--d: 0.6s" cx="600" cy="60" r="10" />
        <circle class="mesh-node mesh-node--hub is-mutual" style="--d: 1.2s" cx="1050" cy="170" r="10" />

        <!-- 沿主干曲线循环移动的信号点，暗示匹配信号在网络里流动 -->
        <circle class="mesh-signal" r="3">
          <animateMotion dur="5.5s" repeatCount="indefinite" rotate="auto">
            <mpath href="#meshEdgeA" xlink:href="#meshEdgeA" />
          </animateMotion>
        </circle>
        <circle class="mesh-signal" r="3">
          <animateMotion dur="6.5s" begin="1.4s" repeatCount="indefinite" rotate="auto">
            <mpath href="#meshEdgeB" xlink:href="#meshEdgeB" />
          </animateMotion>
        </circle>
      </svg>

      <div class="section-head">
        <h2 v-reveal>三种协作类型，你在哪一种里</h2>
        <p v-reveal>不是"雇主找乙方"的单一关系——同一个平台里，需求、供给、互助并存。</p>
      </div>
      <div class="kinds__grid">
        <div
          v-for="(c, i) in kindCards"
          :key="c.kind"
          v-reveal
          class="kind-card"
          :class="`is-${c.kind}`"
          :style="{ '--opc-stagger': i }"
        >
          <div class="kind-card__icon">
            <Icon :name="c.icon" size="22px" />
          </div>
          <span class="kind-card__label">{{ c.label }}</span>
          <h3>{{ c.title }}</h3>
          <p>{{ c.desc }}</p>
        </div>
      </div>
    </section>

    <section id="process" class="process">
      <div class="section-head">
        <h2 v-reveal>三步，从想法到协作</h2>
        <p v-reveal>发布向导里的真实流程，每一步 AI 给建议，人来做最终决定。</p>
      </div>
      <div class="process__grid">
        <div v-for="(s, i) in steps" :key="s.title" v-reveal class="process-card" :style="{ '--opc-stagger': i }">
          <div class="process-card__step">{{ i + 1 }}</div>
          <div class="process-card__icon">
            <Icon :name="s.icon" size="20px" />
          </div>
          <h3>{{ s.title }}</h3>
          <p>{{ s.desc }}</p>
        </div>
      </div>
    </section>

    <section id="trending" class="trending">
      <div class="section-head">
        <h2 v-reveal>正在发生的真实项目</h2>
        <p v-reveal>不是占位数据——这些是平台上按热度排序的真实项目。</p>
      </div>
      <div class="trending__grid">
        <template v-if="loading">
          <SkeletonBlock v-for="i in 4" :key="i" :rows="3" />
        </template>
        <template v-else>
          <ProjectCard
            v-for="(p, i) in hotProjects"
            :key="p.id"
            v-reveal
            :project="p"
            :style="{ '--opc-stagger': i }"
          />
        </template>
      </div>
      <RouterLink to="/discover" v-reveal class="trending__more">
        查看全部项目
        <Icon name="chevron-right" size="16px" />
      </RouterLink>
    </section>

    <section class="cta">
      <div class="cta__glow" />
      <div v-reveal class="cta__inner">
        <h2>你的第一次协作，从这里开始</h2>
        <div class="cta__actions">
          <RouterLink to="/publish" class="hero__btn hero__btn--primary opc-pulse-glow">
            <Icon name="plus" size="16px" />
            <span>发布项目</span>
          </RouterLink>
          <RouterLink to="/discover" class="hero__btn hero__btn--outline">浏览热门项目</RouterLink>
        </div>
      </div>
    </section>

    <footer class="landing-footer">
      <div class="landing-footer__inner">
        <RouterLink to="/" class="landing-nav__logo">
          <span class="landing-nav__logo-mark">培</span>
          <span>培风社 OPC</span>
        </RouterLink>
        <nav class="landing-footer__links">
          <RouterLink to="/discover">发现</RouterLink>
          <RouterLink to="/tasks">任务</RouterLink>
          <RouterLink to="/publish">发布</RouterLink>
          <RouterLink to="/messages">信息</RouterLink>
          <RouterLink to="/profile">我的</RouterLink>
        </nav>
        <span class="landing-footer__copyright">© 2026 培风社 OPC</span>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.landing {
  background: $opc-bg-page;
  color: $opc-color-text;
}

// ---- 顶部导航：landing 页独立的极简导航，不是 TopNav（没有头像/未读徽标/发布按钮），
// 因为这是给未进入应用的访客看的公开首页 ----
.landing-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: $opc-nav-height;
  background: rgba(10, 10, 15, 0.72);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid $opc-border-color;

  &__inner {
    max-width: $opc-content-max-width;
    height: 100%;
    margin: 0 auto;
    padding: 0 $opc-spacing-xl;
    display: flex;
    align-items: center;
    gap: $opc-spacing-xl;
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: $opc-font-lg;
    font-weight: 700;
    color: $opc-color-text;
    white-space: nowrap;
  }

  &__logo-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: $opc-gradient-primary;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__links {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $opc-spacing-lg;

    a {
      font-size: $opc-font-base;
      color: $opc-color-text-secondary;
      transition: color 0.15s ease;

      &:hover {
        color: $opc-color-text;
      }
    }
  }

  &__cta {
    flex-shrink: 0;
    background: $opc-gradient-primary;
    color: #fff;
    font-size: $opc-font-sm;
    font-weight: 600;
    padding: 8px 18px;
    border-radius: $opc-radius-tag;
    transition: filter 0.15s ease;

    &:hover {
      filter: brightness(1.08);
    }
  }
}

// ---- Hero：跟发现页 hero 同一套光晕+虚线轨道装饰语言，但这里是全屏宽度的独立首屏，
// 不套 PageContainer 的 1200px 限宽——landing 页整体走"营销页"版式，跟应用内页区分开 ----
.hero {
  position: relative;
  overflow: hidden;
  padding: 96px $opc-spacing-xl 80px;
  text-align: center;

  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    opacity: 0.32;

    &--a {
      width: 420px;
      height: 420px;
      top: -160px;
      left: 50%;
      margin-left: -360px;
      background: #4f6ef7;
    }

    &--b {
      width: 380px;
      height: 380px;
      top: -100px;
      left: 50%;
      margin-left: 40px;
      background: #9333ea;
    }
  }

  &__orbit {
    position: absolute;
    top: -80px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 50%;
    border: 1px dashed rgba(124, 108, 255, 0.18);
    pointer-events: none;

    &--1 {
      width: 480px;
      height: 480px;
      animation: opc-orbit-spin 32s linear infinite;
    }
    &--2 {
      width: 620px;
      height: 620px;
      top: -150px;
      animation: opc-orbit-spin-reverse 48s linear infinite;
    }
    &--3 {
      width: 760px;
      height: 760px;
      top: -220px;
      animation: opc-orbit-spin 68s linear infinite;
    }
  }

  &__inner {
    position: relative;
    max-width: 760px;
    margin: 0 auto;
  }

  &__eyebrow {
    margin: 0 0 $opc-spacing-sm;
    font-size: $opc-font-sm;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: $opc-color-accent-bright;
  }

  &__title {
    margin: 0 0 $opc-spacing-md;
    font-size: 56px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  &__title-accent {
    display: block;
    background: $opc-gradient-text;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  &__subtitle {
    margin: 0 0 $opc-spacing-lg;
    font-size: $opc-font-lg;
    line-height: 1.7;
    color: $opc-color-text-secondary;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $opc-spacing-sm;
    margin-bottom: $opc-spacing-xl;
  }

  &__btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: $opc-font-base;
    font-weight: 600;
    padding: 12px 26px;
    border-radius: $opc-radius-tag;
    transition: transform 0.15s ease, filter 0.15s ease, background 0.15s ease;

    &--primary {
      background: $opc-gradient-primary;
      color: #fff;

      &:hover {
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

    &:active {
      transform: scale(0.97);
    }
  }

  &__stats {
    position: relative;
    display: flex;
    justify-content: center;
    gap: $opc-spacing-xl;
    padding-top: $opc-spacing-lg;
    border-top: 1px solid $opc-border-color;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  &__stat-value {
    font-size: 26px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    background: $opc-gradient-text;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  &__stat-label {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }
}

.section-head {
  max-width: 640px;
  margin: 0 auto $opc-spacing-xl;
  text-align: center;

  h2 {
    margin: 0 0 $opc-spacing-xxs;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  p {
    margin: 0;
    font-size: $opc-font-base;
    color: $opc-color-text-secondary;
  }
}

// ---- 三种协作类型 ----
.kinds {
  position: relative;
  max-width: $opc-content-max-width;
  margin: 0 auto;
  padding: 88px $opc-spacing-xl;
  overflow: hidden;

  &__grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $opc-spacing-md;
  }

  // 协作网络装饰图铺在标题正后方，四周用渐变遮罩淡出，不抢文字，
  // 小屏幕直接隐藏（内容本来就要堆叠显示，装饰图在窄屏没有铺展空间）
  &__mesh {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    width: 1200px;
    max-width: none;
    height: auto;
    opacity: 0.6;
    pointer-events: none;
    mask-image: radial-gradient(ellipse 620px 200px at center, black 0%, black 40%, transparent 78%);
    -webkit-mask-image: radial-gradient(ellipse 620px 200px at center, black 0%, black 40%, transparent 78%);

    @media (max-width: 860px) {
      display: none;
    }
  }
}

.mesh-edge {
  fill: none;
  stroke: url(#meshEdgeGrad);

  &--main {
    stroke-width: 1.4;
    animation: opc-edge-pulse 4.5s ease-in-out infinite;
  }
  &--faint {
    stroke-width: 1;
    opacity: 0.35;
  }
  &--thin {
    stroke-width: 1;
    opacity: 0.28;
  }
}

.mesh-node {
  transform-box: fill-box;
  transform-origin: center;

  &--sat {
    fill: $opc-color-accent-bright;
    opacity: 0.55;
    animation: opc-node-float 3.6s ease-in-out infinite;
    animation-delay: var(--d, 0s);
  }

  &--hub {
    stroke: $opc-bg-page;
    stroke-width: 2;
    animation: opc-hub-pulse 3.2s ease-in-out infinite;
    animation-delay: var(--d, 0s);

    &.is-demand {
      fill: $opc-color-kind-demand;
    }
    &.is-supply {
      fill: $opc-color-kind-supply;
    }
    &.is-mutual {
      fill: $opc-color-kind-mutual;
    }
  }
}

.mesh-signal {
  fill: #fff;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9));
}

@keyframes opc-node-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes opc-hub-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

@keyframes opc-edge-pulse {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 0.9;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mesh-edge--main,
  .mesh-node--sat,
  .mesh-node--hub {
    animation: none;
  }
  .mesh-signal {
    display: none;
  }
}

.kind-card {
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card;
  padding: $opc-spacing-lg;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $opc-shadow-glow;

    .kind-card__icon {
      transform: scale(1.1) rotate(-6deg);
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    margin-bottom: $opc-spacing-md;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &__label {
    display: inline-block;
    font-size: $opc-font-xs;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: $opc-radius-tag;
    margin-bottom: $opc-spacing-xs;
  }

  h3 {
    margin: 0 0 $opc-spacing-xxs;
    font-size: $opc-font-xl;
    font-weight: 700;
  }

  p {
    margin: 0;
    font-size: $opc-font-sm;
    line-height: 1.7;
    color: $opc-color-text-secondary;
  }

  &.is-demand {
    .kind-card__icon {
      color: $opc-color-kind-demand;
      background: rgba($opc-color-kind-demand, 0.12);
    }
    .kind-card__label {
      color: $opc-color-kind-demand;
      background: rgba($opc-color-kind-demand, 0.12);
    }
  }
  &.is-supply {
    .kind-card__icon {
      color: $opc-color-kind-supply;
      background: rgba($opc-color-kind-supply, 0.12);
    }
    .kind-card__label {
      color: $opc-color-kind-supply;
      background: rgba($opc-color-kind-supply, 0.12);
    }
  }
  &.is-mutual {
    .kind-card__icon {
      color: $opc-color-kind-mutual;
      background: rgba($opc-color-kind-mutual, 0.12);
    }
    .kind-card__label {
      color: $opc-color-kind-mutual;
      background: rgba($opc-color-kind-mutual, 0.12);
    }
  }
}

// ---- 三步流程 ----
.process {
  max-width: $opc-content-max-width;
  margin: 0 auto;
  padding: 40px $opc-spacing-xl 88px;

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $opc-spacing-md;
  }
}

.process-card {
  position: relative;
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card;
  padding: $opc-spacing-lg;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: rgba($opc-color-accent, 0.5);
    box-shadow: $opc-shadow-glow;

    .process-card__icon {
      transform: scale(1.1);
      background: $opc-color-accent;
      color: #fff;
    }
  }

  &__step {
    position: absolute;
    top: $opc-spacing-md;
    right: $opc-spacing-md;
    font-size: 40px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: $opc-border-color;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: $opc-color-accent-soft;
    color: $opc-color-accent-bright;
    margin-bottom: $opc-spacing-md;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease, color 0.2s ease;
  }

  h3 {
    margin: 0 0 $opc-spacing-xxs;
    font-size: $opc-font-lg;
    font-weight: 700;
    position: relative;
  }

  p {
    margin: 0;
    font-size: $opc-font-sm;
    line-height: 1.7;
    color: $opc-color-text-secondary;
    position: relative;
  }
}

// ---- 热门项目 ----
.trending {
  max-width: $opc-content-max-width;
  margin: 0 auto;
  padding: 40px $opc-spacing-xl 88px;

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: $opc-spacing-md;
    margin-bottom: $opc-spacing-lg;
  }

  &__more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: fit-content;
    margin: 0 auto;
    font-size: $opc-font-sm;
    font-weight: 600;
    color: $opc-color-accent-bright;

    &:hover {
      text-decoration: underline;
    }
  }
}

// ---- 底部 CTA ----
.cta {
  position: relative;
  overflow: hidden;
  margin: 0 $opc-spacing-xl 88px;
  max-width: calc(#{$opc-content-max-width} - #{$opc-spacing-xl} * 2);
  margin-left: auto;
  margin-right: auto;
  border-radius: 24px;
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  padding: 64px $opc-spacing-xl;
  text-align: center;

  // 渐变角度缓慢漂移，给这块常驻的静态色块加一点不打扰的呼吸感——
  // 跟 hero 的呼吸光晕/自转轨道是同一个"环境常驻动效"思路
  &__glow {
    position: absolute;
    inset: -40%;
    background: conic-gradient(
      from 0deg,
      rgba(79, 110, 247, 0.28),
      rgba(147, 51, 234, 0.28),
      rgba(45, 212, 191, 0.2),
      rgba(79, 110, 247, 0.28)
    );
    opacity: 0.5;
    pointer-events: none;
    animation: opc-cta-drift 16s linear infinite;
  }

  &__inner {
    position: relative;

    h2 {
      margin: 0 0 $opc-spacing-lg;
      font-size: 32px;
      font-weight: 800;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $opc-spacing-sm;
  }
}

@keyframes opc-cta-drift {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cta__glow {
    animation: none;
  }
}

// ---- 页脚 ----
.landing-footer {
  border-top: 1px solid $opc-border-color;
  padding: $opc-spacing-xl;

  &__inner {
    max-width: $opc-content-max-width;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: $opc-spacing-md;
  }

  &__links {
    display: flex;
    gap: $opc-spacing-md;

    a {
      font-size: $opc-font-sm;
      color: $opc-color-text-secondary;

      &:hover {
        color: $opc-color-text;
      }
    }
  }

  &__copyright {
    font-size: $opc-font-xs;
    color: $opc-color-text-placeholder;
  }
}

@media (max-width: 860px) {
  .kinds__grid,
  .process__grid {
    grid-template-columns: 1fr;
  }

  .hero__title {
    font-size: 40px;
  }

  .hero__stats {
    flex-wrap: wrap;
    gap: $opc-spacing-md;
  }
}
</style>
