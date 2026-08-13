import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { AuthPayload } from '../common/jwt-auth.guard';

/**
 * 消息实时推送网关（Phase 4）。
 * REST 接口仍然是发消息的唯一入口（保留校验、鉴权、数据落库的完整链路）；
 * WebSocket 只负责"消息写入数据库之后，把它实时推给会话里的其他参与者"，
 * 前端聊天窗口打开时不用轮询，收到 message:new 事件直接把消息插进列表。
 *
 * 每个用户连接后会加入一个专属房间 `user:{userId}`，推送时按用户 ID 定向发送，
 * 不需要知道对方有没有打开对应的聊天页面。
 *
 * 频道/语音房场景还需要按"会话"广播（比如语音房里谁进谁出，要让所有正在看这个频道的人
 * 实时看到，不只是已知的 ConversationParticipant），客户端进入频道页面时会额外
 * emit `joinConversation` 加入 `conversation:{id}` 房间。
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthPayload>(token);
      await client.join(`user:${payload.sub}`);
      this.logger.log(`用户 ${payload.sub} 已建立实时连接`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`连接断开：${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(client: Socket, conversationId: string) {
    client.join(`conversation:${conversationId}`);
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(client: Socket, conversationId: string) {
    client.leave(`conversation:${conversationId}`);
  }

  emitNewMessage(userIds: string[], payload: unknown) {
    for (const userId of userIds) {
      this.server.to(`user:${userId}`).emit('message:new', payload);
    }
  }

  emitTodosExtracted(userId: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit('todos:extracted', payload);
  }

  emitToConversation(conversationId: string, event: string, payload: unknown) {
    this.server.to(`conversation:${conversationId}`).emit(event, payload);
  }
}
