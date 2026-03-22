import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { SyncCartDto } from './dto/guest-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * GET /cart - Получить корзину пользователя
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getCart(@CurrentUserId() userId: number) {
    return this.cartService.getCart(userId);
  }

  /**
   * POST /cart/items - Добавить товар в корзину
   */
  @Post('items')
  @UseGuards(JwtAuthGuard)
  async addItem(
    @CurrentUserId() userId: number,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(userId, dto);
  }

  /**
   * PATCH /cart/items/:id - Изменить количество товара
   */
  @Patch('items/:id')
  @UseGuards(JwtAuthGuard)
  async updateItemQuantity(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) itemId: number,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateItemQuantity(userId, itemId, quantity);
  }

  /**
   * DELETE /cart/items/:id - Удалить товар из корзины
   */
  @Delete('items/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItem(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) itemId: number,
  ) {
    await this.cartService.removeItem(userId, itemId);
  }

  /**
   * DELETE /cart - Очистить корзину
   */
  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCart(@CurrentUserId() userId: number) {
    await this.cartService.clearCart(userId);
  }

  /**
   * GET /cart/count - Получить количество товаров
   */
  @Get('count')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getCartCount(@CurrentUserId() userId: number) {
    const count = await this.cartService.getCartCount(userId);
    return { count };
  }

  // ============ Guest Cart Endpoints ============

  /**
   * GET /cart/guest - Получить гостевую корзину
   */
  @Get('guest')
  @HttpCode(HttpStatus.OK)
  async getGuestCart(@Headers('x-guest-id') guestId: string): Promise<Array<{id: number; productLicenseId: number; quantity: number}>> {
    return this.cartService.getGuestCart(guestId);
  }

  /**
   * POST /cart/guest/items - Добавить товар в гостевую корзину
   */
  @Post('guest/items')
  @HttpCode(HttpStatus.OK)
  async addGuestItem(
    @Headers('x-guest-id') guestId: string,
    @Body() dto: AddCartItemDto,
  ): Promise<{id: number; productLicenseId: number; quantity: number}> {
    return this.cartService.addGuestItem(guestId, dto);
  }

  /**
   * PATCH /cart/guest/items/:id - Изменить количество товара в гостевой корзине
   */
  @Patch('guest/items/:id')
  @HttpCode(HttpStatus.OK)
  async updateGuestItemQuantity(
    @Headers('x-guest-id') guestId: string,
    @Param('id', ParseIntPipe) itemId: number,
    @Body('quantity') quantity: number,
  ): Promise<{id: number; productLicenseId: number; quantity: number}> {
    return this.cartService.updateGuestItemQuantity(guestId, itemId, quantity);
  }

  /**
   * DELETE /cart/guest/items/:id - Удалить товар из гостевой корзины
   */
  @Delete('guest/items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeGuestItem(
    @Headers('x-guest-id') guestId: string,
    @Param('id', ParseIntPipe) itemId: number,
  ) {
    await this.cartService.removeGuestItem(guestId, itemId);
  }

  /**
   * DELETE /cart/guest - Очистить гостевую корзину
   */
  @Delete('guest')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearGuestCart(@Headers('x-guest-id') guestId: string) {
    await this.cartService.clearGuestCart(guestId);
  }

  /**
   * GET /cart/guest/count - Получить количество товаров в гостевой корзине
   */
  @Get('guest/count')
  @HttpCode(HttpStatus.OK)
  async getGuestCartCount(@Headers('x-guest-id') guestId: string) {
    const count = await this.cartService.getGuestCartCount(guestId);
    return { count };
  }

  /**
   * POST /cart/sync - Синхронизировать гостевую корзину с пользовательской
   */
  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async syncCart(
    @CurrentUserId() userId: number,
    @Body() dto: SyncCartDto,
  ) {
    return this.cartService.syncCart(userId, dto.items);
  }
}
