import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OfferService } from './services/offer.service';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOfferDto, CounterOfferDto, UploadFilesDto, PayOrderDto } from './dto/offer.dto';
import { Offer } from '../db/models/offer.model';

@Controller('chat/offers')
@UseGuards(JwtAuthGuard)
export class ChatOffersController {
  constructor(private readonly offerService: OfferService) {}

  /**
   * POST /chat/offers
   * Создать заказ (Заказчик)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOffer(
    @CurrentUserId() userId: number,
    @Body() dto: CreateOfferDto,
  ): Promise<Offer> {
    return this.offerService.createOffer(userId, dto);
  }

  /**
   * GET /chat/offers/:id
   * Получить заказ
   */
  @Get(':id')
  async getOffer(@Param('id') id: string): Promise<Offer> {
    return await this.offerService.getOfferById(parseInt(id, 10));
  }

  /**
   * POST /chat/offers/:id/accept
   * Принять заказ (Автор)
   */
  @Post(':id/accept')
  @HttpCode(HttpStatus.CREATED)
  async acceptOffer(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ): Promise<Offer> {
    return this.offerService.acceptOffer(parseInt(id, 10), userId);
  }

  /**
   * POST /chat/offers/:id/reject
   * Отклонить заказ (Любой участник)
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectOffer(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ): Promise<Offer> {
    return this.offerService.rejectOffer(parseInt(id, 10), userId);
  }

  /**
   * POST /chat/offers/:id/counter
   * Изменить цену (Автор)
   */
  @Post(':id/counter')
  @HttpCode(HttpStatus.OK)
  async counterOffer(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Body() dto: CounterOfferDto,
  ): Promise<Offer> {
    return this.offerService.counterOffer(parseInt(id, 10), userId, dto);
  }

  /**
   * POST /chat/offers/:id/confirm-price
   * Подтвердить цену (Заказчик)
   */
  @Post(':id/confirm-price')
  @HttpCode(HttpStatus.OK)
  async confirmPrice(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ): Promise<Offer> {
    return this.offerService.confirmPrice(parseInt(id, 10), userId);
  }

  /**
   * POST /chat/offers/:id/files
   * Загрузить файлы (Автор)
   */
  @Post(':id/files')
  @HttpCode(HttpStatus.CREATED)
  async uploadFiles(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Body() dto: UploadFilesDto,
  ): Promise<Offer> {
    return this.offerService.uploadFiles(parseInt(id, 10), userId, dto);
  }

  /**
   * POST /chat/offers/:id/pay
   * Оплатить заказ (Заказчик)
   */
  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  async payOrder(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Body() dto: PayOrderDto,
  ): Promise<Offer> {
    return this.offerService.payOrder(parseInt(id, 10), userId, dto);
  }

  /**
   * GET /chat/offers/:id/files
   * Получить ссылки на файлы (с проверкой доступа)
   */
  @Get(':id/files')
  async getFiles(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ) {
    return this.offerService.getOfferFiles(parseInt(id, 10), userId);
  }

  /**
   * GET /chat/offers/rooms/:roomId/offers
   * Получить все заказы в чате
   */
  @Get('rooms/:roomId/offers')
  async getRoomOffers(@Param('roomId') roomId: string): Promise<Offer[]> {
    return await this.offerService.getRoomOffers(parseInt(roomId, 10));
  }
}