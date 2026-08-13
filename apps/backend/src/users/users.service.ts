import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 档案完整度：Figma"我的&OPC档案"页面顶部有个百分比数字，
   * 低保真稿里没有定义具体算法，这是我按常见资料完整度评分方式定的权重，不是从设计稿抠出来的。
   */
  private calcCompleteness(params: {
    hasAvatar: boolean;
    hasIdentity: boolean;
    hasBio: boolean;
    skillCount: number;
    portfolioCount: number;
  }) {
    let score = 0;
    if (params.hasAvatar) score += 15;
    if (params.hasIdentity) score += 15;
    if (params.hasBio) score += 20;
    score += (Math.min(params.skillCount, 3) / 3) * 20;
    score += (Math.min(params.portfolioCount, 2) / 2) * 30;
    return Math.round(score);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { skillTags: true },
    });

    const [collaborationCount, responseCount, knowledgeCount, portfolio] = await Promise.all([
      this.prisma.projectMember.count({ where: { userId } }),
      this.prisma.application.count({ where: { applicantId: userId } }),
      this.prisma.knowledgeEntry.count({ where: { userId } }),
      this.prisma.portfolio.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { projectRef: { select: { id: true, title: true } } },
      }),
    ]);

    const completeness = this.calcCompleteness({
      hasAvatar: !!user.avatarUrl,
      hasIdentity: !!user.professionalIdentity,
      hasBio: !!user.bio,
      skillCount: user.skillTags.length,
      portfolioCount: portfolio.length,
    });

    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      professionalIdentity: user.professionalIdentity,
      bio: user.bio,
      ratingAvg: user.ratingAvg,
      ratingCount: user.ratingCount,
      skillTags: user.skillTags,
      completeness,
      portfolio,
      stats: { collaborationCount, responseCount, knowledgeCount },
    };
  }
}
