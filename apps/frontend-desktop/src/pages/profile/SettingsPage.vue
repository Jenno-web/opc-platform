<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { fetchSkillTags } from '@/api/user'
import { showToast } from '@/composables/useToast'
import type { SkillTag } from '@/types'
import PageContainer from '@/components/layout/PageContainer.vue'
import Icon from '@/components/Icon.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'

const userStore = useUserStore()
const savingProfile = ref(false)

const nickname = ref('')
const professionalIdentity = ref('')
const bio = ref('')
const selectedSkills = ref<string[]>([])
const skillCatalog = ref<SkillTag[]>([])
const MAX_SKILLS = 8
const formInitialized = ref(false)

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

onMounted(async () => {
  if (!userStore.currentUser) await userStore.loadCurrentUser()
  initForm()
  skillCatalog.value = await fetchSkillTags()
})
</script>

<template>
  <PageContainer>
    <div class="settings-page">
      <div class="settings-page__head">
        <h1>设置</h1>
        <RouterLink to="/profile" class="settings-page__back">
          <Icon name="chevron-right" size="14px" style="transform: scaleX(-1)" />
          <span>返回我的主页</span>
        </RouterLink>
      </div>

      <template v-if="userStore.currentUser">
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
      </template>

      <div v-else class="settings-page__loading">
        <SkeletonBlock :rows="4" />
      </div>
    </div>
  </PageContainer>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.settings-page {
  max-width: 680px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $opc-spacing-lg;

    h1 {
      margin: 0;
      font-size: $opc-font-xl;
      font-weight: 800;
    }
  }

  &__back {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    transform: rotate(180deg);

    span {
      display: inline-block;
      transform: rotate(180deg);
    }

    &:hover {
      color: $opc-color-accent;
    }
  }
}

.panel {
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card;
  box-shadow: $opc-shadow-sm;
  padding: $opc-spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-md;

  &__title {
    margin: 0;
    font-size: $opc-font-lg;
    font-weight: 700;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-xxs;

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
    padding: $opc-spacing-sm;
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
}

.settings-page__loading {
  padding-top: $opc-spacing-md;
}
</style>
