import { request } from '@/utils/request'
import type { ApplicationItem, ReceivedApplicationItem } from '@/types'

export function fetchMyApplications() {
  return request<ApplicationItem[]>({ url: '/applications/mine' })
}

export function fetchReceivedApplications() {
  return request<ReceivedApplicationItem[]>({ url: '/applications/received' })
}

export function createApplication(payload: { projectId: string; content: string; aiGenerated?: boolean }) {
  return request<{ id: string }>({ url: '/applications', method: 'POST', data: payload })
}

export function generateApplicationContent(projectId: string) {
  return request<{ content: string; aiInteractionId: string }>({
    url: `/ai/projects/${projectId}/generate-application`,
    method: 'POST',
  })
}
