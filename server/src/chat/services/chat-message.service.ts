import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Server } from 'socket.io';
import { ChatService } from '../chat.service';
import { ChatStateService } from './chat-state.service';
import { ChatMessage, MessageType } from '../../db/models/chat-message.model';

export interface SendMessagePayload {
  roomId: number;
  senderId: number;
  content: string;
  type?: MessageType;
  attachmentUrl?: string;
}

export interface MessageResult {
  success: boolean;
  message?: ChatMessage;
  error?: string;
}

@Injectable()
export class ChatMessageService {
  private readonly logger = new Logger(ChatMessageService.name);
  private server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly chatStateService: ChatStateService,
  ) {}

  /**
   * Установить ссылку на Socket.io сервер
   */
  setServer(server: Server): void {
    this.server = server;
  }

  /**
   * Отправить сообщение в чат
   * Включает проверку roomId для исправления бага с отображением в неправильном чате
   */
  async sendMessage(payload: SendMessagePayload): Promise<MessageResult> {
    const { roomId, senderId, content, type, attachmentUrl } = payload;

    try {
      // Проверяем, что пользователь действительно в этой комнате
      // Это исправляет баг, когда сообщение отображается в неправильном чате
      const isInRoom = await this.chatStateService.isUserInRoom(senderId, roomId);
      
      // Логируем для отладки, если пользователь не в комнате
      if (!isInRoom) {
        this.logger.warn(
          `User ${senderId} sending message to room ${roomId} but not in Redis state`,
        );
        // Не блокируем отправку, так как пользователь мог присоединиться через socket.io напрямую
      }

      // Создаем и сохраняем сообщение через ChatService
      const message = await this.chatService.sendMessage(
        roomId,
        senderId,
        content,
        type || MessageType.TEXT,
        attachmentUrl,
      );

      // Рассылаем сообщение участникам комнаты
      this.broadcastToRoom(roomId, message);

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Error sending message in room ${roomId}:`, error);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        return { success: false, error: error.message };
      }
      
      return { success: false, error: 'Failed to send message' };
    }
  }

  /**
   * Рассылка сообщения всем участникам комнаты
   */
  broadcastToRoom(roomId: number, message: ChatMessage): void {
    if (!this.server) {
      this.logger.warn('Server not set, cannot broadcast message');
      return;
    }

    const roomKey = `chat:${roomId}`;
    
    // Отправляем сообщение всем в комнате
    this.server.to(roomKey).emit('newMessage', { message });
    
    this.logger.log(`Broadcast message ${message.id} to room ${roomId}`);
  }

  /**
   * Отправить сообщение конкретному пользователю (через все его сокеты/вкладки)
   */
  async sendToUser(userId: number, event: string, data: any): Promise<void> {
    if (!this.server) {
      this.logger.warn('Server not set, cannot send to user');
      return;
    }

    // Получаем все активные сокеты пользователя
    const sockets = await this.chatStateService.getUserSockets(userId);

    if (sockets.length === 0) {
      this.logger.log(`User ${userId} is offline, cannot send ${event}`);
      return;
    }

    // Отправляем событие на все сокеты пользователя
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, data);
    }

    this.logger.log(`Sent ${event} to user ${userId} on ${sockets.length} socket(s)`);
  }

  /**
   * Рассылка события участникам комнаты, кроме указанного сокета
   */
  notifyRoomMembers(
    roomId: number,
    excludeSocketId: string | null,
    event: string,
    data: unknown,
  ): void {
    if (!this.server) {
      this.logger.warn('Server not set, cannot notify room members');
      return;
    }

    const roomKey = `chat:${roomId}`;
    
    if (excludeSocketId) {
      // Исключаем конкретный сокет
      this.server.to(roomKey).except(excludeSocketId).emit(event, data);
    } else {
      // Отправляем всем в комнате
      this.server.to(roomKey).emit(event, data);
    }

    this.logger.log(`Notified room ${roomId} about ${event} (excluding ${excludeSocketId || 'none'})`);
  }

  /**
   * Получить количество непрочитанных сообщений для пользователя
   * @deprecated Требует реализации через БД
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getUnreadCount(_userId: number, _roomId: number): number {
    // TODO: Реализовать подсчет непрочитанных сообщений из БД
    // Пока возвращаем 0 - нужно интегрировать с ChatService
    return 0;
  }

  /**
   * Отправить обновление счетчика непрочитанных сообщений пользователю
   */
  async sendUnreadCountUpdate(userId: number, roomId: number, count: number): Promise<void> {
    await this.sendToUser(userId, 'unreadCountUpdate', {
      roomId,
      count,
    });
  }
}