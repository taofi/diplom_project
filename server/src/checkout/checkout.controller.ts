import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { CheckoutService, CheckoutResponse } from './checkout.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  /**
   * POST /checkout - Оформить заказ
   * Для авторизованных: использует корзину пользователя
   * Для гостей: использует гостевую корзину (передаётся в заголовке x-guest-id)
   */
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async checkout(
    @Body() dto: CreateCheckoutDto,
    @CurrentUserId() userId: number | undefined,
    @Headers('x-guest-id') guestId: string | undefined,
    @Headers('accept-language') locale: string = 'ru',
  ): Promise<CheckoutResponse> {
    console.log('[Checkout] userId:', userId, 'guestId:', guestId, 'dto:', dto);
    
    // Авторизованный пользователь
    if (userId) {
      console.log('[Checkout] Using checkoutByUserId for user:', userId);
      return this.checkoutService.checkoutByUserId(userId, dto, locale);
    }

    // Гость
    if (guestId) {
      return this.checkoutService.checkoutByGuestId(guestId, dto, locale);
    }

    // Ни userId, ни guestId
    throw new BadRequestException('User ID or guest ID is required');
  }
}
