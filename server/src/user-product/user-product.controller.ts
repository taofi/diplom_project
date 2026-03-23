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

@Controller('user/products')
@UseGuards(JwtAuthGuard)
export class UserProductController {
  constructor(private readonly userProductService: UserProductService) {}

  /**
   * Получить список купленных товаров текущего пользователя
   */
  @Get()
  async getMyProducts(
    @CurrentUserId() userId: number,
    @Headers('accept-language') locale?: string,
  ): Promise<UserProductResponse[]> {
    const normalizedLocale = this.normalizeLocale(locale);
    return this.userProductService.getUserProducts(userId, normalizedLocale);
  }

  /**
   * Скачать файл купленного товара
   */
  @Get(':id/download')
  async downloadProduct(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) userProductId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Проверяем, что пользователь приобрёл этот товар
    const fileInfo = await this.userProductService.getFileInfo(userId, userProductId);
    if (!fileInfo) {
      throw new NotFoundException('Product not found or not purchased');
    }

    // Устанавливаем заголовки
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);
    res.setHeader('Content-Type', fileInfo.mimeType || 'application/octet-stream');
    
    // Получаем StreamableFile
    return this.userProductService.downloadProduct(userId, userProductId);
  }

  private normalizeLocale(locale?: string): string {
    if (!locale) return 'en';
    // Извлекаем первый язык из заголовка (например, "en-US" -> "en")
    return locale.split(',')[0].split('-')[0];
  }
}
