import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CheckoutService, CheckoutSessionResponse } from './checkout.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

interface RawBodyRequest extends Request {
  rawBody: Buffer;
}

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  /**
   * POST /checkout/session — Создать Stripe Checkout Session (Phase 1)
   * Создаёт заказ (PENDING) и возвращает URL для оплаты через Stripe.
   * Для авторизованных пользователей — JWT автоматически.
   * Для гостей — передаётся x-guest-id и guestEmail в body.
   */
  @Post('session')
  @UseGuards(OptionalJwtAuthGuard)
  async createCheckoutSession(
    @Body() dto: CreateCheckoutDto,
    @CurrentUserId() userId: number | undefined,
    @Headers('x-guest-id') guestId: string | undefined,
    @Headers('accept-language') locale: string = 'ru',
  ): Promise<CheckoutSessionResponse> {
    console.log('[Checkout] userId:', userId, 'guestId:', guestId, 'dto:', dto);

    if (userId) {
      console.log('[Checkout] Creating checkout session for user:', userId);
      return this.checkoutService.createCheckoutByUserId(userId, dto, locale);
    }

    if (guestId) {
      console.log('[Checkout] Creating checkout session for guest:', guestId);
      return this.checkoutService.createCheckoutByGuestId(guestId, dto, locale);
    }

    throw new BadRequestException('User ID or guest ID is required');
  }

  /**
   * POST /checkout/webhook — Приём уведомлений от Stripe (Phase 2)
   * Вызывается Stripe после подтверждения оплаты.
   * Защищён проверкой подписи (StripeService.handleWebhook).
   * Не требует авторизации (JWT) — подпись Stripe является аутентификацией.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') sigHeader: string,
  ) {
    if (!sigHeader) {
      console.warn('[Checkout Webhook] Missing stripe-signature header');
      return { received: false, error: 'Missing stripe-signature header' };
    }

    try {
      await this.checkoutService.handleStripeWebhook(req.rawBody, sigHeader);
      return { received: true };
    } catch (error) {
      console.error('[Checkout Webhook] Error:', error);
      return { received: false, error: 'Webhook handling failed' };
    }
  }
}