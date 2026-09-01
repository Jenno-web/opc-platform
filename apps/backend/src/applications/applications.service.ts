import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const applicantSelect = {
  select: { id: true, nickname: true, avatarUrl: true, professionalIdentity: true },
};

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(userId: string) {
    return this.prisma.application.findMany({
      where: { applicantId: userId },
      include: { project: { select: { id: true, title: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 对应任务页统计条"响应"那个数字——之前这个数字点不进去，看不到具体是谁申请了我的哪个项目 */
  listReceived(userId: string) {
    return this.prisma.application.findMany({
      where: { project: { publisherId: userId } },
      include: {
        applicant: applicantSelect,
        project: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, projectId: string, content: string, roleId?: string, aiGenerated = false) {
    return this.prisma.application.create({
      data: { applicantId: userId, projectId, content, roleId, aiGenerated },
    });
  }
}
