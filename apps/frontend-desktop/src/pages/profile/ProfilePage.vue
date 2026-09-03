<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { fetchSkillTags } from '@/api/user'
import { fetchKnowledgeEntries, updateKnowledgeEntry } from '@/api/knowledge'
import { showToast } from '@/composables/useToast'
import type { KnowledgeEntryItem, SkillTag } from '@/types'
import PageContainer from '@/components/layout/PageContainer.vue'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'
import CountUp from '@/components/CountUp.vue'
import EmptyState from '@/components/EmptyState.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'

const userStore = useUserStore()
const uploadingAvatar = ref(false)
const savingProfile = ref(false)

const nickname = ref('')
const professionalIdentity = ref('')
const bio = ref('')
const selectedSkills = ref<string[]>([])
const skillCatalog = ref<SkillTag[]>([])
const MAX_SKILLS = 8
const formInitialized = ref(false)

const knowledgeEntries = ref<KnowledgeEntryItem[]>([])
const knowledgeLoading = ref(true)
const editingKnowledgeId = ref('')
const knowledgeDraft = ref('')

function initForm() {
  const user = userStore.currentUser
  if (!user || formInitialized.value) return
  nickname.value = user.nickname
  professionalIdentity.value = user.professionalIdentity ?? ''
  bio.value = user.bio ?? ''
  selectedSkills.value = user.skillTags.map((t) => t.name)
  formInitialized.value = true
}

function toggleSkill(name: string) {
  const i = selectedSkills.value.indexOf(name)
  if (i === -1) {
    if (selectedSkills.value.length >= MAX_SKILLS) {
      showToast(`最多选 ${MAX_SKILLS} 个技能标签`)
      return
    }
    selectedSkills.value.push(name)
  } else {
    selectedSkills.value.splice(i, 1)
  }
}

function resizeToDataUrl(src: string, maxSize = 240, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法处理图片'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

function changeAvatar() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    uploadingAvatar.value = true
    try {
      const dataUrl = await resizeToDataUrl(URL.createObjectURL(file))
      await userStore.updateAvatar(dataUrl)
      showToast('头像已更新')
    } catch {
      showToast('头像更新失败，换一张试试')
    } finally {
      uploadingAvatar.value = false
    }
  }
  input.click()
}

async function handleSaveProfile() {
  if (!nickname.value.trim()) {
    showToast('昵称不能为空')
    return
  }
  savingProfile.value = true
  try {
    await userStore.updateProfile({
      nickname: nickname.value.trim(),
      professionalIdentity: professionalIdentity.value.trim(),
      bio: bio.value.trim(),
      skillTagNames: selectedSkills.value,
    })
    showToast('已保存')
  } finally {
    savingProfile.value = false
  }
}

function startEditKnowledge(entry: KnowledgeEntryItem) {
  editingKnowledgeId.value = entry.id
  knowledgeDraft.value = entry.lessonsLearned
}

async function saveKnowledge(entry: KnowledgeEntryItem) {
  const updated = await updateKnowledgeEntry(entry.id, { lessonsLearned: knowledgeDraft.value })
  const index = knowledgeEntries.value.findIndex((e) => e.id === entry.id)
  if (index !== -1) knowledgeEntries.value[index] = updated
  editingKnowledgeId.value = ''
}

onMounted(async () => {
  if (!userStore.currentUser) await userStore.loadCurrentUser()
  initForm()
  skillCatalog.value = await fetchSkillTags()
  knowledgeLoading.value = true
  try {
    knowledgeEntries.value = await fetchKnowledgeEntries()
  } finally {
    knowledgeLoading.value = false
  }
})
</script>

