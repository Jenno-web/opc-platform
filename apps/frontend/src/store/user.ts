import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  fetchCurrentUser,
  updateAvatar as updateAvatarApi,
  updateProfile as updateProfileApi,
  type UpdateProfilePayload,
} from '@/api/user'
import type { CurrentUser } from '@/types'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<CurrentUser | null>(null)
  const loading = ref(false)

  async function loadCurrentUser() {
    loading.value = true
    try {
      currentUser.value = await fetchCurrentUser()
    } finally {
      loading.value = false
    }
  }

  // 头像/资料接口现在都直接返回完整 profile（含联动变化的 completeness 分数），
  // 直接拿返回值赋值就行，不用再多打一次 GET /users/me
  async function updateAvatar(avatarUrl: string) {
    currentUser.value = await updateAvatarApi(avatarUrl)
  }

  async function updateProfile(payload: UpdateProfilePayload) {
    currentUser.value = await updateProfileApi(payload)
  }

  return { currentUser, loading, loadCurrentUser, updateAvatar, updateProfile }
})
