<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '@/store/user'
import { fetchSkillTags } from '@/api/user'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'
import type { SkillTag } from '@/types'

// "我的"页之前头像/昵称/身份/简介/技能标签分散在不同地方改（头像点一下直接传，其余
// 压根没有编辑入口），这里收成一个统一的设置页，保存是一次性提交，不是改一项存一次
const userStore = useUserStore()

const uploadingAvatar = ref(false)
const saving = ref(false)
const initialized = ref(false)

const nickname = ref('')
const professionalIdentity = ref('')
const bio = ref('')
const selectedSkills = ref<string[]>([])
const skillCatalog = ref<SkillTag[]>([])
const MAX_SKILLS = 8

function initForm() {
  const user = userStore.currentUser
  if (!user || initialized.value) return
  nickname.value = user.nickname
  professionalIdentity.value = user.professionalIdentity ?? ''
  bio.value = user.bio ?? ''
  selectedSkills.value = user.skillTags.map((t) => t.name)
  initialized.value = true
}

onMounted(async () => {
  if (!userStore.currentUser) await userStore.loadCurrentUser()
  initForm()
  skillCatalog.value = await fetchSkillTags()
})

watch(() => userStore.currentUser, initForm)

function toggleSkill(name: string) {
  const i = selectedSkills.value.indexOf(name)
  if (i === -1) {
    if (selectedSkills.value.length >= MAX_SKILLS) {
      uni.showToast({ title: `最多选 ${MAX_SKILLS} 个技能标签`, icon: 'none' })
      return
    }
    selectedSkills.value.push(name)
  } else {
    selectedSkills.value.splice(i, 1)
  }
}

// 选完的图片先压到一个很小的正方形尺寸再转 base64，不然随手拍的照片动辄几 MB，
// 直接存数据库字段既浪费又可能撞 body 大小上限。压缩在浏览器本地做，不需要后端处理
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
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const path = (res.tempFilePaths as string[])[0]
      uploadingAvatar.value = true
      try {
        const dataUrl = await resizeToDataUrl(path)
        await userStore.updateAvatar(dataUrl)
        uni.showToast({ title: '头像已更新', icon: 'success' })
      } catch {
        uni.showToast({ title: '头像更新失败，换一张试试', icon: 'none' })
      } finally {
        uploadingAvatar.value = false
      }
    },
  })
}

async function handleSave() {
  if (!nickname.value.trim()) {
    uni.showToast({ title: '昵称不能为空', icon: 'none' })
    return
  }
  saving.value = true
  try {
    await userStore.updateProfile({
      nickname: nickname.value.trim(),
      professionalIdentity: professionalIdentity.value.trim(),
      bio: bio.value.trim(),
      skillTagNames: selectedSkills.value,
    })
    uni.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <view class="settings">
    <template v-if="userStore.currentUser">
      <view class="settings__avatar-row">
        <view class="settings__avatar-wrap" hover-class="opc-hover" @click="changeAvatar">
          <Avatar :name="nickname || userStore.currentUser.nickname" :avatar-url="userStore.currentUser.avatarUrl" size="128rpx" />
          <view class="settings__avatar-edit" :class="{ 'is-busy': uploadingAvatar }">
            <Icon name="plus" size="20rpx" color="#ffffff" />
          </view>
        </view>
        <text class="settings__avatar-hint">点击头像更换</text>
      </view>

      <view class="settings__field">
        <text class="settings__field-label">昵称</text>
        <input v-model="nickname" class="settings__input" placeholder="给自己起个名字" maxlength="20" />
      </view>

      <view class="settings__field">
        <text class="settings__field-label">身份介绍</text>
        <input v-model="professionalIdentity" class="settings__input" placeholder="比如：独立产品设计师" maxlength="30" />
      </view>

      <view class="settings__field">
        <text class="settings__field-label">我能提供</text>
        <textarea v-model="bio" class="settings__textarea" placeholder="用几句话介绍你能提供什么" maxlength="300" />
      </view>

      <view class="settings__field">
        <text class="settings__field-label">能力标签（最多 {{ MAX_SKILLS }} 个）</text>
        <view class="settings__chips">
          <text
            v-for="tag in skillCatalog"
            :key="tag.id"
            class="settings__chip"
            hover-class="opc-hover"
            :class="{ 'is-active': selectedSkills.includes(tag.name) }"
            @click="toggleSkill(tag.name)"
          >
            {{ tag.name }}
          </text>
        </view>
      </view>

      <button class="settings__save-btn" hover-class="opc-hover" :loading="saving" @click="handleSave">
        保存
      </button>
    </template>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.settings {
  padding: $opc-spacing;
  padding-bottom: 100rpx;
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-sm;

  &__avatar-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $opc-spacing-xxs;
    padding: $opc-spacing-sm 0 $opc-spacing;
  }

  // 跟 voice-room 的在场徽标是同一个定位思路：相对定位容器 + 绝对定位小圆点
  &__avatar-wrap {
    position: relative;
  }

  &__avatar-edit {
    position: absolute;
    right: -4rpx;
    bottom: -4rpx;
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    background: $opc-color-accent;
    border: 3rpx solid $opc-bg-page;
    display: flex;
    align-items: center;
    justify-content: center;

    &.is-busy {
      opacity: 0.5;
    }
  }

  &__avatar-hint {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }

  &__field-label {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    margin-bottom: $opc-spacing-xxs;
    display: block;
  }

  &__input {
    width: 100%;
    box-sizing: border-box;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card-sm;
    padding: $opc-spacing-xs $opc-spacing-sm;
    font-size: $opc-font-base;
  }

  &__textarea {
    width: 100%;
    box-sizing: border-box;
    min-height: 160rpx;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card-sm;
    padding: $opc-spacing-xs $opc-spacing-sm;
    font-size: $opc-font-base;
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
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    color: $opc-color-text-secondary;

    &.is-active {
      background: $opc-color-primary;
      border-color: $opc-color-primary;
      color: #fff;
      font-weight: 600;
    }
  }

  &__save-btn {
    background: $opc-color-primary;
    color: #fff;
    border-radius: $opc-radius-tag;
    font-size: $opc-font-base;
    margin-top: $opc-spacing-sm;
  }
}
</style>
