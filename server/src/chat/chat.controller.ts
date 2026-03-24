import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import {
  CreateOfferDto,
  CreateRevisionDto,
} from './dto/chat-actions.dto';
import { MessageType } from '../db/models/chat-message.model';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ==================== Chat Rooms ====================

  /**
   * POST /chat/rooms
   * Создать чат напрямую в БД (с visibility: PENDING)
   */
  @Post('rooms')
  @HttpCode(HttpStatus.CREATED)
  async createChat(
    @CurrentUserId() userId: number,
    @Body() dto: CreateChatRoomDto,
  ) {
    return this.chatService.createPendingChat(
      userId,
      dto.sellerId,
      dto.productId,
      dto.userProductId,
    );
  }

  /**
   * GET /chat/rooms
   * Получить все видимые чаты пользователя
   */
  @Get('rooms')
  async getUserChatRooms(
    @CurrentUserId() userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getUserChatRooms(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * GET /chat/rooms/:id
   * Получить чат с сообщениями
   */
  @Get('rooms/:id')
  async getChatRoom(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getChatRoomWithMessages(
      parseInt(id, 10),
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // ==================== Messages ====================

  /**
   * GET /chat/rooms/:id/messages
   * Получить сообщения чата
   */
  @Get('rooms/:id/messages')
  async getMessages(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(
      parseInt(id, 10),
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  /**
   * POST /chat/messages
   * Отправить сообщение (REST fallback)
   */
  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUserId() userId: number,
    @Body() dto: CreateChatMessageDto,
  ) {
    return this.chatService.sendMessage(
      dto.chatRoomId,
      userId,
      dto.content,
      dto.type || MessageType.TEXT,
      dto.mediaUrl,
    );
  }

  // ==================== Offers ====================

  /**
   * POST /chat/offers
   * Создать предложение
   */
  @Post('offers')
  @HttpCode(HttpStatus.CREATED)
  async createOffer(
    @CurrentUserId() userId: number,
    @Body() dto: CreateOfferDto,
  ) {
    // Создаём сообщение с типом OFFER
    const message = await this.chatService.sendMessage(
      dto.chatRoomId,
      userId,
      '',
      MessageType.OFFER,
    );

    return this.chatService.createOffer(
      dto.chatRoomId,
      message.id,
      dto.sellerId,
      dto.description,
      dto.price,
      new Date(dto.deadline),
    );
  }

  /**
   * POST /chat/offers/:id/accept
   * Принять предложение
   */
  @Post('offers/:id/accept')
  @HttpCode(HttpStatus.CREATED)
  async acceptOffer(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ) {
    return this.chatService.acceptOffer(parseInt(id, 10), userId);
  }

  /**
   * POST /chat/offers/:id/decline
   * Отклонить предложение
   */
  @Post('offers/:id/decline')
  @HttpCode(HttpStatus.OK)
  async declineOffer(@Param('id') id: string) {
    return this.chatService.declineOffer(parseInt(id, 10));
  }

  /**
   * GET /chat/rooms/:id/offers
   * Получить предложения чата
   */
  @Get('rooms/:id/offers')
  async getChatOffers(@Param('id') id: string) {
    return this.chatService.getChatOffers(parseInt(id, 10));
  }

  // ==================== Custom Orders ====================

  /**
   * GET /custom-orders
   * Получить заказы пользователя
   */
  @Get('orders')
  async getUserOrders(
    @CurrentUserId() userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getUserOrders(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * GET /custom-orders/:id
   * Получить заказ с ревизиями
   */
  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    return this.chatService.getOrderWithRevisions(parseInt(id, 10));
  }

  /**
   * POST /custom-orders/:id/revision
   * Добавить ревизию с файлом
   */
  @Post('orders/:id/revision')
  @HttpCode(HttpStatus.CREATED)
  async addRevision(
    @Param('id') id: string,
    @Body() dto: CreateRevisionDto,
  ) {
    return this.chatService.addRevision(
      parseInt(id, 10),
      dto.fileUrl,
      dto.comment,
    );
  }

  /**
   * POST /custom-orders/:id/approve
   * Одобрить результат
   */
  @Post('orders/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveOrder(@Param('id') id: string) {
    return this.chatService.approveOrder(parseInt(id, 10));
  }

  /**
   * POST /custom-orders/:id/revision-request
   * Запросить доработку
   */
  @Post('orders/:id/revision-request')
  @HttpCode(HttpStatus.OK)
  async requestRevision(@Param('id') id: string) {
    return this.chatService.requestRevision(parseInt(id, 10));
  }
}
