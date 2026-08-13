import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchCurrentUser } from '@/api/user'
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

  return { currentUser, loading, loadCurrentUser }
})
