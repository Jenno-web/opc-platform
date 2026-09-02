import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchCurrentUser, updateAvatar as updateAvatarApi } from '@/api/user'
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

  // 头像完整度算分也依赖 avatarUrl（见后端 calcCompleteness），改完头像整份 profile 都要刷新，
  // 不只是替换 avatarUrl 这一个字段，所以直接重新拉一次 loadCurrentUser 而不是本地手动拼
  async function updateAvatar(avatarUrl: string) {
    await updateAvatarApi(avatarUrl)
    await loadCurrentUser()
  }

  return { currentUser, loading, loadCurrentUser, updateAvatar }
})
