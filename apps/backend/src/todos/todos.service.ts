import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string) {
    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: [{ confirmedByUser: 'asc' }, { dueDate: 'asc' }],
    });
  }

  async update(userId: string, todoId: string, dto: UpdateTodoDto) {
    const todo = await this.prisma.todo.findUniqueOrThrow({ where: { id: todoId } });
    if (todo.userId !== userId) throw new ForbiddenException('无法修改他人的待办事项');

    return this.prisma.todo.update({
      where: { id: todoId },
      data: dto,
    });
  }
}
