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
import { OfferCreatorFilesInterceptor, OfferFilesInterceptor } from './interceptors/offer-files.interceptor';
import { OfferService } from './services/offer.service';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOfferDto, CounterOfferDto } from './dto/offer.dto';
import { Offer } from '../db/models/offer.model';

@Controller('chat/offers')
@UseGuards(JwtAuthGuard)
export class ChatOffersController {
  constructor(
    private readonly offerService: OfferService,
  ) {}

  
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

  
  @Get(':id')
  async getOffer(@Param('id') id: string): Promise<Offer> {
    return await this.offerService.getOfferById(parseInt(id, 10));
  }

  
  @Post(':id/accept')
  @HttpCode(HttpStatus.CREATED)
  async acceptOffer(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ): Promise<Offer> {
    return this.offerService.acceptOffer(parseInt(id, 10), userId);
  }

  
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectOffer(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ): Promise<Offer> {
    return this.offerService.rejectOffer(parseInt(id, 10), userId);
  }

  
  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  async declineOffer(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ): Promise<Offer> {
    return this.offerService.declineOffer(parseInt(id, 10), userId);
  }

  
  @Post(':id/counter')
  @HttpCode(HttpStatus.OK)
  async counterOffer(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Body() dto: CounterOfferDto,
  ): Promise<Offer> {
    return this.offerService.counterOffer(parseInt(id, 10), userId, dto);
  }

  
  @Post(':id/counter-from-creator')
  @HttpCode(HttpStatus.OK)
  async counterOfferFromCreator(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Body() dto: CounterOfferDto,
  ): Promise<Offer> {
    return this.offerService.counterOfferFromCreator(parseInt(id, 10), userId, dto);
  }

  
  @Post(':id/confirm-price')
  @HttpCode(HttpStatus.OK)
  async confirmPrice(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ): Promise<Offer> {
    return this.offerService.confirmPrice(parseInt(id, 10), userId);
  }

  
  @Post(':id/files')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(OfferFilesInterceptor)
  async uploadFiles(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Offer> {
    const { images, file } = req.offerFiles || {};
    return this.offerService.uploadFiles(
      parseInt(id, 10),
      userId,
      images || [],
      file,
    );
  }

  
  @Post(':id/creator-files')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(OfferCreatorFilesInterceptor)
  async uploadCreatorFiles(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Offer> {
    const { images, files } = req.offerFiles || {};
    return this.offerService.uploadCreatorFiles(
      parseInt(id, 10),
      userId,
      images || [],
      files || [],
    );
  }

  
  @Get(':id/files')
  async getFiles(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ) {
    return this.offerService.getOfferFiles(parseInt(id, 10), userId);
  }

  
  @Get('rooms/:roomId/offers')
  async getRoomOffers(@Param('roomId') roomId: string): Promise<Offer[]> {
    return await this.offerService.getRoomOffers(parseInt(roomId, 10));
  }

  
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
    const safeFilename = encodeURIComponent(fileInfo.filename);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

  res.setHeader(
    'Content-Disposition', 
    `attachment; filename="${fileInfo.filename}"; filename*=UTF-8''${safeFilename}`
  );

  res.setHeader('Content-Type', fileInfo.mimeType || 'application/octet-stream');
    return fileInfo.streamableFile;
  }
}


