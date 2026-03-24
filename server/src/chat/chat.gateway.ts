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
import { ChatStateService } from './services/chat-state.service';
import { ChatMessageService } from './services/chat-message.service';
import { ChatNotificationService } from './services/chat-notification.service';

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
    private readonly chatStateService: ChatStateService,
    private readonly chatMessageService: ChatMessageService,
    private readonly chatNotificationService: ChatNotificationService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
    
    // Передаем сервер в сервисы для рассылки сообщений
    this.chatMessageService.setServer(server);
    this.chatNotificationService.setServer(server);
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
    const userId = (client.data as { userId: number }).userId;
    console.log(`Client disconnected: ${client.id}, userId: ${userId}`);
    
    // Обрабатываем отключение сокета через ChatStateService
    if (userId) {
      this.chatStateService.onUserDisconnect(userId, client.id);
    }
  }

  @SubscribeMessage('initChat')
  async handleInitChat(client: Socket, payload: { sellerId: number; productId?: number; userProductId?: number }) {
    console.log(`[ChatGateway] initChat: sellerId=${payload.sellerId}, productId=${payload.productId}, userProductId=${payload.userProductId}, clientId=${client.id}`);
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
    console.log(`[ChatGateway] joinRoom: roomId=${payload.roomId}, clientId=${client.id}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    client.join(`chat:${payload.roomId}`);
    
    // Устанавливаем активную комнату в Redis для отслеживания состояния
    await this.chatStateService.setUserActiveRoom(userId, client.id, payload.roomId);
    
    // Отмечаем сообщения как прочитанные
    await this.chatService.markMessagesAsRead(payload.roomId, userId);

    return { success: true };
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client: Socket, payload: { roomId: number }) {
    console.log(`[ChatGateway] leaveRoom: roomId=${payload.roomId}, clientId=${client.id}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    client.leave(`chat:${payload.roomId}`);

    // Очищаем активную комнату в Redis
    await this.chatStateService.clearUserActiveRoom(userId, client.id);

    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: Socket,
    payload: { roomId: number; content: string; type?: string; attachmentUrl?: string },
  ) {
    console.log(`[ChatGateway] sendMessage: roomId=${payload.roomId}, type=${payload.type}, content="${payload.content?.substring(0, 50)}"`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    // Делегируем отправку сообщения в ChatMessageService
    const result = await this.chatMessageService.sendMessage({
      roomId: payload.roomId,
      senderId: userId,
      content: payload.content,
      type: (payload.type as MessageType) || MessageType.TEXT,
      attachmentUrl: payload.attachmentUrl,
    });

    if (!result.success) {
      return { error: result.error || 'Failed to send message' };
    }

    return { success: true, message: result.message };
  }

  /**
   * Установить активную комнату (вызывается при переключении вкладок)
   * Это позволяет отслеживать, в каком чате пользователь на каждой вкладке
   */
  @SubscribeMessage('setActiveRoom')
  async handleSetActiveRoom(client: Socket, payload: { roomId: number }) {
    console.log(`[ChatGateway] setActiveRoom called: roomId=${payload.roomId}, clientId=${client.id}`);
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    await this.chatStateService.setUserActiveRoom(userId, client.id, payload.roomId);
    
    return { success: true };
  }

  /**
   * Очистить активную комнату (вызывается при закрытии вкладки)
   */
  @SubscribeMessage('clearActiveRoom')
  async handleClearActiveRoom(client: Socket) {
    console.log(`[ChatGateway] clearActiveRoom: clientId=${client.id}`);
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    await this.chatStateService.clearUserActiveRoom(userId, client.id);
    
    return { success: true };
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
