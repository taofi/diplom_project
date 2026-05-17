import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe/stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';

interface RawBodyRequest extends Request {
  rawBody: Buffer;
}

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(
    @CurrentUserId() userId: number,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    const result = await this.paymentService.createPayment(dto.orderId, dto.paymentMethod);
    return {
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: RawBodyRequest) {
    const sigHeader = req.headers['stripe-signature'] as string;

    if (!sigHeader) {
      return { received: false, error: 'Missing stripe-signature header' };
    }

    try {
      await this.paymentService.handlePaymentWebhook(req.rawBody, sigHeader);
      return { received: true };
    } catch (error) {
      return { received: false, error: 'Webhook handling failed' };
    }
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getPaymentByOrderId(
    @CurrentUserId() userId: number,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.paymentService.getPaymentByOrderId(orderId);
  }
}