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
import { ChatAttachmentKind } from '../db/models/chat-message-attachment.model';
import { ChatStateService } from './services/chat-state.service';
import { ChatMessageService } from './services/chat-message.service';
import { ChatNotificationService } from './services/chat-notification.service';
import { ChatCacheService } from './services/chat-cache.service';

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
    private readonly chatCacheService: ChatCacheService,
  ) {}

   
  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
    
    this.chatMessageService.setServer(server);
    this.chatNotificationService.setServer(server);
  }

  handleConnection(client: Socket) {
    try {
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

       
      (client.data as { userId: number; username: string }).userId = payload.sub;
       
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
    
    if (userId) {
      this.chatStateService.onUserDisconnect(userId, client.id);
    }
  }

  @SubscribeMessage('initChat')
  async handleInitChat(client: Socket, payload: { sellerId: number; productId?: number; userProductId?: number }) {
    console.log(`[ChatGateway] initChat: sellerId=${payload.sellerId}, productId=${payload.productId}, userProductId=${payload.userProductId}, clientId=${client.id}`);
     
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    const chat = await this.chatService.createPendingChat(
      userId,
      payload.sellerId,
      payload.productId,
      payload.userProductId,
    );

    return { chatId: chat.id };
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, payload: { roomId: number }) {
    console.log(`[ChatGateway] joinRoom: roomId=${payload.roomId}, clientId=${client.id}`);
     
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    client.join(`chat:${payload.roomId}`);
    
    await this.chatStateService.setUserActiveRoom(userId, client.id, payload.roomId);
    
    await this.chatStateService.addUserToRoomActiveList(userId, payload.roomId);
    
    await this.chatService.markMessagesAsRead(payload.roomId, userId);

    return { success: true };
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client: Socket, payload: { roomId: number }) {
    console.log(`[ChatGateway] leaveRoom: roomId=${payload.roomId}, clientId=${client.id}`);
     
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    client.leave(`chat:${payload.roomId}`);

    await this.chatStateService.clearUserActiveRoom(userId, client.id);
    
    const isRoomEmpty = await this.chatStateService.removeUserFromRoomActiveList(userId, payload.roomId);
    
    if (isRoomEmpty) {
      await this.chatCacheService.invalidateChatRoomCache(payload.roomId);
      console.log(`[ChatGateway] Room ${payload.roomId} is now empty, cache invalidated`);
    }

    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: Socket,
    payload: {
      roomId: number;
      content: string;
      type?: string;
      attachments?: Array<{
        kind: ChatAttachmentKind;
        url: string;
        originalName: string;
        mimeType: string;
        size: number;
      }>;
    },
  ) {
    console.log(`[ChatGateway] sendMessage: roomId=${payload.roomId}, type=${payload.type}, content="${payload.content?.substring(0, 50)}"`);
     
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    const result = await this.chatMessageService.sendMessage({
      roomId: payload.roomId,
      senderId: userId,
      content: payload.content,
      type: (payload.type as MessageType) || MessageType.TEXT,
      attachments: payload.attachments || [],
    });

    if (!result.success) {
      return { error: result.error || 'Failed to send message' };
    }

    return { success: true, message: result.message };
  }

  
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
     
    const userId = (client.data as { userId: number }).userId;
    if (!userId) {
      return;
    }

    client.to(`chat:${payload.roomId}`).emit('userTyping', {
      roomId: payload.roomId,
      userId,
      isTyping: payload.isTyping,
    });
  }

  notifyUser(userId: number, event: string, data: unknown) {
    this.server.emit(event, data);
  }

  
  notifyOfferCreated(offer: unknown) {
    const chatRoomId = (offer as { chat_room_id?: number })?.chat_room_id;
    console.log(`[ChatGateway] notifyOfferCreated: chatRoomId=${chatRoomId}`);
    if (chatRoomId) {
      console.log(`[ChatGateway] Emitting offer:created to room chat:${chatRoomId}`);
      this.server.to(`chat:${chatRoomId}`).emit('offer:created', { offer: this.serializeOffer(offer) });
    }
  }

  
  notifyStatusChanged(offer: unknown) {
    const chatRoomId = (offer as { chat_room_id?: number })?.chat_room_id;
    console.log(`[ChatGateway] notifyStatusChanged: chatRoomId=${chatRoomId}`);
    if (chatRoomId) {
      this.server.to(`chat:${chatRoomId}`).emit('offer:statusChanged', { offer: this.serializeOffer(offer) });
    }
  }

  
  notifyPriceChanged(offer: unknown) {
    const chatRoomId = (offer as { chat_room_id?: number })?.chat_room_id;
    if (chatRoomId) {
      this.server.to(`chat:${chatRoomId}`).emit('offer:priceChanged', { offer: this.serializeOffer(offer) });
    }
  }

  
  notifyFilesUploaded(offer: unknown) {
    const chatRoomId = (offer as { chat_room_id?: number })?.chat_room_id;
    if (chatRoomId) {
      this.server.to(`chat:${chatRoomId}`).emit('offer:filesUploaded', { offer: this.serializeOffer(offer) });
    }
  }

  
  notifyPaymentCompleted(offer: unknown) {
    const chatRoomId = (offer as { chat_room_id?: number })?.chat_room_id;
    if (chatRoomId) {
      this.server.to(`chat:${chatRoomId}`).emit('offer:paid', { offer: this.serializeOffer(offer) });
    }
  }

  
  private serializeOffer(offer: unknown) {
    const o = offer as {
      id?: number;
      chat_room_id?: number;
      creator_id?: number;
      author_id?: number;
      description?: string;
      price?: number;
      original_price?: number | null;
      status?: string;
      preview_url?: string | null;
      source_files_urls?: string | string[] | null;
      creator_attachments_urls?: string | string[] | null;
      author_images_urls?: string | string[] | null;
      author_file_url?: string | null;
      is_paid?: boolean;
      paid_at?: Date | null;
      created_at?: Date;
      updated_at?: Date;
    };

    const parseArray = (value?: string | string[] | null): string[] | null => {
      if (!value) {
        return null;
      }
      if (Array.isArray(value)) {
        return value;
      }
      try {
        return JSON.parse(value) as string[];
      } catch {
        return null;
      }
    };
    const isPaidCompleted = o?.status === 'completed' && !!o?.is_paid;
    return {
      id: o?.id,
      chat_room_id: o?.chat_room_id,
      creator_id: o?.creator_id,
      author_id: o?.author_id,
      description: o?.description,
      price: o?.price,
      original_price: o?.original_price,
      status: o?.status,
      preview_url: o?.preview_url,
      source_files_urls: isPaidCompleted ? parseArray(o?.source_files_urls) : null,
      creator_attachments_urls: parseArray(o?.creator_attachments_urls),
      author_images_urls: parseArray(o?.author_images_urls),
      author_file_url: isPaidCompleted ? (o?.author_file_url ?? null) : null,
      is_paid: o?.is_paid,
      paid_at: o?.paid_at,
      created_at: o?.created_at,
      updated_at: o?.updated_at,
    };
  }
}


