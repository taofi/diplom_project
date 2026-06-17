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

