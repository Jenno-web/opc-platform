import { ForbiddenException, Injectable } from '@nestjs/common';
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

  async create(userId: string, projectId: string, content: string, roleId?: string, aiGenerated = false) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    // 前端已经隐藏了自己项目上的"提问"/"我想响应"按钮，这里再挡一道——防止绕过前端直接调接口，
    // 也避免出现"申请人和发布者是同一个人"这种脏数据
    if (project.publisherId === userId) throw new ForbiddenException('不能响应自己发布的项目');

    return this.prisma.application.create({
      data: { applicantId: userId, projectId, content, roleId, aiGenerated },
    });
  }
}
