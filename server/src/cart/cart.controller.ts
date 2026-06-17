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

  
  @Get()
  @UseGuards(JwtAuthGuard)
  async getCart(
    @CurrentUserId() userId: number,
    @Headers('accept-language') locale?: string,
  ) {
    return this.cartService.getCart(userId, locale);
  }

  
  @Post('items')
  @UseGuards(JwtAuthGuard)
  async addItem(
    @CurrentUserId() userId: number,
    @Body() dto: AddCartItemDto,
    @Headers('accept-language') locale?: string,
  ) {
    return this.cartService.addItem(userId, dto, locale);
  }

  
  @Patch('items/:id')
  @UseGuards(JwtAuthGuard)
  async updateItemQuantity(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) itemId: number,
    @Body('quantity') quantity: number,
    @Headers('accept-language') locale?: string,
  ) {
    return this.cartService.updateItemQuantity(userId, itemId, quantity, locale);
  }

  
  @Delete('items/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItem(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) itemId: number,
  ) {
    await this.cartService.removeItem(userId, itemId);
  }

  
  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCart(@CurrentUserId() userId: number) {
    await this.cartService.clearCart(userId);
  }

  
  @Get('count')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getCartCount(@CurrentUserId() userId: number) {
    const count = await this.cartService.getCartCount(userId);
    return { count };
  }


  
  @Get('guest')
  @HttpCode(HttpStatus.OK)
  async getGuestCart(
    @Headers('x-guest-id') guestId: string,
    @Headers('accept-language') locale?: string,
  ) {
    return this.cartService.getFormattedGuestCart(guestId, locale);
  }

  
  @Post('guest/items')
  @HttpCode(HttpStatus.OK)
  async addGuestItem(
    @Headers('x-guest-id') guestId: string,
    @Body() dto: AddCartItemDto,
    @Headers('accept-language') locale?: string,
  ) {
    return this.cartService.addFormattedGuestItem(guestId, dto, locale);
  }

  
  @Patch('guest/items/:id')
  @HttpCode(HttpStatus.OK)
  async updateGuestItemQuantity(
    @Headers('x-guest-id') guestId: string,
    @Param('id', ParseIntPipe) itemId: number,
    @Body('quantity') quantity: number,
    @Headers('accept-language') locale?: string,
  ) {
    return this.cartService.updateGuestItemQuantity(guestId, itemId, quantity, locale);
  }

  
  @Delete('guest/items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeGuestItem(
    @Headers('x-guest-id') guestId: string,
    @Param('id', ParseIntPipe) itemId: number,
  ) {
    await this.cartService.removeGuestItem(guestId, itemId);
  }

  
  @Delete('guest')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearGuestCart(@Headers('x-guest-id') guestId: string) {
    await this.cartService.clearGuestCart(guestId);
  }

  
  @Get('guest/count')
  @HttpCode(HttpStatus.OK)
  async getGuestCartCount(@Headers('x-guest-id') guestId: string) {
    const count = await this.cartService.getGuestCartCount(guestId);
    return { count };
  }

  
  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async syncCart(
    @CurrentUserId() userId: number,
    @Body() dto: SyncCartDto,
    @Headers('accept-language') locale?: string,
  ) {
    return this.cartService.syncCart(
      userId,
      dto.items.map((item) => ({ productLicenseId: item.productLicenseId })),
      locale,
    );
  }
}


