import { request } from '@/utils/request'
import type { ProjectDetail, ProjectKind, ProjectListItem, PublishTier, RecommendationResult, SearchResult } from '@/types'

export function fetchProjectList(params?: { keyword?: string; status?: string; kind?: ProjectKind; publishTier?: PublishTier }) {
  // new URLSearchParams(obj) 会把 undefined 字段字面转成字符串 "undefined" 拼进查询串
  // （比如 ?kind=undefined），后端拿到非法枚举值会 500——这里过滤掉未设置的字段，
  // 跟下面 searchProjects 是同一个防御写法
  const entries = Object.entries(params ?? {}).filter(([, v]) => v !== undefined) as [string, string][]
  const query = new URLSearchParams(entries).toString()
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
