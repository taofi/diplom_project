import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { MessageType } from '../db/models/chat-message.model';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const token: string | undefined =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload: { sub: number; username: string } = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (client.data as { userId: number; username: string }).userId = payload.sub;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (client.data as { userId: number; username: string }).username = payload.username;

      console.log(`Client connected: ${client.id}, userId: ${payload.sub}`);
    } catch {
      console.log('Invalid token, disconnecting client');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('initChat')
  async handleInitChat(client: Socket, payload: { sellerId: number; productId?: number; userProductId?: number }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    // Создаем чат напрямую в БД с visibility: PENDING
    const chat = await this.chatService.createPendingChat(
      userId,
      payload.sellerId,
      payload.productId,
      payload.userProductId,
    );

    // Возвращаем ID чата (он невидим для автора пока не будет отправлено сообщение)
    return { chatId: chat.id };
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, payload: { roomId: number }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    client.join(`chat:${payload.roomId}`);
    
    // Отмечаем сообщения как прочитанные
    await this.chatService.markMessagesAsRead(payload.roomId, userId);

    return { success: true };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, payload: { roomId: number }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    client.leave(`chat:${payload.roomId}`);

    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: Socket,
    payload: { roomId: number; content: string; type?: string; attachmentUrl?: string },
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    try {
      const message = await this.chatService.sendMessage(
        payload.roomId,
        userId,
        payload.content,
        (payload.type as MessageType) || MessageType.TEXT,
        payload.attachmentUrl,
      );

      // Рассылаем сообщение всем в комнате
      this.server.to(`chat:${payload.roomId}`).emit('newMessage', { message });

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, payload: { roomId: number; isTyping: boolean }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return;
    }

    // Рассылаем событие typing всем в комнате, кроме отправителя
    client.to(`chat:${payload.roomId}`).emit('userTyping', {
      roomId: payload.roomId,
      userId,
      isTyping: payload.isTyping,
    });
  }

  // Метод для отправки уведомлений из сервиса
  notifyUser(userId: number, event: string, data: unknown) {
    // Найти сокеты пользователя и отправить им событие
    // Это можно расширить для реализации уведомлений
    this.server.emit(event, data);
  }
}
