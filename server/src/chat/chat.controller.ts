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
  Req,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { normalizeLanguage } from '../translation/utils/language.utils';
import { ChatService } from './chat.service';
import { OfferService } from './services/offer.service';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { PayOrderDto } from './dto/offer.dto';
import { ChatAttachmentsInterceptor } from './interceptors/chat-attachments.interceptor';

import { MessageType } from '../db/models/chat-message.model';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly offerService: OfferService,
  ) {}


  
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

  
  @Get('rooms')
  async getUserChatRooms(
    @CurrentUserId() userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Headers('accept-language') locale?: string,
  ) {
    const normalizedLocale = normalizeLanguage(locale);
    return this.chatService.getUserChatRooms(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      normalizedLocale,
    );
  }

  
  @Get('rooms/:id')
  async getChatRoom(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Headers('accept-language') locale?: string,
  ) {
    const normalizedLocale = normalizeLanguage(locale);
    return this.chatService.getChatRoomWithMessages(
      parseInt(id, 10),
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      normalizedLocale,
    );
  }

  
  @Get('rooms/unread')
  async getUnreadCounts(@CurrentUserId() userId: number) {
    const unreadMap = await this.chatService.getAllUnreadCounts(userId);
    return Object.fromEntries(unreadMap);
  }

  
  @Post('rooms/:id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ) {
    await this.chatService.markRoomAsRead(parseInt(id, 10), userId);
    return { success: true };
  }


  
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

  
  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUserId() userId: number,
    @Body() dto: CreateChatMessageDto,
  ) {
    return this.chatService.sendMessage(
      dto.chatRoomId,
      userId,
      dto.content || '',
      dto.type || MessageType.TEXT,
      dto.attachments || [],
    );
  }

  @Post('rooms/:id/attachments')
  @UseInterceptors(ChatAttachmentsInterceptor)
  @HttpCode(HttpStatus.CREATED)
  async uploadAttachments(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.chatService.uploadChatAttachments(
      parseInt(id, 10),
      userId,
      req.chatFiles || [],
    );
  }

  @Get('rooms/:id/offers')
  async getChatOffers(@Param('id') id: string) {
    return this.chatService.getChatOffers(parseInt(id, 10));
  }


  
  @Post('offers/:id/pay')
  async payOffer(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Body() dto: PayOrderDto,
  ) {
    return this.offerService.payOrder(parseInt(id, 10), userId, dto);
  }


  
  @Get('orders')
  async getUserOrders(@CurrentUserId() userId: number) {
    return this.chatService.getUserOrders(userId);
  }

  
  @Get('orders/all')
  async getAllUserOrders(@CurrentUserId() userId: number) {
    return this.chatService.getAllUserOrders(userId);
  }


}




