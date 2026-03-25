import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { OfferFilesInterceptor } from './interceptors/offer-files.interceptor';
import { OfferService } from './services/offer.service';
import { FileService } from '../common/services/file.service';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOfferDto, CounterOfferDto, PayOrderDto } from './dto/offer.dto';
import { Offer } from '../db/models/offer.model';

@Controller('chat/offers')
@UseGuards(JwtAuthGuard)
export class ChatOffersController {
  constructor(
    private readonly offerService: OfferService,
    private readonly fileService: FileService,
  ) {}

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
    console.log(`[ChatOffersController] POST /chat/offers called`);
    console.log(`[ChatOffersController] userId: ${userId}, dto:`, dto);
    
    const result = await this.offerService.createOffer(userId, dto);
    
    console.log(`[ChatOffersController] createOffer completed, result:`, result);
    return result;
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
   * POST /chat/offers/:id/decline
   * Отклонить предложение (с логикой сброса цены)
   */
  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  async declineOffer(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ): Promise<Offer> {
    return this.offerService.declineOffer(parseInt(id, 10), userId);
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
   * POST /chat/offers/:id/counter-from-creator
   * Изменить цену (Заказчик)
   */
  @Post(':id/counter-from-creator')
  @HttpCode(HttpStatus.OK)
  async counterOfferFromCreator(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Body() dto: CounterOfferDto,
  ): Promise<Offer> {
    return this.offerService.counterOfferFromCreator(parseInt(id, 10), userId, dto);
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
  @UseInterceptors(OfferFilesInterceptor)
  async uploadFiles(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Offer> {
    console.log(`[ChatOffersController] POST /chat/offers/:id/files called`);
    console.log(`[ChatOffersController] offerId: ${id}, userId: ${userId}`);
    console.log(`[ChatOffersController] req.offerFiles:`, req.offerFiles);
    
    const { preview, files } = req.offerFiles || {};
    console.log(`[ChatOffersController] preview:`, preview);
    console.log(`[ChatOffersController] files:`, files);
    
    return this.offerService.uploadFiles(
      parseInt(id, 10),
      userId,
      preview,
      files || [],
    );
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

  /**
   * GET /chat/offers/:id/download/:fileIndex
   * Скачать исходный файл заказа
   */
  @Get(':id/download/:fileIndex')
  async downloadSourceFile(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Param('fileIndex') fileIndex: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const offerId = parseInt(id, 10);
    const fileIdx = parseInt(fileIndex, 10);

    const fileInfo = await this.offerService.downloadSourceFileAsStream(
      offerId,
      fileIdx,
      userId,
    );

    // Устанавливаем заголовки для скачивания
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);
    res.setHeader('Content-Type', fileInfo.mimeType || 'application/octet-stream');

    return fileInfo.streamableFile;
  }
}
