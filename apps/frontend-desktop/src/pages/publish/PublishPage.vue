<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { generateProjectDraft, createProject, type GenerateDraftResult } from '@/api/publish'
import { fetchSkillTags } from '@/api/user'
import { showToast } from '@/composables/useToast'
import type { ProjectKind, PublishTier, SkillTag } from '@/types'
import PageContainer from '@/components/layout/PageContainer.vue'
import Icon from '@/components/Icon.vue'

const router = useRouter()
const step = ref(1)

// step 1
const idea = ref('')
const generating = ref(false)

// step 2（AI 草稿，可编辑）
const draft = ref<GenerateDraftResult | null>(null)
const title = ref('')
const background = ref('')
const goal = ref('')
const coreFeatures = ref('')
const deliverables = ref('')
const acceptanceCriteria = ref('')

// step 3（草稿没覆盖到的字段）
const budgetMin = ref(3000)
const budgetMax = ref(8000)
const cycleWeeks = ref(4)
const kind = ref<ProjectKind>('DEMAND')
const publishTier = ref<PublishTier>('STANDARD')
const skillCatalog = ref<SkillTag[]>([])
const selectedSkills = ref<string[]>([])
const submitting = ref(false)

const kindOptions: { label: string; value: ProjectKind }[] = [
  { label: '需求', value: 'DEMAND' },
  { label: '供给', value: 'SUPPLY' },
  { label: '互助', value: 'MUTUAL' },
]
const tierOptions: { label: string; value: PublishTier; desc: string }[] = [
  { label: '标准', value: 'STANDARD', desc: '正常曝光' },
  { label: '加强', value: 'BOOSTED', desc: '优先展示' },
  { label: '悬赏', value: 'BOUNTY', desc: '强调紧急/高优先级' },
]

async function handleGenerate() {
  if (!idea.value.trim()) {
    showToast('请先描述你的想法')
    return
  }
  generating.value = true
  try {
    draft.value = await generateProjectDraft({ idea: idea.value.trim() })
    title.value = draft.value.direction.slice(0, 40)
    background.value = draft.value.background
    goal.value = draft.value.goal
    coreFeatures.value = draft.value.coreFeatures
    deliverables.value = draft.value.deliverables
    acceptanceCriteria.value = ''
    step.value = 2
  } finally {
    generating.value = false
  }
}

function toggleSkill(name: string) {
  const i = selectedSkills.value.indexOf(name)
  if (i === -1) selectedSkills.value.push(name)
  else selectedSkills.value.splice(i, 1)
}

async function handleSubmit() {
  if (!title.value.trim() || !acceptanceCriteria.value.trim() || selectedSkills.value.length === 0) {
    showToast('请填写完整标题、验收标准，并至少选一个技能标签')
    return
  }
  submitting.value = true
  try {
    const result = await createProject({
      title: title.value.trim(),
      background: background.value.trim(),
      goal: goal.value.trim(),
      coreFeatures: coreFeatures.value.trim(),
      deliverables: deliverables.value.trim(),
      acceptanceCriteria: acceptanceCriteria.value.trim(),
      budgetMin: budgetMin.value,
      budgetMax: budgetMax.value,
      cycleWeeks: cycleWeeks.value,
      skillTagNames: selectedSkills.value,
      kind: kind.value,
      publishTier: publishTier.value,
    })
    showToast('发布成功')
    router.push(`/discover/${result.id}`)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  skillCatalog.value = await fetchSkillTags()
})
</script>

