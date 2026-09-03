import { request } from '@/utils/request'
import type { CurrentUser, SkillTag, TaskItem } from '@/types'

export function fetchCurrentUser() {
  return request<CurrentUser>({ url: '/users/me' })
}

export function fetchMyTasks() {
  return request<TaskItem[]>({ url: '/tasks/mine' })
}

export function updateAvatar(avatarUrl: string) {
  return request<CurrentUser>({
    url: '/users/me/avatar',
    method: 'PATCH',
    data: { avatarUrl },
  })
}

export interface UpdateProfilePayload {
  nickname?: string
  professionalIdentity?: string
  bio?: string
  skillTagNames?: string[]
}

export function updateProfile(payload: UpdateProfilePayload) {
  return request<CurrentUser>({
    url: '/users/me',
    method: 'PATCH',
    data: payload,
  })
}

export function fetchSkillTags() {
  return request<SkillTag[]>({ url: '/users/skill-tags' })
}
