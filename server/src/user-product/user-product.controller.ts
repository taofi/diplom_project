import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Headers,
  StreamableFile,
} from '@nestjs/common';
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
    @Param('id', ParseIntPipe) productId: number,
  ): Promise<StreamableFile> {
    return this.userProductService.downloadProduct(userId, productId);
  }

  private normalizeLocale(locale?: string): string {
    if (!locale) return 'en';
    // Извлекаем первый язык из заголовка (например, "en-US" -> "en")
    return locale.split(',')[0].split('-')[0];
  }
}
