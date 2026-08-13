import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthPayload } from '../common/jwt-auth.guard';

@ApiTags('knowledge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  @ApiOperation({ summary: '我的知识库沉淀列表（对应"我的"页知识库沉淀）' })
  list(@CurrentUser() user: AuthPayload) {
    return this.knowledgeService.listForUser(user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑知识库条目（用户可修改 AI 生成的复盘内容）' })
  update(@Param('id') id: string, @CurrentUser() user: AuthPayload, @Body() dto: UpdateKnowledgeDto) {
    return this.knowledgeService.update(user.sub, id, dto);
  }
}
