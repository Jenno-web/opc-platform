import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, ProjectKind, ProjectStatus, PublishTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateProjectDto } from './dto/create-project.dto';

const publisherSelect = {
  select: {
    id: true,
    nickname: true,
    avatarUrl: true,
    professionalIdentity: true,
    ratingAvg: true,
    ratingCount: true,
    createdAt: true,
  },
};

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async list(params: {
    keyword?: string;
    status?: ProjectStatus;
    sort?: string;
    kind?: ProjectKind;
    publishTier?: PublishTier;
  }) {
    const where: Prisma.ProjectWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.kind) where.kind = params.kind;
    if (params.publishTier) where.publishTier = params.publishTier;
    if (params.keyword) {
      where.OR = [
        { title: { contains: params.keyword, mode: 'insensitive' } },
        { background: { contains: params.keyword, mode: 'insensitive' } },
        { skillTags: { some: { name: { contains: params.keyword, mode: 'insensitive' } } } },
      ];
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: { skillTags: true, publisher: publisherSelect },
      orderBy: params.sort === 'heat' ? { heat: 'desc' } : { createdAt: 'desc' },
      take: 30,
    });

    return projects;
  }

  /**
   * 对应"02 搜索与筛选"画板：技能多选 + 预算区间 + 供需类型是真实生效的筛选，
   * 每条结果附带 AI 匹配度（复用已有 analyzeMatch），匹配理由里带上命中的关键词，
   * 和 Figma 里"关键词命中：AI、设计、远程、3k-10k"这种展示方式对应。
   */
  async search(
    userId: string,
    params: {
      keyword?: string;
      kind?: ProjectKind;
      skillNames?: string[];
      budgetMin?: number;
      budgetMax?: number;
    },
  ) {
    const where: Prisma.ProjectWhereInput = { status: 'RECRUITING' };
    if (params.kind) where.kind = params.kind;
    if (params.skillNames?.length) {
      where.skillTags = { some: { name: { in: params.skillNames } } };
    }
    if (params.budgetMin !== undefined || params.budgetMax !== undefined) {
      where.AND = [
        params.budgetMax !== undefined ? { budgetMin: { lte: params.budgetMax } } : {},
        params.budgetMin !== undefined ? { budgetMax: { gte: params.budgetMin } } : {},
      ];
    }
    if (params.keyword) {
      where.OR = [
        { title: { contains: params.keyword, mode: 'insensitive' } },
        { background: { contains: params.keyword, mode: 'insensitive' } },
      ];
    }

    const [user, candidates] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { skillTags: true } }),
      this.prisma.project.findMany({
        where,
        include: { skillTags: true, publisher: publisherSelect },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    const userSkillNames = user.skillTags.map((t) => t.name);
    const results = await Promise.all(
      candidates.map(async (project) => {
        const { score, reason } = await this.aiService.analyzeMatchForSearch(
          userSkillNames,
          project.skillTags.map((t) => t.name),
        );
        return { project, matchScore: score, matchReason: reason };
      }),
    );

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * 对应"06 任务&状态台"画板：只看"我发布的 + 我参与的"项目，
   * 而不是发现页那种面向全平台的公开列表。
   */
  async listMine(userId: string, status?: ProjectStatus) {
    const where: Prisma.ProjectWhereInput = {
      OR: [{ publisherId: userId }, { members: { some: { userId } } }],
    };
    if (status) where.status = status;

    return this.prisma.project.findMany({
      where,
      include: {
        skillTags: true,
        publisher: publisherSelect,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 状态台顶部统计条：发布中 / 收到的响应 / 沟通中（对应"4 发布中 9 响应 2 沟通中"） */
  async myStats(userId: string) {
    const [publishing, responses, inConversation] = await Promise.all([
      this.prisma.project.count({ where: { publisherId: userId, status: 'RECRUITING' } }),
      this.prisma.application.count({ where: { project: { publisherId: userId } } }),
      this.prisma.project.count({ where: { publisherId: userId, status: 'IN_PROGRESS' } }),
    ]);
    return { publishing, responses, inConversation };
  }

  async updateStatus(userId: string, projectId: string, status: ProjectStatus) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    if (project.publisherId !== userId) throw new ForbiddenException('只有发布者可以修改项目状态');
    return this.prisma.project.update({ where: { id: projectId }, data: { status } });
  }

  async detail(id: string, userId: string) {
    const [project, user] = await Promise.all([
      this.prisma.project.findUniqueOrThrow({
        where: { id },
        include: {
          skillTags: true,
          publisher: publisherSelect,
          roles: { include: { requiredSkills: true } },
        },
      }),
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { skillTags: true } }),
    ]);

    const [aiSummary, aiMatch, publisherCollaborationCount] = await Promise.all([
      this.aiService.summarizeProject(userId, project.id, project.background),
      this.aiService.analyzeMatchForSearch(
        user.skillTags.map((t) => t.name),
        project.skillTags.map((t) => t.name),
      ),
      this.prisma.projectMember.count({ where: { userId: project.publisherId } }),
    ]);

    const daysSinceJoin = Math.floor(
      (Date.now() - project.publisher.createdAt.getTime()) / (24 * 3600 * 1000),
    );

    return {
      ...project,
      aiSummary,
      aiMatch,
      publisher: {
        ...project.publisher,
        collaborationCount: publisherCollaborationCount,
        daysSinceJoin,
      },
    };
  }

  async create(publisherId: string, dto: CreateProjectDto) {
    const skillTags = await Promise.all(
      dto.skillTagNames.map((name) =>
        this.prisma.skillTag.upsert({ where: { name }, update: {}, create: { name } }),
      ),
    );

    const project = await this.prisma.project.create({
      data: {
        publisherId,
        title: dto.title,
        background: dto.background,
        goal: dto.goal,
        coreFeatures: dto.coreFeatures,
        deliverables: dto.deliverables,
        acceptanceCriteria: dto.acceptanceCriteria,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        cycleWeeks: dto.cycleWeeks,
        kind: dto.kind ?? 'DEMAND',
        publishTier: dto.publishTier ?? 'STANDARD',
        aiGeneratedDraft: true,
        skillTags: { connect: skillTags.map((tag) => ({ id: tag.id })) },
      },
    });

    return { id: project.id };
  }
}
