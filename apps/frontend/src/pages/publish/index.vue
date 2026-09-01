<script setup lang="ts">
import { ref } from 'vue'
import { generateProjectDraft, createProject, type GenerateDraftResult } from '@/api/publish'
import { isSpeechRecognitionSupported, startVoiceRecognition, stopVoiceRecognition } from '@/utils/speech'
import Icon from '@/components/Icon.vue'
import type { ProjectKind, PublishTier } from '@/types'

// 4 步发布向导，对应 Figma 07-10 号画板（1/5 意图选择 → 2/5 表达 → 3/5 AI 解析确认 → 4/5 曝光层级）

const step = ref(1)

// 第 1 步：意图
type Intent = 'DEMAND' | 'SUPPLY' | 'BOUNTY'
const intentOptions: { value: Intent; title: string; desc: string; kind: ProjectKind }[] = [
  { value: 'DEMAND', title: '我有需求', desc: '找人、找资源、找项目协作。', kind: 'DEMAND' },
  { value: 'SUPPLY', title: '我能提供', desc: '发布服务、能力、档期或案例。', kind: 'SUPPLY' },
  { value: 'BOUNTY', title: '我要快速响应', desc: '目标明确，适合设置悬赏。', kind: 'DEMAND' },
]
const selectedIntent = ref<Intent | null>(null)

// 第 2 步：表达
const idea = ref('')
const listening = ref(false)
const voiceSupported = isSpeechRecognitionSupported()

function handleVoiceInput() {
  if (!voiceSupported) {
    uni.showToast({ title: '当前环境不支持语音输入，请直接输入文字', icon: 'none' })
    return
  }
  if (listening.value) {
    stopVoiceRecognition()
    listening.value = false
    return
  }
  listening.value = true
  const started = startVoiceRecognition({
    onResult: (text) => (idea.value = idea.value ? `${idea.value}${text}` : text),
    onEnd: () => (listening.value = false),
    onError: () => {
      listening.value = false
      uni.showToast({ title: '语音识别失败，请重试或直接输入', icon: 'none' })
    },
  })
  if (!started) listening.value = false
}

// 第 3 步：AI 解析确认
const generating = ref(false)
const draft = ref<GenerateDraftResult | null>(null)
const budgetMin = ref(3000)
const budgetMax = ref(8000)
const cycleWeeks = ref(4)
const skillOptions = ['AI工具', '产品设计', '前端开发', '后端开发', 'UI设计', '增长运营']
const selectedSkills = ref<string[]>([])

function toggleSkill(skill: string) {
  const i = selectedSkills.value.indexOf(skill)
  if (i === -1) selectedSkills.value.push(skill)
  else selectedSkills.value.splice(i, 1)
}

async function generateAndGoStep3() {
  if (!idea.value.trim()) {
    uni.showToast({ title: '请先描述你的想法', icon: 'none' })
    return
  }
  generating.value = true
  try {
    draft.value = await generateProjectDraft({ idea: idea.value.trim() })
    step.value = 3
  } finally {
    generating.value = false
  }
}

// 第 4 步：曝光层级
const tierOptions: { value: PublishTier; title: string; badge: string; desc: string; fit: string }[] = [
  { value: 'STANDARD', title: '认证发布', badge: '', desc: '进入普通信息流，展示认证身份、标签和响应入口。', fit: '适合：一般需求、互助、供给展示' },
  { value: 'BOOSTED', title: '付费优先', badge: '会员', desc: '获得更高排序权重、更多字段展示和推荐机会。', fit: '适合：希望提高曝光的服务与项目' },
  { value: 'BOUNTY', title: '悬赏任务', badge: '强激励', desc: '突出预算、截止时间、响应人数，适合快速匹配。', fit: '适合：目标清楚、时效强的任务' },
]
const selectedTier = ref<PublishTier>('STANDARD')
const submitting = ref(false)

function goStep4() {
  if (selectedIntent.value === 'BOUNTY') selectedTier.value = 'BOUNTY'
  step.value = 4
}

