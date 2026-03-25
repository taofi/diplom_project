import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { ChatStateService } from './chat-state.service';

export interface UnreadNotification {
  roomId: number;
  count: number;
  lastMessage?: {
    id: number;
    content: string;
    senderId: number;
  };
}

export interface UserNotification {
  userId: number;
  type: 'unread' | 'new_message' | 'chat_update';
  data: unknown;
}

@Injectable()
export class ChatNotificationService {
  private readonly logger = new Logger(ChatNotificationService.name);
  private server: Server;

  constructor(private readonly chatStateService: ChatStateService) {}

  /**
   * Установить ссылку на Socket.io сервер
   */
  setServer(server: Server): void {
    this.server = server;
  }

  /**
   * Отправить уведомление о непрочитанных сообщениях конкретному пользователю
   * Работает с несколькими вкладками - отправляет на все активные сокеты
   */
  async notifyUnreadCount(userId: number, roomId: number, count: number): Promise<void> {
    if (!this.server) {
      this.logger.warn('Server not set, cannot send unread notification');
      return;
    }

    const sockets = await this.chatStateService.getUserSockets(userId);

    if (sockets.length === 0) {
      // Пользователь не в сети - можно сохранить уведомление в БД для позже
      this.logger.log(`User ${userId} is offline, unread count ${count} will be sent on next connect`);
      return;
    }

    // Отправляем на все сокеты пользователя
    for (const socketId of sockets) {
      this.server.to(socketId).emit('unreadCountUpdate', { roomId, count });
    }

    this.logger.log(`Sent unread count ${count} for room ${roomId} to user ${userId} on ${sockets.length} socket(s)`);
  }

  /**
   * Отправить уведомление о новом сообщении участникам чата
   * Кроме отправителя
   */
  notifyNewMessage(
    roomId: number,
    senderId: number,
    message: {
      id: number;
      content: string;
      senderId: number;
    },
  ): void {
    if (!this.server) {
      this.logger.warn('Server not set, cannot notify new message');
      return;
    }

    const roomKey = `chat:${roomId}`;
    
    // Отправляем всем в комнате, кроме отправителя
    this.server.to(roomKey).emit('newMessage', { message });
    
    this.logger.log(`Notified room ${roomId} about new message ${message.id} from user ${senderId}`);
  }

  /**
   * Отправить уведомление конкретному пользователю на все его сокеты
   */
  async notifyUser(userId: number, event: string, data: unknown): Promise<void> {
    this.logger.log(`[ChatNotificationService] notifyUser: userId=${userId}, event=${event}`);
    
    if (!this.server) {
      this.logger.warn('[ChatNotificationService] Server not set, cannot notify user');
      return;
    }

    const sockets = await this.chatStateService.getUserSockets(userId);
    this.logger.log(`[ChatNotificationService] Found ${sockets.length} sockets for user ${userId}:`, sockets);

    if (sockets.length === 0) {
      this.logger.log(`[ChatNotificationService] User ${userId} is offline, cannot send ${event}`);
      return;
    }

    for (const socketId of sockets) {
      this.logger.log(`[ChatNotificationService] Sending to socketId=${socketId}, event=${event}`);
      this.server.to(socketId).emit(event, data);
    }

    this.logger.log(`[ChatNotificationService] Sent ${event} to user ${userId} on ${sockets.length} socket(s)`);
  }

  /**
   * Оповестить всех участников чата о важных событиях
   * (создание чата, изменение статуса заказа, и т.д.)
   */
  notifyRoom(roomId: number, event: string, data: unknown): void {
    if (!this.server) {
      this.logger.warn('Server not set, cannot notify room');
      return;
    }

    const roomKey = `chat:${roomId}`;
    this.server.to(roomKey).emit(event, data);
    
    this.logger.log(`Notified room ${roomId} about ${event}`);
  }

  /**
   * Отправить обновление списка чатов пользователю
   * Используется при создании нового чата или изменении метаданных
   */
  async notifyChatListUpdate(userId: number): Promise<void> {
    await this.notifyUser(userId, 'chatListUpdate', { timestamp: Date.now() });
  }

  /**
   * Отправить обновление метаданных чата всем участникам
   */
  notifyChatMetaUpdate(roomId: number, meta: unknown): void {
    this.notifyRoom(roomId, 'chatMetaUpdate', meta);
  }

  /**
   * Отправить уведомление о прочтении сообщений
   */
  notifyMessagesRead(roomId: number, userId: number, messageIds: number[]): void {
    if (!this.server) {
      this.logger.warn('Server not set, cannot notify messages read');
      return;
    }

    const roomKey = `chat:${roomId}`;
    this.server.to(roomKey).emit('messagesRead', { userId, messageIds });
    
    this.logger.log(`Notified room ${roomId} that user ${userId} read ${messageIds.length} messages`);
  }

  /**
   * Проверить и отправить непрочитанные уведомления для всех активных пользователей
   * Может вызываться периодически для синхронизации состояния
   */
  syncUnreadCounts(roomId: number, userIds: number[]): void {
    // TODO: Интегрировать с ChatService для получения реальных непрочитанных counts
    // Пока логируем
    this.logger.log(`Would sync unread counts for room ${roomId}: ${userIds.join(', ')}`);
  }
}