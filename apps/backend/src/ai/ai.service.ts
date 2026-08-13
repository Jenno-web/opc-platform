import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AI_PROVIDER } from './ai.constants';
import type { AIProvider } from './ai-provider.interface';
import { RecommendCandidate } from './ai-provider.interface';
import type { AICapability } from '@prisma/client';
import { ChatGateway } from '../realtime/chat.gateway';

const MAX_CONTEXT_MESSAGES = 30;

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AIProvider,
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  private logInteraction(params: {
    userId: string;
    capability: AICapability;
    inputRef: string;
    outputRaw: unknown;
    sourceContentRef?: string;
  }) {
    // 风险矩阵要求"可追溯"：无论走 Mock 还是真实模型，每次 AI 输出都落库，方便用户回溯依据
    return this.prisma.aIInteractionLog.create({
      data: {
        userId: params.userId,
        capability: params.capability,
        inputRef: params.inputRef,
        outputRaw: JSON.stringify(params.outputRaw),
        sourceContentRef: params.sourceContentRef,
      },
    });
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenException('你不在这个会话中');
  }

  private async getConversationTranscript(conversationId: string) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      include: { sender: { select: { nickname: true } } },
      orderBy: { createdAt: 'desc' },
      take: MAX_CONTEXT_MESSAGES,
    });
    const chronological = messages.reverse();
    return {
      transcript: chronological.map((m) => `${m.sender.nickname}: ${m.content}`).join('\n'),
      lastMessage: chronological[chronological.length - 1],
    };
  }

  async recommendForUser(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { skillTags: true },
    });

    const candidateProjects = await this.prisma.project.findMany({
      where: { status: 'RECRUITING' },
      include: { skillTags: true, publisher: true },
      take: 10,
    });

    const candidates: RecommendCandidate[] = candidateProjects.map((project) => ({
      projectId: project.id,
      title: project.title,
      skillTagNames: project.skillTags.map((tag) => tag.name),
    }));

    const results = await this.provider.recommendProjects(
      user.skillTags.map((tag) => tag.name),
      candidates,
    );

    await this.logInteraction({
      userId,
      capability: 'RECOMMEND',
      inputRef: `skillTags:${user.skillTags.map((t) => t.name).join(',')}`,
      outputRaw: results,
    });

    const projectMap = new Map(candidateProjects.map((p) => [p.id, p]));
    return results
      .filter((r) => projectMap.has(r.projectId))
      .map((r) => ({ project: projectMap.get(r.projectId)!, matchScore: r.score, reason: r.reason }));
  }

  /**
   * 搜索结果列表用的轻量匹配度计算（对应"02 搜索与筛选"画板的"匹配 92%"标签）。
   * 一次搜索可能要给几十条候选结果算分，不对每一条都写 AIInteractionLog——
   * 逐条落库在这个场景下意义不大（不是一条独立的"建议"，只是列表排序辅助），
   * 会拖慢列表接口。可追溯性由 /ai/recommendations 这类真正的推荐入口保证。
   */
  analyzeMatchForSearch(userSkillTags: string[], projectSkillTags: string[]) {
    return this.provider.analyzeMatch(userSkillTags, projectSkillTags);
  }

  async generateDraft(userId: string, idea: string) {
    const draft = await this.provider.generateProjectDraft(idea);
    const log = await this.logInteraction({
      userId,
      capability: 'GENERATE',
      inputRef: idea,
      outputRaw: draft,
    });
    return { ...draft, aiInteractionId: log.id };
  }

  async summarizeProject(userId: string, projectId: string, content: string) {
    const summary = await this.provider.summarizeContent(content);
    await this.logInteraction({
      userId,
      capability: 'SUMMARIZE',
      inputRef: projectId,
      outputRaw: summary,
      sourceContentRef: content,
    });
    return summary;
  }

  async summarizeConversation(userId: string, conversationId: string) {
    await this.assertParticipant(conversationId, userId);
    const { transcript } = await this.getConversationTranscript(conversationId);
    const summary = await this.provider.summarizeContent(transcript);
    await this.logInteraction({
      userId,
      capability: 'SUMMARIZE',
      inputRef: conversationId,
      outputRaw: summary,
      sourceContentRef: transcript,
    });
    return { summary };
  }

  async suggestReply(userId: string, conversationId: string) {
    await this.assertParticipant(conversationId, userId);
    const { transcript } = await this.getConversationTranscript(conversationId);
    const reply = await this.provider.suggestReply(transcript);
    await this.logInteraction({
      userId,
      capability: 'GENERATE',
      inputRef: conversationId,
      outputRaw: reply,
      sourceContentRef: transcript,
    });
    return { reply };
  }

  async extractTodosFromConversation(userId: string, conversationId: string) {
    await this.assertParticipant(conversationId, userId);
    const { transcript, lastMessage } = await this.getConversationTranscript(conversationId);
    const extracted = await this.provider.extractTodos(transcript);

    await this.logInteraction({
      userId,
      capability: 'EXTRACT',
      inputRef: conversationId,
      outputRaw: extracted,
      sourceContentRef: transcript,
    });

    // 提取能力必须保留"用户确认"机制：直接落库为待确认待办，不自动生效
    const created = await Promise.all(
      extracted.map((todo) => {
        const dueDate = todo.dueDate && !Number.isNaN(Date.parse(todo.dueDate)) ? new Date(todo.dueDate) : null;
        return this.prisma.todo.create({
          data: {
            userId,
            conversationId,
            sourceMessageId: lastMessage?.id,
            content: todo.content,
            assignee: todo.assignee,
            dueDate,
            aiExtracted: true,
            confirmedByUser: false,
          },
        });
      }),
    );

    this.chatGateway.emitTodosExtracted(userId, created);
    return created;
  }

  async generateApplicationContent(userId: string, projectId: string) {
    const [project, applicant] = await Promise.all([
      this.prisma.project.findUniqueOrThrow({ where: { id: projectId } }),
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { skillTags: true } }),
    ]);

    const content = await this.provider.generateApplicationContent(
      { title: project.title, goal: project.goal, coreFeatures: project.coreFeatures },
      {
        nickname: applicant.nickname,
        professionalIdentity: applicant.professionalIdentity,
        bio: applicant.bio,
        skillTagNames: applicant.skillTags.map((t) => t.name),
      },
    );

    const log = await this.logInteraction({
      userId,
      capability: 'GENERATE',
      inputRef: projectId,
      outputRaw: content,
    });

    return { content, aiInteractionId: log.id };
  }
}
