import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthPayload } from '../common/jwt-auth.guard';

class GenerateDraftDto {
  @IsString()
  @MinLength(4, { message: '请描述至少 4 个字的项目想法' })
  idea: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('recommendations')
  @ApiOperation({ summary: '推荐能力：基于用户技能标签推荐招募中的项目' })
  getRecommendations(@CurrentUser() user: AuthPayload) {
    return this.aiService.recommendForUser(user.sub);
  }

  @Post('generate-draft')
  @ApiOperation({ summary: '生成能力：把一句话想法整理成结构化项目草稿' })
  generateDraft(@CurrentUser() user: AuthPayload, @Body() dto: GenerateDraftDto) {
    return this.aiService.generateDraft(user.sub, dto.idea);
  }

  @Post('conversations/:id/summarize')
  @ApiOperation({ summary: '总结能力：总结会话聊天记录（对应消息页对话总结）' })
  summarizeConversation(@Param('id') id: string, @CurrentUser() user: AuthPayload) {
    return this.aiService.summarizeConversation(user.sub, id);
  }

  @Post('conversations/:id/suggest-reply')
  @ApiOperation({ summary: '生成能力：根据聊天上下文生成回复建议（对应消息页回复助手）' })
  suggestReply(@Param('id') id: string, @CurrentUser() user: AuthPayload) {
    return this.aiService.suggestReply(user.sub, id);
  }

  @Post('conversations/:id/extract-todos')
  @ApiOperation({ summary: '提取能力：从聊天记录提取待办事项，写入待确认待办（对应消息页待办提取）' })
  extractTodos(@Param('id') id: string, @CurrentUser() user: AuthPayload) {
    return this.aiService.extractTodosFromConversation(user.sub, id);
  }

  @Post('projects/:id/generate-application')
  @ApiOperation({ summary: '生成能力：根据项目信息与个人资料生成申请文案（对应我的页申请助手）' })
  generateApplication(@Param('id') id: string, @CurrentUser() user: AuthPayload) {
    return this.aiService.generateApplicationContent(user.sub, id);
  }
}
