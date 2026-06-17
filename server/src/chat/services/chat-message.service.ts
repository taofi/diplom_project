import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Server } from 'socket.io';
import { ChatService } from '../chat.service';
import { ChatStateService } from './chat-state.service';
import { ChatCacheService } from './chat-cache.service';
import { ChatMessage, MessageType } from '../../db/models/chat-message.model';
import { ChatAttachmentKind } from '../../db/models/chat-message-attachment.model';

export interface SendMessagePayload {
  roomId: number;
  senderId: number;
  content: string;
  type?: MessageType;
  attachments?: Array<{
    kind: ChatAttachmentKind;
    url: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>;
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
    private readonly chatCacheService: ChatCacheService,
  ) {}

  
  setServer(server: Server): void {
    this.server = server;
  }

  
  async sendMessage(payload: SendMessagePayload): Promise<MessageResult> {
    const { roomId, senderId, content, type, attachments } = payload;

    try {
      const isInRoom = await this.chatStateService.isUserInRoom(senderId, roomId);
      
      if (!isInRoom) {
        this.logger.warn(
          `User ${senderId} sending message to room ${roomId} but not in Redis state`,
        );
      }

      const message = await this.chatService.sendMessage(
        roomId,
        senderId,
        content,
        type || MessageType.TEXT,
        attachments || [],
      );

      await this.broadcastToMembers(roomId, message, senderId);

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Error sending message in room ${roomId}:`, error);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        return { success: false, error: error.message };
      }
      
      return { success: false, error: 'Failed to send message' };
    }
  }

  
  broadcastToRoom(roomId: number, message: ChatMessage): void {
    if (!this.server) {
      this.logger.warn('Server not set, cannot broadcast message');
      return;
    }

    const roomKey = `chat:${roomId}`;
    
    this.server.to(roomKey).emit('newMessage', { message });
    
    this.logger.log(`Broadcast message ${message.id} to room ${roomId}`);
    console.log(`[ChatMessageService] Broadcast message ${message.id} to room ${roomId}, chat_room_id=${message.chat_room_id}`);
  }

  
  async broadcastToMembers(roomId: number, message: ChatMessage, senderId: number): Promise<void> {
    if (!this.server) {
      this.logger.warn('Server not set, cannot broadcast message to members');
      return;
    }

    try {
      const memberIds = await this.chatCacheService.getChatRoomMembers(roomId);
      
      this.logger.log(`Broadcasting message ${message.id} to room ${roomId} members: ${memberIds.join(', ')} (sender: ${senderId})`);
      console.log(`[ChatMessageService] Broadcast message ${message.id} to members: ${memberIds.join(', ')}, sender: ${senderId}`);

      for (const memberId of memberIds) {
        const sockets = await this.chatStateService.getUserSockets(memberId);

        if (sockets.length === 0) {
          this.logger.log(`Member ${memberId} is offline, message ${message.id} will be sent on next connect`);
          continue;
        }

        for (const socketId of sockets) {
          this.server.to(socketId).emit('newMessage', { message });
          this.logger.log(`Sent message ${message.id} to user ${memberId} on socket ${socketId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error broadcasting message to members:`, error);
      this.broadcastToRoom(roomId, message);
    }
  }

  
  async sendToUser(userId: number, event: string, data: any): Promise<void> {
    if (!this.server) {
      this.logger.warn('Server not set, cannot send to user');
      return;
    }

    const sockets = await this.chatStateService.getUserSockets(userId);

    if (sockets.length === 0) {
      this.logger.log(`User ${userId} is offline, cannot send ${event}`);
      return;
    }

    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, data);
    }

    this.logger.log(`Sent ${event} to user ${userId} on ${sockets.length} socket(s)`);
  }

  
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
      this.server.to(roomKey).except(excludeSocketId).emit(event, data);
    } else {
      this.server.to(roomKey).emit(event, data);
    }

    this.logger.log(`Notified room ${roomId} about ${event} (excluding ${excludeSocketId || 'none'})`);
  }

  
  getUnreadCount(_userId: number, _roomId: number): number {
    return 0;
  }

  
  async sendUnreadCountUpdate(userId: number, roomId: number, count: number): Promise<void> {
    await this.sendToUser(userId, 'unreadCountUpdate', {
      roomId,
      count,
    });
  }
}

