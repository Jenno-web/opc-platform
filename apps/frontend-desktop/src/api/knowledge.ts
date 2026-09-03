import { request } from '@/utils/request'
import type { KnowledgeEntryItem } from '@/types'

export function fetchKnowledgeEntries() {
  return request<KnowledgeEntryItem[]>({ url: '/knowledge' })
}

export function updateKnowledgeEntry(id: string, payload: { summary?: string; lessonsLearned?: string }) {
  return request<KnowledgeEntryItem>({ url: `/knowledge/${id}`, method: 'PATCH', data: payload })
}