<template>
  <PageContainer>
    <template v-if="userStore.currentUser">
      <div class="profile-header">
        <div class="profile-header__avatar-wrap" @click="changeAvatar">
          <Avatar :name="userStore.currentUser.nickname" :avatar-url="userStore.currentUser.avatarUrl" size="72px" />
          <div class="profile-header__avatar-edit" :class="{ 'is-busy': uploadingAvatar }">
            <Icon name="pencil" size="12px" color="#ffffff" />
          </div>
        </div>
        <div class="profile-header__identity">
          <div class="profile-header__name">{{ userStore.currentUser.nickname }}</div>
          <div class="profile-header__role">{{ userStore.currentUser.professionalIdentity }}</div>
          <div class="profile-header__rating">
            <Icon name="star" filled size="14px" color="#fbbf24" />
            <span>{{ userStore.currentUser.ratingAvg.toFixed(1) }}（{{ userStore.currentUser.ratingCount }}）</span>
          </div>
        </div>
        <div class="profile-header__completeness">
          <div class="profile-header__completeness-num"><CountUp :value="userStore.currentUser.completeness" suffix="%" /></div>
          <div class="profile-header__completeness-bar">
            <div class="profile-header__completeness-fill" :style="{ width: `${userStore.currentUser.completeness}%` }" />
          </div>
          <span class="profile-header__completeness-label">资料完整度</span>
        </div>
      </div>

      <div class="stats-row">
        <div class="stats-row__tile">
          <div class="stats-row__num"><CountUp :value="userStore.currentUser.stats.collaborationCount" /></div>
          <div class="stats-row__label">合作</div>
        </div>
        <div class="stats-row__tile">
          <div class="stats-row__num"><CountUp :value="userStore.currentUser.stats.responseCount" /></div>
          <div class="stats-row__label">响应</div>
        </div>
        <div class="stats-row__tile">
          <div class="stats-row__num"><CountUp :value="userStore.currentUser.stats.knowledgeCount" /></div>
          <div class="stats-row__label">知识沉淀</div>
        </div>
      </div>

      <div class="profile-grid">
        <div class="profile-main">
          <section class="panel">
            <h3 class="panel__title">资料设置</h3>
            <div class="field">
              <label>昵称</label>
              <input v-model="nickname" maxlength="20" />
            </div>
            <div class="field">
              <label>身份介绍</label>
              <input v-model="professionalIdentity" maxlength="30" />
            </div>
            <div class="field">
              <label>我能提供</label>
              <textarea v-model="bio" rows="3" maxlength="300" />
            </div>
            <div class="field">
              <label>能力标签（最多 {{ MAX_SKILLS }} 个）</label>
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
            <button class="btn btn--primary" :disabled="savingProfile" @click="handleSaveProfile">
              {{ savingProfile ? '保存中…' : '保存资料' }}
            </button>
          </section>

          <section v-if="userStore.currentUser.portfolio.length" class="panel">
            <h3 class="panel__title">近期案例</h3>
            <div v-for="(item, index) in userStore.currentUser.portfolio" :key="item.id" v-reveal class="case-item" :style="{ '--opc-stagger': Math.min(index, 4) }">
              <div class="case-item__title">{{ item.title }}</div>
              <p class="case-item__desc">{{ item.description }}</p>
            </div>
          </section>

          <section class="panel">
            <h3 class="panel__title">知识库</h3>
            <template v-if="knowledgeLoading">
              <SkeletonBlock :rows="2" />
            </template>
            <template v-else>
              <div v-for="(entry, index) in knowledgeEntries" :key="entry.id" v-reveal class="knowledge-item" :style="{ '--opc-stagger': Math.min(index, 4) }">
                <div class="knowledge-item__header">
                  <span>{{ entry.project?.title ?? '通用经验' }}</span>
                  <span v-if="entry.aiGenerated" class="knowledge-item__ai-tag">AI 生成{{ entry.editedByUser ? ' · 已编辑' : '' }}</span>
                </div>
                <p class="knowledge-item__summary">{{ entry.summary }}</p>
                <template v-if="editingKnowledgeId === entry.id">
                  <textarea v-model="knowledgeDraft" rows="3" />
                  <div class="knowledge-item__actions">
                    <button class="btn btn--primary btn--small" @click="saveKnowledge(entry)">保存</button>
                    <button class="btn btn--outline btn--small" @click="editingKnowledgeId = ''">取消</button>
                  </div>
                </template>
                <template v-else>
                  <p class="knowledge-item__lessons">{{ entry.lessonsLearned }}</p>
                  <button class="knowledge-item__edit" @click="startEditKnowledge(entry)">编辑</button>
                </template>
              </div>
              <EmptyState v-if="knowledgeEntries.length === 0" text="暂无知识库沉淀" />
            </template>
          </section>
        </div>
      </div>
    </template>

    <div v-else class="profile-loading">
      <SkeletonBlock :rows="2" avatar />
      <SkeletonBlock :rows="3" />
    </div>
  </PageContainer>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.profile-header {
  display: flex;
  align-items: center;
  gap: $opc-spacing-lg;
  margin-bottom: $opc-spacing-lg;

  &__avatar-wrap {
    position: relative;
    cursor: pointer;
    flex-shrink: 0;
  }

  &__avatar-edit {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: $opc-gradient-primary;
    border: 2px solid $opc-bg-page;
    display: flex;
    align-items: center;
    justify-content: center;

    &.is-busy {
      opacity: 0.5;
    }
  }

  &__identity {
    flex: 1;
  }

  &__name {
    font-size: $opc-font-xl;
    font-weight: 700;
  }

  &__role {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    margin: 4px 0;
  }

  &__rating {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: $opc-font-sm;
    font-weight: 600;
  }

  &__completeness {
    width: 200px;
    text-align: right;
  }

  &__completeness-num {
    font-size: $opc-font-lg;
    font-weight: 700;
    color: $opc-color-accent;
  }

  &__completeness-bar {
    height: 6px;
    background: $opc-bg-subtle;
    border-radius: $opc-radius-tag;
    overflow: hidden;
    margin: 6px 0 4px;
  }

  &__completeness-fill {
    height: 100%;
    background: $opc-gradient-primary;
    transition: width 0.4s ease;
  }

  &__completeness-label {
    font-size: 11px;
    color: $opc-color-text-secondary;
  }
}

