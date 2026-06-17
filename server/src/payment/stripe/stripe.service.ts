import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(order: {
    id: number;
    total_amount: number;
    user_id?: number;
    guest_email?: string;
  }): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(order.total_amount * 100),
        currency: 'byn',
        metadata: {
          orderId: order.id.toString(),
          userId: order.user_id?.toString() || 'guest',
          guestEmail: order.guest_email || '',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(`Created payment intent ${paymentIntent.id} for order ${order.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create payment intent for order ${order.id}:`, error);
      throw error;
    }
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      this.logger.log(`Confirmed payment intent ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to confirm payment intent ${paymentIntentId}:`, error);
      throw error;
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent ${paymentIntentId}:`, error);
      throw error;
    }
  }

  
  async createCheckoutSession(params: {
    orderId: number;
    lineItems: Array<{
      price_data: {
        currency: string;
        product_data: {
          name: string;
          metadata?: Record<string, string>;
        };
        unit_amount: number;
      };
      quantity: number;
    }>;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
    customerEmail?: string;
  }): Promise<Stripe.Checkout.Session> {
    try {
      const sessionCreateParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: params.lineItems,
        mode: 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
      };

      if (params.customerEmail) {
        sessionCreateParams.customer_email = params.customerEmail;
      }

      const session = await this.stripe.checkout.sessions.create(sessionCreateParams);

      this.logger.log(
        `Created checkout session ${session.id} for order ${params.orderId}`,
      );
      return session;
    } catch (error) {
      this.logger.error(
        `Failed to create checkout session for order ${params.orderId}:`,
        error,
      );
      throw error;
    }
  }

   async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
     try {
       return await this.stripe.checkout.sessions.retrieve(sessionId);
     } catch (error: unknown) {
       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
       this.logger.error(
         `Failed to retrieve checkout session ${sessionId}: ${errorMessage}`,
         error instanceof Error ? error.stack : undefined,
       );
       throw error;
     }
   }

   
handleWebhook(payload: Buffer, sigHeader: string): Stripe.Event {
    this.logger.log(`[DEBUG] handleWebhook START, payload type: ${typeof payload}, isBuffer: ${Buffer.isBuffer(payload)}, length: ${payload?.length}`);
    
    if (!Buffer.isBuffer(payload)) {
      this.logger.error(`[DEBUG] Payload is not a Buffer! Type: ${typeof payload}`);
      throw new Error(`Payload must be a Buffer, got ${typeof payload}`);
    }
    
    this.logger.log(`[DEBUG] sigHeader: ${sigHeader?.substring(0, 50)}...`);

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    this.logger.log(`[DEBUG] webhookSecret exists: ${!!webhookSecret}`);

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, sigHeader, webhookSecret);
      this.logger.log(`[DEBUG] constructEvent SUCCESS, event type: ${event.type}`);
    } catch (error) {
      this.logger.error('Webhook signature verification failed:', error);
      throw error;
    }

    this.logger.log(`Received webhook event: ${event.type}`);
    return event;
  }
}

