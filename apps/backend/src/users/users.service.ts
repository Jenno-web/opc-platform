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

  /**
   * 头像没有真实的上传/图片处理后端（Railway 部署环境是无持久卷的临时文件系统，写磁盘
   * 重启就丢），所以不走"传文件存路径"这条路，而是前端把图片压缩到很小的尺寸后转成
   * base64 data URI，整个字符串直接存进 avatarUrl 这个 TEXT 字段——数据库本身是持久的，
   * 不受重启影响，不需要额外接对象存储
   */
  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    });
    return user;
  }
}