.stats-row {
  display: flex;
  background: $opc-bg-subtle;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card;
  box-shadow: $opc-shadow-sm;
  padding: $opc-spacing-md 0;
  margin-bottom: $opc-spacing-lg;

  &__tile {
    flex: 1;
    text-align: center;
  }

  &__num {
    font-size: $opc-font-xl;
    font-weight: 700;
    color: $opc-color-accent;
  }

  &__label {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    margin-top: 4px;
  }
}

.profile-grid {
  max-width: 640px;
}

.profile-main {
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-lg;
}

.panel {
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card;
  box-shadow: $opc-shadow-sm;
  padding: $opc-spacing-md;
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-sm;

  &__title {
    margin: 0;
    font-size: $opc-font-base;
    font-weight: 700;
  }
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

  &.is-active {
    background: $opc-gradient-primary;
    border-color: transparent;
    color: #fff;
    font-weight: 600;
  }
}

.btn {
  align-self: flex-start;
  padding: 8px 20px;
  border-radius: $opc-radius-tag;
  font-size: $opc-font-sm;
  font-weight: 600;

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
    color: $opc-color-text-secondary;
  }

  &--small {
    padding: 4px 14px;
    font-size: $opc-font-xs;
  }
}

.case-item {
  background: $opc-bg-subtle;
  border-radius: $opc-radius-card-sm;
  padding: $opc-spacing-sm;

  &__title {
    font-size: $opc-font-sm;
    font-weight: 600;
  }

  &__desc {
    margin: 4px 0 0;
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }
}

.knowledge-item {
  background: $opc-bg-subtle;
  border-radius: $opc-radius-card-sm;
  padding: $opc-spacing-sm;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: $opc-font-sm;
    font-weight: 600;
  }

  &__ai-tag {
    font-size: 11px;
    font-weight: 400;
    color: $opc-color-accent;
    background: $opc-color-accent-soft;
    padding: 2px 8px;
    border-radius: $opc-radius-tag;
  }

  &__summary,
  &__lessons {
    margin: 0;
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    line-height: 1.6;
  }

  &__edit {
    align-self: flex-start;
    font-size: $opc-font-xs;
    color: $opc-color-accent;
  }

  &__actions {
    display: flex;
    gap: $opc-spacing-xs;
  }

  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card-sm;
    padding: $opc-spacing-xs;
    font-size: $opc-font-sm;
  }
}

.profile-loading {
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-md;
}
</style>
