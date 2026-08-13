import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TodosService } from './todos.service';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthPayload } from '../common/jwt-auth.guard';

@ApiTags('todos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  @ApiOperation({ summary: 'AI 从聊天中提取的待办事项（对应消息页待办事项）' })
  list(@CurrentUser() user: AuthPayload) {
    return this.todosService.listForUser(user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: '确认/编辑待办事项（对应风险矩阵"提取能力"的用户确认机制）' })
  update(@Param('id') id: string, @CurrentUser() user: AuthPayload, @Body() dto: UpdateTodoDto) {
    return this.todosService.update(user.sub, id, dto);
  }
}
