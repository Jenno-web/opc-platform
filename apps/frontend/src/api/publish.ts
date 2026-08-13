import { request } from '@/utils/request'

export interface GenerateDraftPayload {
  idea: string
}

export interface GenerateDraftResult {
  direction: string
  targetUser: string
  background: string
  goal: string
  coreFeatures: string
  deliverables: string
  missingFields: string[]
  aiInteractionId: string
}

export function generateProjectDraft(payload: GenerateDraftPayload) {
  return request<GenerateDraftResult>({ url: '/ai/generate-draft', method: 'POST', data: payload })
}

export interface CreateProjectPayload {
  title: string
  background: string
  goal: string
  coreFeatures: string
  deliverables: string
  acceptanceCriteria: string
  budgetMin: number
  budgetMax: number
  cycleWeeks: number
  skillTagNames: string[]
  kind?: 'DEMAND' | 'SUPPLY' | 'MUTUAL'
  publishTier?: 'STANDARD' | 'BOOSTED' | 'BOUNTY'
}

export function createProject(payload: CreateProjectPayload) {
  return request<{ id: string }>({ url: '/projects', method: 'POST', data: payload as unknown as Record<string, unknown> })
}
