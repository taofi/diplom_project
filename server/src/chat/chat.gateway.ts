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

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      client.data.userId = payload.sub;
      client.data.username = payload.username;

      console.log(`Client connected: ${client.id}, userId: ${payload.sub}`);
    } catch (error) {
      console.log('Invalid token, disconnecting client');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('initChat')
  async handleInitChat(client: Socket, payload: { sellerId: number; productId?: number }) {
    const userId = client.data.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    const tempChat = await this.chatService.createTempChat(
      userId,
      payload.sellerId,
      payload.productId,
    );

    return { tempChat };
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, payload: { roomId: number }) {
    const userId = client.data.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    client.join(`chat:${payload.roomId}`);
    
    // Отмечаем сообщения как прочитанные
    await this.chatService.markMessagesAsRead(payload.roomId, userId);

    return { success: true };
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client: Socket, payload: { roomId: number; tempChatId?: string }) {
    const userId = client.data.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    client.leave(`chat:${payload.roomId}`);

    // Если это временный чат и пользователь ушёл без отправки сообщения
    if (payload.tempChatId) {
      await this.chatService.deleteTempChat(payload.tempChatId);
    }

    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: Socket,
    payload: { roomId: number | string; content: string; type?: string; tempChatId?: string },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    try {
      const message = await this.chatService.sendMessage(
        payload.roomId,
        userId,
        payload.content,
        (payload.type as MessageType) || MessageType.TEXT,
      );

      // Получаем roomId для рассылки (если был tempChatId)
      let chatRoomId: number;
      if (typeof payload.roomId === 'string') {
        const tempChat = await this.chatService.getTempChat(payload.roomId);
        // После отправки сообщения чат уже создан, находим его
        const chat = await this.chatService.getOrCreateChat(
          tempChat!.buyerId,
          tempChat!.sellerId,
          tempChat!.productId || undefined,
        );
        chatRoomId = chat.id;
      } else {
        chatRoomId = payload.roomId;
      }

      // Рассылаем сообщение всем в комнате
      this.server.to(`chat:${chatRoomId}`).emit('newMessage', { message });

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, payload: { roomId: number; isTyping: boolean }) {
    const userId = client.data.userId;
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
