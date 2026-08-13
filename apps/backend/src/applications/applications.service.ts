import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  create(userId: string, projectId: string, content: string, roleId?: string, aiGenerated = false) {
    return this.prisma.application.create({
      data: { applicantId: userId, projectId, content, roleId, aiGenerated },
    });
  }
}
