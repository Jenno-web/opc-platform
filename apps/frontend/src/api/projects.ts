import { request } from '@/utils/request'
import type { ProjectDetail, ProjectKind, ProjectListItem, PublishTier, RecommendationResult, SearchResult } from '@/types'

export function fetchProjectList(params?: { keyword?: string; status?: string; kind?: ProjectKind; publishTier?: PublishTier }) {
  const query = new URLSearchParams(params as Record<string, string>).toString()
  return request<ProjectListItem[]>({ url: `/projects${query ? `?${query}` : ''}` })
}

export function fetchProjectDetail(id: string) {
  return request<ProjectDetail>({ url: `/projects/${id}` })
}

export function fetchRecommendations() {
  return request<RecommendationResult[]>({ url: '/ai/recommendations' })
}

export function fetchHotProjects() {
  return request<ProjectListItem[]>({ url: '/projects?sort=heat' })
}

export interface SearchFilters {
  keyword?: string
  kind?: ProjectKind
  skillNames?: string[]
  budgetMin?: number
  budgetMax?: number
}

export function fetchMyProjects(status?: string) {
  return request<ProjectListItem[]>({ url: `/projects/mine${status ? `?status=${status}` : ''}` })
}

export function fetchMyProjectStats() {
  return request<{ publishing: number; responses: number; inConversation: number }>({ url: '/projects/mine/stats' })
}

export function updateProjectStatus(id: string, status: string) {
  return request<ProjectListItem>({ url: `/projects/${id}/status`, method: 'PATCH', data: { status } })
}

export function searchProjects(filters: SearchFilters) {
  const params: Record<string, string> = {}
  if (filters.keyword) params.keyword = filters.keyword
  if (filters.kind) params.kind = filters.kind
  if (filters.skillNames?.length) params.skillNames = filters.skillNames.join(',')
  if (filters.budgetMin !== undefined) params.budgetMin = String(filters.budgetMin)
  if (filters.budgetMax !== undefined) params.budgetMax = String(filters.budgetMax)
  const query = new URLSearchParams(params).toString()
  return request<SearchResult[]>({ url: `/projects/search${query ? `?${query}` : ''}` })
}
