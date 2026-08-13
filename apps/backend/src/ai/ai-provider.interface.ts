// 六大 AI 能力的统一接口：推荐 / 生成 / 总结 / 分析 / 提取 / 工作流
// MockAIProvider 与 ClaudeAIProvider 都实现这个接口，上层 AiService 不关心具体实现

export interface RecommendCandidate {
  projectId: string;
  title: string;
  skillTagNames: string[];
}

export interface RecommendOutput {
  projectId: string;
  score: number;
  reason: string;
}

export interface GenerateDraftOutput {
  direction: string;
  targetUser: string;
  background: string;
  goal: string;
  coreFeatures: string;
  deliverables: string;
  missingFields: string[];
}

export interface MatchAnalysisOutput {
  score: number;
  reason: string;
}

export interface ExtractedTodo {
  content: string;
  assignee?: string;
  dueDate?: string;
}

export interface ApplicantProfile {
  nickname: string;
  professionalIdentity?: string | null;
  bio?: string | null;
  skillTagNames: string[];
}

export interface ApplicationTargetProject {
  title: string;
  goal: string;
  coreFeatures: string;
}

export interface AIProvider {
  /** 推荐能力：根据用户技能标签在候选项目中排序打分 */
  recommendProjects(userSkillTags: string[], candidates: RecommendCandidate[]): Promise<RecommendOutput[]>;

  /** 生成能力：把用户的一句话想法整理成结构化项目草稿 */
  generateProjectDraft(idea: string): Promise<GenerateDraftOutput>;

  /** 总结能力：把长文本（项目描述/聊天记录）压缩成摘要 */
  summarizeContent(content: string): Promise<string>;

  /** 分析能力：分析用户与项目的匹配程度 */
  analyzeMatch(userSkillTags: string[], projectSkillTags: string[]): Promise<MatchAnalysisOutput>;

  /** 提取能力：从聊天内容中提取待办事项 */
  extractTodos(chatContent: string): Promise<ExtractedTodo[]>;

  /** 生成能力：根据聊天上下文生成一条回复建议 */
  suggestReply(chatContent: string): Promise<string>;

  /** 生成能力：根据项目信息与用户资料生成项目申请文案 */
  generateApplicationContent(project: ApplicationTargetProject, applicant: ApplicantProfile): Promise<string>;
}
