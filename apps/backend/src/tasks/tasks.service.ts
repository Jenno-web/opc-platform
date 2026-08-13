import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(userId: string) {
    return this.prisma.task.findMany({
      where: { assigneeId: userId },
      include: { assignee: { select: { id: true, nickname: true, avatarUrl: true, professionalIdentity: true, ratingAvg: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }
}
