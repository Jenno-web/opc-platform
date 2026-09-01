import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthPayload } from '../common/jwt-auth.guard';

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: '会话列表（对应消息页，不含频道）' })
  list(@CurrentUser() user: AuthPayload) {
    return this.conversationsService.listForUser(user.sub);
  }

  @Get('channels')
  @ApiOperation({ summary: '频道浏览：单社区"培风社官方"下所有频道，按 category 分组展示（对应消息&服务器频道浏览）' })
  listChannels(@CurrentUser() user: AuthPayload) {
    return this.conversationsService.listChannels(user.sub);
  }

  @Post('private/:otherUserId')
  @ApiOperation({
    summary:
      '获取或创建与某用户的私信会话（对应详情页"提问"/"我想响应"入口）。projectId 可选——从项目详情页发起时带上，' +
      '这样对方在消息列表/聊天页能看到"是通过哪个项目联系我的"，不传就是普通私信',
  })
  getOrCreatePrivate(
    @Param('otherUserId') otherUserId: string,
    @Body('projectId') projectId: string | undefined,
    @CurrentUser() user: AuthPayload,
  ) {
    return this.conversationsService.getOrCreatePrivateConversation(user.sub, otherUserId, projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: '会话基础信息，打开即标记已读（对应聊天窗口进入）' })
  getConversation(@Param('id') id: string, @CurrentUser() user: AuthPayload) {
    return this.conversationsService.getConversation(id, user.sub);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: '聊天记录（对应聊天窗口，频道首次访问会自动加入）' })
  listMessages(@Param('id') id: string, @CurrentUser() user: AuthPayload) {
    return this.conversationsService.listMessages(id, user.sub);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: '发送消息（对应聊天窗口发送）' })
  sendMessage(@Param('id') id: string, @CurrentUser() user: AuthPayload, @Body() dto: SendMessageDto) {
    return this.conversationsService.sendMessage(id, user.sub, dto.content);
  }

  @Post(':id/voice/join')
  @ApiOperation({ summary: '加入语音房（仅广播在场状态，不涉及真实音视频流，见 README 边界声明）' })
  joinVoiceRoom(@Param('id') id: string, @CurrentUser() user: AuthPayload) {
    return this.conversationsService.joinVoiceRoom(id, user.sub);
  }

  @Post(':id/voice/leave')
  @ApiOperation({ summary: '离开语音房' })
  leaveVoiceRoom(@Param('id') id: string, @CurrentUser() user: AuthPayload) {
    return this.conversationsService.leaveVoiceRoom(id, user.sub);
  }

  @Get(':id/voice/participants')
  @ApiOperation({ summary: '语音房当前在场成员' })
  listVoiceRoomParticipants(@Param('id') id: string) {
    return this.conversationsService.listVoiceRoomParticipants(id);
  }
}
