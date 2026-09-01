import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../realtime/chat.gateway';

const senderSelect = {
  select: { id: true, nickname: true, avatarUrl: true },
};

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async listForUser(userId: string) {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId, conversation: { type: { not: 'CHANNEL' } } },
      include: {
        conversation: {
          include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            // PRIVATE 会话要拿到"对方"是谁——title 字段存的是创建时固定写死的字符串，
            // 双方看到的是同一份，会出现"我给自己发消息"这种错觉（见下方 title 计算）
            participants: { where: { userId: { not: userId } }, include: { user: { select: { nickname: true } } } },
            // 私信如果是从项目详情页"提问"发起的，会带着 projectId，用来告诉收信人
            // "对方是通过哪个项目找过来的"，不然打开一条私信完全没有上下文
            project: { select: { title: true } },
          },
        },
      },
      orderBy: { conversation: { lastMessageAt: 'desc' } },
    });

    return participations.map((p) => ({
      id: p.conversation.id,
      type: p.conversation.type,
      title:
        p.conversation.type === 'PRIVATE'
          ? (p.conversation.participants[0]?.user.nickname ?? p.conversation.title)
          : p.conversation.title,
      projectTitle: p.conversation.project?.title ?? null,
      lastMessage: p.conversation.messages[0]?.content ?? '',
      lastMessageAt: p.conversation.lastMessageAt,
      unreadCount: p.unreadCount,
    }));
  }

  /** 频道浏览：单社区"培风社官方"，按 category 分组。频道对所有登录用户可见，不要求预先是参与者。 */
  async listChannels(userId: string) {
    const channels = await this.prisma.conversation.findMany({
      where: { type: 'CHANNEL' },
      include: {
        participants: { where: { userId } },
        _count: { select: { participants: true } },
      },
      orderBy: { title: 'asc' },
    });

    return channels.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      isVoiceRoom: c.isVoiceRoom,
      unreadCount: c.participants[0]?.unreadCount ?? 0,
      memberCount: c._count.participants,
    }));
  }

  /**
   * 对应"04 响应/联系"画板的"提问"/"我想响应"入口：找到（或新建）与项目发布者的私信会话。
   * projectId 可选——从项目详情页发起时带上，存到会话上，这样对方能看到"是通过哪个项目联系我的"，
   * 不是打开一条私信完全不知道对方是谁、为什么找过来
   */
  async getOrCreatePrivateConversation(userId: string, otherUserId: string, projectId?: string) {
    if (userId === otherUserId) throw new ForbiddenException('不能和自己私信');

    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'PRIVATE',
        participants: { some: { userId } },
        AND: [{ participants: { some: { userId: otherUserId } } }],
      },
      include: { project: { select: { title: true } } },
    });
    if (existing) return existing;

    const otherUser = await this.prisma.user.findUniqueOrThrow({ where: { id: otherUserId } });
    return this.prisma.conversation.create({
      data: {
        type: 'PRIVATE',
        title: otherUser.nickname,
        projectId: projectId ?? undefined,
        participants: { create: [{ userId }, { userId: otherUserId }] },
      },
      include: { project: { select: { title: true } } },
    });
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenException('你不在这个会话中');
    return participant;
  }

  /** 频道是公开的：第一次访问自动加入（写入 ConversationParticipant），私信/项目群仍然要求已是参与者。 */
  private async ensureAccess(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } });
    if (conversation.type !== 'CHANNEL') {
      await this.assertParticipant(conversationId, userId);
      return conversation;
    }

    await this.prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      update: {},
      create: { conversationId, userId },
    });
    return conversation;
  }

  async getConversation(conversationId: string, userId: string) {
    await this.ensureAccess(conversationId, userId);
    const conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      include: {
        participants: { where: { userId: { not: userId } }, include: { user: { select: { nickname: true } } } },
        project: { select: { title: true } },
      },
    });

    return {
      id: conversation.id,
      type: conversation.type,
      title: conversation.type === 'PRIVATE' ? (conversation.participants[0]?.user.nickname ?? conversation.title) : conversation.title,
      projectTitle: conversation.project?.title ?? null,
    };
  }

  async listMessages(conversationId: string, userId: string) {
    await this.ensureAccess(conversationId, userId);

    // "打开会话即视为已读"这个动作要挂在前端真正会调用的接口上——之前挂在 getConversation
    // 上，但聊天页加载消息走的是这个 listMessages，getConversation 从来没被前端调用过，
    // 导致未读数永远不会被清掉
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { unreadCount: 0 },
    });

    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      include: { sender: senderSelect },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(conversationId: string, userId: string, content: string) {
    await this.ensureAccess(conversationId, userId);

    const message = await this.prisma.chatMessage.create({
      data: { conversationId, senderId: userId, content },
      include: { sender: senderSelect },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    // 发送者已读，其余参与者未读数 +1（对应消息页的未读提醒）
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: { not: userId } },
      data: { unreadCount: { increment: 1 } },
    });
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { unreadCount: 0 },
    });

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    this.chatGateway.emitNewMessage(
      participants.map((p) => p.userId),
      message,
    );
    // 频道消息额外广播给正在看这个频道的所有人（不管是不是已知参与者），走会话房间
    this.chatGateway.emitToConversation(conversationId, 'message:new', message);

    return message;
  }

  /** 语音房：只广播"谁在场"，不涉及真实音视频流（见 README 边界声明） */
  async joinVoiceRoom(conversationId: string, userId: string) {
    await this.ensureAccess(conversationId, userId);
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { inVoiceRoom: true },
    });
    const participants = await this.listVoiceRoomParticipants(conversationId);
    this.chatGateway.emitToConversation(conversationId, 'voice:participants', participants);
    return participants;
  }

  async leaveVoiceRoom(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { inVoiceRoom: false },
    });
    const participants = await this.listVoiceRoomParticipants(conversationId);
    this.chatGateway.emitToConversation(conversationId, 'voice:participants', participants);
    return participants;
  }

  async listVoiceRoomParticipants(conversationId: string) {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, inVoiceRoom: true },
      include: { user: { select: { id: true, nickname: true, avatarUrl: true } } },
    });
    return participants.map((p) => p.user);
  }
}
