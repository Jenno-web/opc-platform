// 与后端 API 返回结构对应的类型定义（对照 apps/backend/prisma/schema.prisma）

export interface SkillTag {
  id: string
  name: string
}

export type ProjectStatus =
  | 'RECRUITING'
  | 'IN_PROGRESS'
  | 'PENDING_CONFIRM'
  | 'COMPLETED'
  | 'ARCHIVED'

export type ProjectKind = 'DEMAND' | 'SUPPLY' | 'MUTUAL'
export type PublishTier = 'STANDARD' | 'BOOSTED' | 'BOUNTY'

export interface PublisherBrief {
  id: string
  nickname: string
  avatarUrl: string | null
  professionalIdentity: string | null
  ratingAvg: number
}

export interface PublisherDetail extends PublisherBrief {
  ratingCount: number
  collaborationCount: number
  daysSinceJoin: number
}

export interface ProjectListItem {
  id: string
  title: string
  background: string
  coverImageUrl: string | null
  budgetMin: number
  budgetMax: number
  cycleWeeks: number
  status: ProjectStatus
  kind: ProjectKind
  publishTier: PublishTier
  heat: number
  createdAt: string
  publisher: PublisherBrief
  skillTags: SkillTag[]
  matchScore?: number
  matchReason?: string
  _count?: { applications: number }
}

export interface ProjectRole {
  id: string
  roleName: string
  headcount: number
  filledCount: number
  requiredSkills: SkillTag[]
}

export interface ProjectDetail extends Omit<ProjectListItem, 'publisher'> {
  goal: string
  coreFeatures: string
  deliverables: string
  acceptanceCriteria: string
  roles: ProjectRole[]
  aiSummary?: string
  aiMatch?: { score: number; reason: string }
  publisher: PublisherDetail
}

export interface RecommendationResult {
  project: ProjectListItem
  matchScore: number
  reason: string
}

export interface SearchResult {
  project: ProjectListItem
  matchScore: number
  matchReason: string
}

export interface TaskItem {
  id: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  dueDate: string | null
  assignee: PublisherBrief | null
}

export type ConversationType = 'PROJECT' | 'PRIVATE' | 'SYSTEM' | 'APPLICATION' | 'CHANNEL'

export interface ConversationItem {
  id: string
  type: ConversationType
  title: string
  // 私信是从项目详情页"提问"/"我想响应"发起的，会带上这个——告诉你对方是通过哪个项目找过来的
  projectTitle: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

export interface ConversationDetail {
  id: string
  type: ConversationType
  title: string
  projectTitle: string | null
}

export interface ChannelItem {
  id: string
  title: string
  category: string | null
  isVoiceRoom: boolean
  unreadCount: number
  memberCount: number
}

export interface TodoItem {
  id: string
  content: string
  assignee: string | null
  dueDate: string | null
  aiExtracted: boolean
  confirmedByUser: boolean
}

export interface MessageSender {
  id: string
  nickname: string
  avatarUrl: string | null
}

export interface ChatMessageItem {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'PROJECT_CARD'
  createdAt: string
  sender: MessageSender
}

export interface ApplicationItem {
  id: string
  content: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  aiGenerated: boolean
  createdAt: string
  project: { id: string; title: string; status: ProjectStatus }
}

export interface KnowledgeEntryItem {
  id: string
  summary: string
  lessonsLearned: string
  aiGenerated: boolean
  editedByUser: boolean
  createdAt: string
  project: { id: string; title: string } | null
}

export interface PortfolioItem {
  id: string
  title: string
  description: string
  aiGenerated: boolean
  createdAt: string
  projectRef: { id: string; title: string } | null
}

export interface CurrentUser {
  id: string
  nickname: string
  avatarUrl: string | null
  professionalIdentity: string | null
  bio: string | null
  ratingAvg: number
  ratingCount: number
  skillTags: SkillTag[]
  completeness: number
  portfolio: PortfolioItem[]
  stats: {
    collaborationCount: number
    responseCount: number
    knowledgeCount: number
  }
}
