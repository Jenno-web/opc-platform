import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string) {
    return this.prisma.knowledgeEntry.findMany({
      where: { userId },
      include: { project: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(userId: string, id: string, dto: UpdateKnowledgeDto) {
    const entry = await this.prisma.knowledgeEntry.findUniqueOrThrow({ where: { id } });
    if (entry.userId !== userId) throw new ForbiddenException('无法修改他人的知识库条目');

    return this.prisma.knowledgeEntry.update({
      where: { id },
      // 用户编辑过 AI 生成的复盘内容后，标记 editedByUser，呼应风险矩阵"允许人工编辑"的要求
      data: { ...dto, editedByUser: true },
    });
  }
}
