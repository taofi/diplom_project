import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { CheckoutVerificationService } from './checkout-verification.service';
import {
  SendVerificationCodeDto,
  VerifyCodeDto,
  CheckoutVerificationResponseDto,
  CheckoutVerifyResponseDto,
} from './dto/checkout-verification.dto';

@Controller('auth/checkout')
export class CheckoutVerificationController {
  constructor(
    private readonly checkoutVerificationService: CheckoutVerificationService,
  ) {}

  /**
   * Отправить код верификации на email
   * POST /auth/checkout/send-code
   */
  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  async sendVerificationCode(
    @Body() dto: SendVerificationCodeDto,
  ): Promise<CheckoutVerificationResponseDto> {
    return this.checkoutVerificationService.sendVerificationCode(
      dto.email,
      dto.locale || 'ru',
    );
  }

  /**
   * Подтвердить код и создать аккаунт
   * POST /auth/checkout/verify-code
   */
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyCode(
    @Body() dto: VerifyCodeDto,
    @Headers('x-guest-id') guestId: string | undefined,
  ): Promise<CheckoutVerifyResponseDto> {
    return this.checkoutVerificationService.verifyCodeAndCreateAccount(
      dto.email,
      dto.code,
      'ru',
      guestId,
      dto.cart, // Передаём корзину с фронта
    );
  }
}