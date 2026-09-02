import { request } from '@/utils/request'
import type { CurrentUser, TaskItem } from '@/types'

export function fetchCurrentUser() {
  return request<CurrentUser>({ url: '/users/me' })
}

export function fetchMyTasks() {
  return request<TaskItem[]>({ url: '/tasks/mine' })
}

export function updateAvatar(avatarUrl: string) {
  return request<{ id: string; avatarUrl: string | null }>({
    url: '/users/me/avatar',
    method: 'PATCH',
    data: { avatarUrl },
  })
}
