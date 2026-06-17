import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order, OrderStatus } from '../db/models/order.model';
import { Payment, PaymentStatus } from '../db/models/payment.model';
import { StripeService } from './stripe/stripe.service';

interface CheckoutSessionData {
  id: string;
  url: string | null;
  metadata: Record<string, string> | null;
  amount_total: number | null;
}

interface PaymentIntentData {
  id: string;
  metadata: Record<string, string>;
}

function isCheckoutSession(obj: unknown): obj is CheckoutSessionData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as Record<string, unknown>).id === 'string'
  );
}

function isPaymentIntent(obj: unknown): obj is PaymentIntentData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as Record<string, unknown>).id === 'string' &&
    'metadata' in obj
  );
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectModel(Order)
    private readonly orderModel: typeof Order,
    @InjectModel(Payment)
    private readonly paymentModel: typeof Payment,
    private readonly stripeService: StripeService,
  ) {}

  async createPayment(orderId: number, paymentMethod: string): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    const order = await this.orderModel.findByPk(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status !== 'pending') {
      throw new BadRequestException('Order is not in pending status');
    }

    const existingPayment = await this.paymentModel.findOne({
      where: { order_id: orderId },
    });
    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this order');
    }

    const paymentIntent = await this.stripeService.createPaymentIntent({
      id: order.id,
      total_amount: order.total_amount,
      user_id: order.user_id || undefined,
      guest_email: order.guest_email || undefined,
    });

    const payment = await this.paymentModel.create({
      order_id: orderId,
      provider: 'stripe',
      provider_payment_id: paymentIntent.id,
      amount: order.total_amount,
      status: PaymentStatus.PENDING,
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  async getPaymentByOrderId(orderId: number): Promise<Payment> {
    const payment = await this.paymentModel.findOne({
      where: { order_id: orderId },
      include: [{ model: Order }],
    });

    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    return payment;
  }

  async getAllPayments(): Promise<Payment[]> {
    return this.paymentModel.findAll({
      include: [{ model: Order }],
    });
  }

   async handlePaymentWebhook(payload: Buffer, sigHeader: string): Promise<void> {
     const event = this.stripeService.handleWebhook(payload, sigHeader);

     switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        if (isPaymentIntent(paymentIntent)) {
          await this.handlePaymentIntentSucceeded(paymentIntent);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        if (isPaymentIntent(paymentIntent)) {
          await this.handlePaymentIntentFailed(paymentIntent);
        }
        break;
      }
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        if (isPaymentIntent(paymentIntent)) {
          await this.handlePaymentIntentCanceled(paymentIntent);
        }
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (isCheckoutSession(session)) {
          await this.handleCheckoutSessionCompleted(session);
        }
        break;
      }
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        if (isCheckoutSession(session)) {
          await this.handleCheckoutSessionCompleted(session);
        }
        break;
      }
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        if (isCheckoutSession(session)) {
          await this.handleCheckoutSessionFailed(session);
        }
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: PaymentIntentData): Promise<void> {
    const orderId = parseInt(paymentIntent.metadata.orderId, 10);

    const payment = await this.paymentModel.findOne({
      where: { provider_payment_id: paymentIntent.id },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for payment intent ${paymentIntent.id}`);
      return;
    }

    await payment.update({ status: PaymentStatus.SUCCESS });

    const order = payment.order_id != null ? await this.orderModel.findByPk(payment.order_id) : null;
    if (order && order.status !== 'paid') {
      await order.update({ status: 'paid' });
    }

    this.logger.log(`Payment succeeded for order ${orderId}`);
  }

  private async handlePaymentIntentFailed(paymentIntent: PaymentIntentData): Promise<void> {
    const payment = await this.paymentModel.findOne({
      where: { provider_payment_id: paymentIntent.id },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for payment intent ${paymentIntent.id}`);
      return;
    }

    await payment.update({ status: PaymentStatus.FAILED });

    this.logger.log(`Payment failed for order ${payment.order_id}`);
  }

  private async handlePaymentIntentCanceled(paymentIntent: PaymentIntentData): Promise<void> {
    const payment = await this.paymentModel.findOne({
      where: { provider_payment_id: paymentIntent.id },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for payment intent ${paymentIntent.id}`);
      return;
    }

    await payment.update({ status: PaymentStatus.FAILED });

    this.logger.log(`Payment canceled for order ${payment.order_id}`);
  }


  private async handleCheckoutSessionCompleted(session: CheckoutSessionData): Promise<void> {
    const orderId = session.metadata?.orderId
      ? parseInt(session.metadata.orderId, 10)
      : NaN;

    if (!orderId || isNaN(orderId)) {
      this.logger.error(
        `Invalid orderId in checkout session metadata: ${session.metadata?.orderId}`,
      );
      return;
    }

    this.logger.log(
      `Checkout session completed for order ${orderId}, session: ${session.id}`,
    );

    
    const existingPayment = await this.paymentModel.findOne({
      where: { order_id: orderId },
    });

    const amount = session.amount_total ? session.amount_total / 100 : 0;

    if (existingPayment) {
      await existingPayment.update({
        provider_payment_id: session.id,
        amount,
        status: PaymentStatus.SUCCESS,
      });
    } else {
      await this.paymentModel.create({
        order_id: orderId,
        provider: 'stripe',
        provider_payment_id: session.id,
        amount,
        status: PaymentStatus.SUCCESS,
      });
    }

    
    const order = await this.orderModel.findByPk(orderId);
    if (order && order.status === OrderStatus.PENDING) {
      await order.update({ status: OrderStatus.PAID });
      this.logger.log(`Order ${orderId} status updated to PAID in PaymentService`);
    } else {
      this.logger.warn(
        `Order ${orderId} not found or not in PENDING status (status: ${order?.status})`,
      );
    }

    
    
    
    
    
  }

  
  private async handleCheckoutSessionFailed(session: CheckoutSessionData): Promise<void> {
    const orderId = session.metadata?.orderId
      ? parseInt(session.metadata.orderId, 10)
      : NaN;

    if (!orderId || isNaN(orderId)) {
      this.logger.error(`Invalid orderId in failed checkout session metadata`);
      return;
    }

    this.logger.log(
      `Checkout session failed for order ${orderId}, session: ${session.id}`,
    );

    
    const order = await this.orderModel.findByPk(orderId);
    if (order && order.status === OrderStatus.PENDING) {
      await order.update({ status: OrderStatus.CANCELLED });
    }
  }


   async handleCheckoutSessionWebhook(
     payload: Buffer,
     sigHeader: string,
   ): Promise<void> {
     const event = this.stripeService.handleWebhook(payload, sigHeader);
     
     this.logger.log(`[DEBUG] handleCheckoutSessionWebhook event type: ${event.type}`);
   }
}