async function handlePublish() {
  if (!draft.value) return
  submitting.value = true
  try {
    const intentMeta = intentOptions.find((o) => o.value === selectedIntent.value)
    await createProject({
      title: draft.value.direction,
      background: draft.value.background,
      goal: draft.value.goal,
      coreFeatures: draft.value.coreFeatures,
      deliverables: draft.value.deliverables,
      acceptanceCriteria: '待补充验收标准',
      budgetMin: budgetMin.value,
      budgetMax: budgetMax.value,
      cycleWeeks: cycleWeeks.value,
      skillTagNames: selectedSkills.value,
      kind: intentMeta?.kind ?? 'DEMAND',
      publishTier: selectedTier.value,
    })
    uni.showToast({ title: '已发布到供需广场', icon: 'success' })
    setTimeout(() => uni.switchTab({ url: '/pages/discover/index' }), 600)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="publish">
    <text class="publish__step">{{ step }} / 4</text>

    <!-- 第 1 步：意图选择 -->
    <template v-if="step === 1">
      <view class="publish__hero-title">发布向导</view>
      <view class="publish__hero-subtitle">你想让社区帮你完成什么？</view>

      <view
        v-for="opt in intentOptions"
        :key="opt.value"
        class="publish__intent-card"
        hover-class="opc-hover"
        :class="{ 'is-active': selectedIntent === opt.value }"
        @click="selectedIntent = opt.value"
      >
        <text class="publish__intent-title">{{ opt.title }}</text>
        <text class="publish__intent-desc">{{ opt.desc }}</text>
      </view>

      <button
        class="publish__next-btn"
        hover-class="opc-hover"
        :disabled="!selectedIntent"
        @click="step = 2"
      >
        下一步
      </button>
    </template>

    <!-- 第 2 步：自然表达 -->
    <template v-else-if="step === 2">
      <view class="publish__hero-title">自然表达</view>
      <view class="publish__hero-subtitle">像发语音一样说明你的需求</view>

      <view class="publish__input-row">
        <textarea
          v-model="idea"
          class="publish__textarea"
          placeholder="例如：我想找一名前端开发，帮独立开发者做一个小程序端的记账工具"
          maxlength="500"
        />
        <view
          class="publish__voice-btn"
          hover-class="opc-hover"
          :class="{ 'is-listening': listening, 'is-disabled': !voiceSupported }"
          @click="handleVoiceInput"
        >
          <view v-if="listening" class="publish__voice-dot opc-pulse" />
          <text v-if="listening">录音中</text>
          <Icon v-else name="mic" size="28rpx" />
        </view>
      </view>
      <view class="publish__count">{{ idea.length }} / 500</view>

      <button
        class="publish__next-btn"
        hover-class="opc-hover"
        :loading="generating"
        @click="generateAndGoStep3"
      >
        让 AI 整理
      </button>
    </template>

    <!-- 第 3 步：AI 解析确认 -->
    <template v-else-if="step === 3 && draft">
      <view class="publish__hero-title">AI 已整理</view>
      <view class="publish__hero-subtitle">确认对外展示的信息</view>

      <view class="publish__card">
        <view class="publish__field">
          <text class="publish__field-label">标题</text>
          <text class="publish__field-value">{{ draft.direction }}</text>
        </view>
        <view class="publish__field">
          <text class="publish__field-label">摘要</text>
          <text class="publish__field-value">{{ draft.background }}</text>
        </view>
        <view class="publish__field publish__field--input">
          <text class="publish__field-label">预算</text>
          <input v-model.number="budgetMin" class="publish__number-input" type="number" />
          <text>-</text>
          <input v-model.number="budgetMax" class="publish__number-input" type="number" />
          <text>元</text>
        </view>
        <view class="publish__field publish__field--input">
          <text class="publish__field-label">周期</text>
          <input v-model.number="cycleWeeks" class="publish__number-input" type="number" />
          <text>周</text>
        </view>

        <text class="publish__field-label">标签</text>
        <view class="publish__chips">
          <view
            v-for="skill in skillOptions"
            :key="skill"
            class="publish__chip"
            hover-class="opc-hover"
            :class="{ 'is-active': selectedSkills.includes(skill) }"
            @click="toggleSkill(skill)"
          >
            <text>{{ skill }}</text>
          </view>
        </view>

        <view v-if="draft.missingFields.length" class="publish__missing">
          <view class="publish__missing-title">
            <Icon name="alert-triangle" size="20rpx" color="#a8763e" />
            <text>待补充</text>
          </view>
          <text class="publish__missing-list">{{ draft.missingFields.join('、') }}</text>
        </view>
      </view>

      <view class="publish__actions">
        <button class="publish__secondary-btn" hover-class="opc-hover" @click="step = 2">重整</button>
        <button class="publish__next-btn" hover-class="opc-hover" @click="goStep4">确认</button>
      </view>
    </template>

    <!-- 第 4 步：曝光层级选择 -->
    <template v-else-if="step === 4">
      <view class="publish__hero-title">选择曝光方式</view>
      <view class="publish__hero-subtitle">让合适的人更快看到</view>

      <view
        v-for="opt in tierOptions"
        :key="opt.value"
        class="publish__intent-card"
        hover-class="opc-hover"
        :class="{ 'is-active': selectedTier === opt.value }"
        @click="selectedTier = opt.value"
      >
        <view class="publish__tier-header">
          <text class="publish__intent-title">{{ opt.title }}</text>
          <text v-if="opt.badge" class="publish__tier-badge">{{ opt.badge }}</text>
        </view>
        <text class="publish__intent-desc">{{ opt.desc }}</text>
        <text class="publish__tier-fit">{{ opt.fit }}</text>
      </view>

      <button
        class="publish__next-btn"
        hover-class="opc-hover"
        :loading="submitting"
        @click="handlePublish"
      >
        发布到供需广场
      </button>
    </template>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.publish {
  padding: $opc-spacing;
  padding-bottom: 80rpx;

  &__step {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }

  &__hero-title {
    font-size: $opc-font-xl;
    font-weight: 700;
    margin: $opc-spacing-xxs 0 8rpx;
  }

  &__hero-subtitle {
    font-size: $opc-font-base;
    color: $opc-color-text-secondary;
    margin-bottom: $opc-spacing-lg;
  }

  &__intent-card {
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    box-shadow: $opc-shadow-sm;
    padding: $opc-spacing;
    margin-bottom: $opc-spacing-sm;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    transition: border-color 0.15s ease;

    &.is-active {
      border-color: $opc-color-primary;
      border-width: 2px;
    }
  }

  &__intent-title {
    font-size: $opc-font-base;
    font-weight: 700;
  }

  &__intent-desc {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
  }

  &__tier-header {
    display: flex;
    align-items: center;
    gap: $opc-spacing-xxs;
  }

  &__tier-badge {
    font-size: 18rpx;
    color: #fff;
    background: $opc-color-primary;
    padding: 2rpx 12rpx;
    border-radius: $opc-radius-tag;
  }

  &__tier-fit {
    font-size: $opc-font-xs;
    color: $opc-color-text-placeholder;
  }

  &__input-row {
    position: relative;
  }

  &__textarea {
    width: 100%;
    min-height: 200rpx;
    font-size: $opc-font-base;
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card-sm;
    padding: $opc-spacing-xs;
    padding-right: 72rpx;
    box-sizing: border-box;
  }

  &__voice-btn {
    position: absolute;
    right: 12rpx;
    bottom: 12rpx;
    width: 56rpx;
    height: 56rpx;
    line-height: 56rpx;
    text-align: center;
    border-radius: 50%;
    background: $opc-bg-subtle;
    font-size: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;

    &.is-listening {
      background: $opc-color-danger;
      color: #fff;
      width: auto;
      height: auto;
      padding: $opc-spacing-xxs $opc-spacing-sm;
      font-size: $opc-font-xs;
      border-radius: $opc-radius-tag;
    }

    &.is-disabled {
      opacity: 0.4;
    }
  }

  &__voice-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #fff;
  }

  &__count {
    text-align: right;
    font-size: $opc-font-xs;
    color: $opc-color-text-placeholder;
    margin: $opc-spacing-xxs 0 $opc-spacing-sm;
  }

  &__card {
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    box-shadow: $opc-shadow-sm;
    padding: $opc-spacing;
    margin-bottom: $opc-spacing-sm;
    display: flex;
    flex-direction: column;
    gap: $opc-spacing-xs;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    padding-bottom: $opc-spacing-xxs;
    border-bottom: 1px solid $opc-border-color;

    &--input {
      flex-direction: row;
      align-items: center;
      gap: $opc-spacing-xxs;
    }
  }

  &__field-label {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }

  &__field-value {
    font-size: $opc-font-base;
  }

  &__number-input {
    width: 120rpx;
    background: $opc-bg-subtle;
    border-radius: 8rpx;
    padding: 8rpx $opc-spacing-xxs;
    font-size: $opc-font-base;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: $opc-spacing-xxs;
  }

  &__chip {
    display: inline-block;
    font-size: $opc-font-sm;
    padding: 8rpx $opc-spacing-sm;
    border-radius: $opc-radius-tag;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    color: $opc-color-text-secondary;

    &.is-active {
      background: $opc-color-primary;
      border-color: $opc-color-primary;
      color: #fff;
    }
  }

  &__missing {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    padding: $opc-spacing-xs $opc-spacing-sm;
    background: $opc-bg-subtle;
    border-radius: $opc-radius-card-sm;
  }

  &__missing-title {
    display: flex;
    align-items: center;
    gap: 6rpx;
    color: $opc-color-warning;
    font-size: $opc-font-sm;
    font-weight: 600;
  }

  &__missing-list {
    color: $opc-color-text-secondary;
    font-size: $opc-font-sm;
  }

  &__actions {
    display: flex;
    gap: $opc-spacing-xs;
  }

  &__secondary-btn {
    flex: 1;
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    color: $opc-color-text;
    border-radius: $opc-radius-tag;
    font-size: $opc-font-sm;
  }

  &__next-btn {
    flex: 2;
    background: $opc-color-primary;
    color: #fff;
    border-radius: $opc-radius-tag;
    font-size: $opc-font-base;

    &[disabled] {
      opacity: 0.4;
    }
  }
}
</style>