<template>
  <PageContainer>
    <div class="publish-wizard">
      <div class="step-indicator">
        <div v-for="n in 3" :key="n" class="step-indicator__seg" :class="{ 'is-active': n <= step }" />
      </div>

      <template v-if="step === 1">
        <h2 class="wizard-title">用一句话描述你的想法</h2>
        <p class="wizard-subtitle">AI 会帮你整理成结构化的项目草稿，之后还能继续编辑</p>
        <textarea v-model="idea" class="idea-input" rows="5" placeholder="例如：想做一个帮独立开发者自动生成产品周报的工具" />
        <button class="btn btn--primary" :disabled="generating" @click="handleGenerate">
          <Icon name="sparkle" size="14px" color="#ffffff" />
          <span>{{ generating ? 'AI 整理中…' : 'AI 生成草稿' }}</span>
        </button>
      </template>

      <template v-else-if="step === 2 && draft">
        <h2 class="wizard-title">
          <Icon name="sparkle" size="18px" color="#7c6cff" />
          <span>AI 已整理，确认或修改</span>
        </h2>

        <div v-if="draft.missingFields.length" class="missing-callout">
          还需要补充：{{ draft.missingFields.join('、') }}
        </div>

        <div class="field">
          <label>标题</label>
          <input v-model="title" maxlength="40" />
        </div>
        <div class="field">
          <label>背景</label>
          <textarea v-model="background" rows="2" />
        </div>
        <div class="field">
          <label>项目目标</label>
          <textarea v-model="goal" rows="2" />
        </div>
        <div class="field">
          <label>核心功能</label>
          <textarea v-model="coreFeatures" rows="2" />
        </div>
        <div class="field">
          <label>交付内容</label>
          <textarea v-model="deliverables" rows="2" />
        </div>
        <div class="field">
          <label>验收标准</label>
          <textarea v-model="acceptanceCriteria" rows="2" placeholder="AI 没有帮你生成这项，需要自己补充" />
        </div>

        <div class="wizard-actions">
          <button class="btn btn--outline" @click="step = 1">上一步</button>
          <button class="btn btn--primary" @click="step = 3">下一步</button>
        </div>
      </template>

      <template v-else-if="step === 3">
        <h2 class="wizard-title">补充剩余信息</h2>

        <div class="field-row">
          <div class="field">
            <label>供需类型</label>
            <div class="chip-row">
              <button
                v-for="opt in kindOptions"
                :key="opt.value"
                class="chip"
                :class="{ 'is-active': kind === opt.value }"
                @click="kind = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <div class="field">
            <label>曝光层级</label>
            <div class="chip-row">
              <button
                v-for="opt in tierOptions"
                :key="opt.value"
                class="chip"
                :class="{ 'is-active': publishTier === opt.value }"
                @click="publishTier = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>预算范围（元）</label>
            <div class="budget-row">
              <input v-model.number="budgetMin" type="number" />
              <span>-</span>
              <input v-model.number="budgetMax" type="number" />
            </div>
          </div>
          <div class="field">
            <label>周期（周）</label>
            <input v-model.number="cycleWeeks" type="number" style="width: 120px" />
          </div>
        </div>

        <div class="field">
          <label>技能标签</label>
          <div class="chip-row">
            <button
              v-for="tag in skillCatalog"
              :key="tag.id"
              class="chip"
              :class="{ 'is-active': selectedSkills.includes(tag.name) }"
              @click="toggleSkill(tag.name)"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>

        <div class="wizard-actions">
          <button class="btn btn--outline" @click="step = 2">上一步</button>
          <button class="btn btn--primary" :disabled="submitting" @click="handleSubmit">
            {{ submitting ? '发布中…' : '发布项目' }}
          </button>
        </div>
      </template>
    </div>
  </PageContainer>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.publish-wizard {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-md;
}

.step-indicator {
  display: flex;
  gap: $opc-spacing-xxs;

  &__seg {
    flex: 1;
    height: 4px;
    border-radius: $opc-radius-tag;
    background: $opc-bg-subtle;

    &.is-active {
      background: $opc-gradient-primary;
    }
  }
}

.wizard-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: $opc-font-xl;
  font-weight: 700;
}

.wizard-subtitle {
  margin: -8px 0 0;
  font-size: $opc-font-sm;
  color: $opc-color-text-secondary;
}

.idea-input {
  width: 100%;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card-sm;
  padding: $opc-spacing-sm;
  font-size: $opc-font-base;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: $opc-color-accent;
  }
}

.missing-callout {
  background: rgba($opc-color-warning, 0.1);
  color: $opc-color-warning;
  border-radius: $opc-radius-card-sm;
  padding: $opc-spacing-sm;
  font-size: $opc-font-sm;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }

  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card-sm;
    padding: $opc-spacing-xs $opc-spacing-sm;
    font-size: $opc-font-sm;

    &:focus {
      outline: none;
      border-color: $opc-color-accent;
    }
  }
}

.field-row {
  display: flex;
  gap: $opc-spacing-lg;

  .field {
    flex: 1;
  }
}

.budget-row {
  display: flex;
  align-items: center;
  gap: 8px;

  input {
    width: 100px;
  }
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: $opc-spacing-xxs;
}

.chip {
  font-size: $opc-font-sm;
  padding: 6px 16px;
  border-radius: $opc-radius-tag;
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  color: $opc-color-text-secondary;
  transition: background 0.15s ease, color 0.15s ease;

  &.is-active {
    background: $opc-gradient-primary;
    border-color: transparent;
    color: #fff;
    font-weight: 600;
  }
}

.wizard-actions {
  display: flex;
  gap: $opc-spacing-sm;
  margin-top: $opc-spacing-sm;

  .btn {
    flex: 1;
  }
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: $opc-radius-tag;
  font-size: $opc-font-sm;
  font-weight: 600;
  transition: opacity 0.15s ease, background 0.15s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--primary {
    background: $opc-gradient-primary;
    color: #fff;

    &:hover:not(:disabled) {
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
}
</style>
