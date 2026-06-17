import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Headers,
  NotFoundException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserProductService } from './user-product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { UserProductResponse } from './dto/user-product.dto';
import { normalizeLanguage } from '../translation/utils/language.utils';

@Controller('user/products')
@UseGuards(JwtAuthGuard)
export class UserProductController {
  constructor(private readonly userProductService: UserProductService) {}

  
  @Get()
  async getMyProducts(
    @CurrentUserId() userId: number,
    @Headers('accept-language') locale?: string,
  ): Promise<UserProductResponse[]> {
    const normalizedLocale = normalizeLanguage(locale);
    console.log('[DEBUG user-products] userId:', userId);
    console.log('[DEBUG user-products] accept-language header:', locale);
    console.log('[DEBUG user-products] normalizedLocale:', normalizedLocale);
    return this.userProductService.getUserProducts(userId, normalizedLocale);
  }

  
  @Get(':id/download')
  async downloadProduct(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) userProductId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const fileInfo = await this.userProductService.getFileInfo(userId, userProductId);
    if (!fileInfo) {
      throw new NotFoundException('Product not found or not purchased');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);
    res.setHeader('Content-Type', fileInfo.mimeType || 'application/octet-stream');
    
    return this.userProductService.downloadProduct(userId, userProductId);
  }

  }


