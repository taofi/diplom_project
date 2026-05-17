import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Order, OrderStatus } from '../db/models/order.model';
import { OrderItem } from '../db/models/order-item.model';
import { Payment } from '../db/models/payment.model';
import { ProductLicense } from '../db/models/product-license.model';
import { UserProduct } from '../db/models/user-product.model';
import { User } from '../db/models/user.model';
import { CartService } from '../cart/cart.service';
import { OrderService, OrderResponse } from '../order/order.service';
import { EmailService } from '../email/email.service';
import { StripeService } from '../payment/stripe/stripe.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CartItemResponse } from '../cart/cart.service';

export interface CheckoutSessionData {
  id: string;
  url: string | null;
  metadata: Record<string, string> | null;
  amount_total: number | null;
}

function isCheckoutSession(
  obj: unknown,
): obj is CheckoutSessionData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as Record<string, unknown>).id === 'string'
  );
}

export interface CheckoutResponse {
  order: OrderResponse;
  success: boolean;
}

/**
 * Ответ при создании Stripe Checkout Session (Phase 1)
 */
export interface CheckoutSessionResponse {
  url: string;
  orderId: number;
}

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @InjectModel(Order)
    private readonly orderModel: typeof Order,
    @InjectModel(OrderItem)
    private readonly orderItemModel: typeof OrderItem,
    @InjectModel(Payment)
    private readonly paymentModel: typeof Payment,
    @InjectModel(ProductLicense)
    private readonly productLicenseModel: typeof ProductLicense,
    @InjectModel(UserProduct)
    private readonly userProductModel: typeof UserProduct,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly emailService: EmailService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) { }

  private get sequelize() {
    return this.orderModel.sequelize!;
  }

/**
    * Phase 1: Создать Checkout Session для авторизованного пользователя.
    * Создаёт заказ (PENDING) и Stripe Checkout Session, но НЕ финализирует заказ.
    * Очистка корзины, создание UserProducts и email — только после webhook.
    */


  async createCheckoutByUserId(
    userId: number,
    dto: CreateCheckoutDto,
    locale?: string,
  ): Promise<CheckoutSessionResponse> {
    this.logger.log(`[DEBUG] createCheckoutByUserId START, userId=${userId}, locale=${locale}`);
    
    const cartItems = await this.cartService.getCart(userId, locale);
    this.logger.log(`[DEBUG] Got ${cartItems.length} cart items`);

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 1. Убедитесь, что createOrderOnly возвращает типизированный объект (например, Order)
    const order = await this.createOrderOnly(
      cartItems,
      { userId, guestEmail: null },
      dto,
    );
    this.logger.log(`[DEBUG] Created order ${order.id}`);

    const stripeLineItems = this.buildStripeLineItems(cartItems);
    this.logger.log(`[DEBUG] Built ${stripeLineItems.length} Stripe line items`);

    const successUrl =
      this.configService.get<string>('STRIPE_CHECKOUT_SUCCESS_URL') ||
      'http://localhost:4200/checkout/success';
    const cancelUrl =
      this.configService.get<string>('STRIPE_CHECKOUT_CANCEL_URL') ||
      'http://localhost:4200/checkout/cancel';

    // 2. Явно типизируем результат. 
    // Если stripeService.createCheckoutSession возвращает 'any', 
    // это исправит "Unsafe assignment"
    const session = (await this.stripeService.createCheckoutSession({
      orderId: order.id,
      lineItems: stripeLineItems,
      successUrl,
      cancelUrl,
      metadata: { orderId: String(order.id) },
    })); // Принудительное приведение, если сервис не дотипизирован

    this.logger.log(`[DEBUG] Stripe session created: ${session.id}, url: ${session.url?.substring(0, 50)}...`);

    // 3. Используем id напрямую, если order типизирован корректно.
    // Если линтер ругается на order.id, добавьте проверку или приведение типа:
    const orderId = order.id;

    await this.orderModel.update(
      { stripe_session_id: session.id },
      { where: { id: orderId } },
    );

    this.logger.log(
      `Created checkout session ${session.id} for order ${orderId} (user ${userId})`,
    );

    return {
      url: session.url ?? '',
      orderId: orderId,
    };
  }

/**
    * Phase 1: Создать Checkout Session для гостя.
    * Аналогично createCheckoutByUserId, но с guestEmail.
    */
  async createCheckoutByGuestId(
    guestId: string,
    dto: CreateCheckoutDto,
    locale?: string,
  ): Promise<CheckoutSessionResponse> {
    this.logger.log(`[DEBUG] createCheckoutByGuestId START, guestId=${guestId}, locale=${locale}`);
    
    if (!dto.guestEmail) {
      throw new BadRequestException('Email is required for guest checkout');
    }

    // Получаем гостевую корзину
    const cartItems = await this.cartService.getFormattedGuestCart(guestId, locale);
    this.logger.log(`[DEBUG] Got ${cartItems.length} guest cart items`);

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Создаём заказ (PENDING) и OrderItems
    const order = await this.createOrderOnly(
      cartItems,
      { userId: null, guestEmail: dto.guestEmail },
      dto,
    );
    this.logger.log(`[DEBUG] Created order ${order.id} for guest`);

    // Формируем line_items для Stripe из корзины
    const stripeLineItems = this.buildStripeLineItems(cartItems);

    const successUrl =
      this.configService.get<string>('STRIPE_CHECKOUT_SUCCESS_URL') ||
      'http://localhost:4200/checkout/success';
    const cancelUrl =
      this.configService.get<string>('STRIPE_CHECKOUT_CANCEL_URL') ||
      'http://localhost:4200/checkout/cancel';

    // Создаём Stripe Checkout Session с email гостя
    const session = await this.stripeService.createCheckoutSession({
      orderId: order.id,
      lineItems: stripeLineItems,
      successUrl,
      cancelUrl,
      metadata: { orderId: order.id.toString() },
      customerEmail: dto.guestEmail,
    });

    await this.orderModel.update(
      { stripe_session_id: session.id },
      { where: { id: order.id } },
    );

    this.logger.log(
      `Created checkout session ${session.id} for order ${order.id} (guest ${dto.guestEmail})`,
    );

    return {
      url: session.url ?? '',
      orderId: order.id,
    };
  }

/**
     * Phase 2: Финализация заказа после подтверждения оплаты через Stripe webhook.
    * Создаёт UserProducts, очищает корзину, отправляет email.
    */
  async finalizeOrder(orderId: number): Promise<void> {
    this.logger.log(`[DEBUG] finalizeOrder START for order ${orderId}`);
    
    const transaction = await this.sequelize.transaction();

    try {
      this.logger.log(`[DEBUG] Loading order ${orderId} with items`);
      
      // Загружаем заказ с OrderItems
      const order = await this.orderModel.findByPk(orderId, {
        include: [{ model: this.orderItemModel }],
        transaction,
      });

      if (!order) {
        await transaction.rollback();
        this.logger.error(`[DEBUG] Order ${orderId} not found for finalization`);
        throw new NotFoundException(`Order ${orderId} not found for finalization`);
      }

      this.logger.log(`[DEBUG] Order found: user_id=${order.user_id}, guest_email=${order.guest_email}, status=${order.status}`);

      // Проверяем, что заказ ещё не финализирован (защита от повторного вызова)
      if (order.status !== OrderStatus.PENDING) {
        this.logger.warn(
          `Order ${orderId} is not PENDING (status: ${order.status}), skipping finalization`,
        );
        await transaction.rollback();
        return;
      }

      // Получаем все order_items для заказа
      const orderItems = this.getOrderItems(order);
      this.logger.log(`[DEBUG] Found ${orderItems.length} order items`);

      // Создаём UserProducts (только для авторизованных пользователей)
      if (order.user_id) {
        this.logger.log(`[DEBUG] Creating UserProducts for user ${order.user_id}`);
        for (const item of orderItems) {
          this.logger.log(`[DEBUG] Processing order item: product_license_id=${item.product_license_id}, quantity=${item.quantity}`);
          
          const productLicense = await this.productLicenseModel.findByPk(
            item.product_license_id,
            { transaction },
          );

          if (productLicense) {
            this.logger.log(`[DEBUG] ProductLicense found: id=${productLicense.id}, price=${productLicense.price}`);
            
            const existingUserProduct = await this.userProductModel.findOne({
              where: {
                user_id: order.user_id,
                product_license_id: productLicense.id,
              },
              transaction,
            });

            if (existingUserProduct) {
              // Увеличиваем количество
              const newCount =
                (existingUserProduct.count || 1) + (item.quantity || 1);
              await existingUserProduct.update(
                { count: newCount, order_id: orderId },
                { transaction },
              );
              this.logger.log(`[DEBUG] Updated existing UserProduct, new count: ${newCount}`);
            } else {
              await this.userProductModel.create(
                {
                  user_id: order.user_id,
                  product_license_id: productLicense.id,
                  order_id: orderId,
                  purchased_at: new Date(),
                  count: item.quantity || 1,
                },
                { transaction },
              );
              this.logger.log(`[DEBUG] Created new UserProduct for product_license_id=${productLicense.id}`);
            }
          } else {
            this.logger.warn(`[DEBUG] ProductLicense NOT found for id=${item.product_license_id}`);
          }
        }
      } else {
        this.logger.log(`[DEBUG] Guest order - skipping UserProducts creation`);
      }

      // Очищаем корзину
      if (order.user_id) {
        this.logger.log(`[DEBUG] Clearing cart for user ${order.user_id}`);
        await this.cartService.clearCart(order.user_id);
        this.logger.log(`[DEBUG] Cart cleared successfully`);
      } else {
        this.logger.log(`[DEBUG] Guest order - cart clearing not needed (guest cart ID is: ${order.guest_email || 'none'})`);
      }

      // Обновляем статус заказа на PAID
      this.logger.log(`[DEBUG] Updating order status to PAID`);
      await order.update({ status: OrderStatus.PAID }, { transaction });
      this.logger.log(`[DEBUG] Order status updated to PAID`);

      await transaction.commit();
      this.logger.log(`[DEBUG] Transaction committed`);

      // Отправляем email с файлами (вне транзакции, не блокируем)
      await this.sendOrderConfirmationEmail(
        orderId,
        order.user_id || null,
        order.guest_email || null,
        'ru',
      );

      this.logger.log(`Order ${orderId} finalized successfully`);
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // Игнорируем ошибку rollback
      }
      this.logger.error(`Failed to finalize order ${orderId}:`, error);
      throw error;
    }
  }

  private getOrderItems(order: Order): OrderItem[] {
    return order.order_items || [];
  }

  async handleStripeWebhook(
    payload: Buffer,
    sigHeader: string,
  ): Promise<void> {
    this.logger.log(`[DEBUG] handleStripeWebhook START, sigHeader exists: ${!!sigHeader}`);
    
    const event = this.stripeService.handleWebhook(payload, sigHeader);
    this.logger.log(`[DEBUG] Webhook event type: ${event.type}`);
    this.logger.log(`[DEBUG] Event object keys: ${Object.keys(event.data?.object || {}).join(', ')}`);

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      const session = event.data.object;
      this.logger.log(`[DEBUG] Processing session, isCheckoutSession: ${isCheckoutSession(session)}`);
      
      if (isCheckoutSession(session)) {
        this.logger.log(`[DEBUG] Session metadata: ${JSON.stringify(session.metadata)}`);
        
        if (event.type === 'checkout.session.async_payment_failed') {
          await this.handleCheckoutSessionFailed(session);
        } else {
          await this.handleCheckoutSessionCompleted(session);
        }
      } else {
        this.logger.warn(`[DEBUG] Session validation failed, object keys: ${Object.keys(session || {}).join(', ')}`);
      }
    } else {
      this.logger.log(`Unhandled Stripe event type: ${event.type}`);
    }
  }

/**
     * Обработка успешного Checkout Session
     */
  private async handleCheckoutSessionCompleted(
    session: CheckoutSessionData,
  ): Promise<void> {
    this.logger.log(`[DEBUG] handleCheckoutSessionCompleted START, session.id=${session.id}`);
    this.logger.log(`[DEBUG] session.metadata=${JSON.stringify(session.metadata)}`);
    this.logger.log(`[DEBUG] session.amount_total=${session.amount_total}`);
    
    const orderId = session.metadata?.orderId
      ? parseInt(session.metadata.orderId, 10)
      : NaN;

    if (!orderId || isNaN(orderId)) {
      this.logger.error(
        `[DEBUG] Invalid orderId in checkout session metadata: ${session.metadata?.orderId}`,
      );
      return;
    }

    this.logger.log(
      `Checkout session completed for order ${orderId}, session: ${session.id}`,
    );

    await this.finalizePayment(orderId, session.id, session.amount_total ?? undefined);
    this.logger.log(`[DEBUG] finalizePayment completed for order ${orderId}`);

    await this.finalizeOrder(orderId);
    this.logger.log(`[DEBUG] finalizeOrder completed for order ${orderId}`);
  }

  private async handleCheckoutSessionFailed(
    session: CheckoutSessionData,
  ): Promise<void> {
    this.logger.log(`[DEBUG] handleCheckoutSessionFailed START, session.id=${session.id}`);
    
    const orderId = session.metadata?.orderId
      ? parseInt(session.metadata.orderId, 10)
      : NaN;

    if (!orderId || isNaN(orderId)) {
      this.logger.error(
        `[DEBUG] Invalid orderId in failed checkout session metadata`,
      );
      return;
    }

    this.logger.log(
      `Checkout session failed for order ${orderId}, session: ${session.id}`,
    );

    const order = await this.orderModel.findByPk(orderId);
    if (order) {
      this.logger.log(`[DEBUG] Found order ${orderId}, status=${order.status}`);
      if (order.status === OrderStatus.PENDING) {
        await order.update({ status: OrderStatus.CANCELLED });
        this.logger.log(`[DEBUG] Order ${orderId} marked as CANCELLED`);
      } else {
        this.logger.log(`[DEBUG] Order ${orderId} not PENDING, skipping cancellation`);
      }
    } else {
      this.logger.error(`[DEBUG] Order ${orderId} not found`);
    }
  }

/**
    * Создать или обновить запись Payment
    */
  private async finalizePayment(
    orderId: number,
    sessionId: string,
    amountTotal?: number,
  ): Promise<void> {
    this.logger.log(`[DEBUG] finalizePayment START for order ${orderId}, sessionId=${sessionId}`);
    
    const paymentModel = this.orderModel.sequelize!.model('Payment');

    const existingPayment = await paymentModel.findOne({
      where: { order_id: orderId },
    });

    this.logger.log(`[DEBUG] Existing payment: ${existingPayment ? 'found' : 'not found'}`);

    const amount = amountTotal ? amountTotal / 100 : 0;

    if (existingPayment) {
      await existingPayment.update({
        provider_payment_id: sessionId,
        amount,
        status: 'success',
      });
      this.logger.log(`[DEBUG] Updated existing payment`);
    }

    // Если Payment не найдена — это нормально для guest checkout,
    // PaymentService.createPayment может быть вызван отдельно
  }

/**
    * Создать Order и OrderItems (Phase 1 — без UserProducts, очистки корзины, email)
    */
  private async createOrderOnly(
    cartItems: CartItemResponse[],
    userContext: { userId: number | null; guestEmail: string | null },
    dto: CreateCheckoutDto,
  ): Promise<OrderResponse> {
    this.logger.log(`[DEBUG] createOrderOnly START, userId=${userContext.userId}, guestEmail=${userContext.guestEmail}, cartItems count=${cartItems.length}`);
    
    // Рассчитываем общую сумму с учётом quantity
    const totalAmount = cartItems.reduce((sum, item) => {
      const quantity = item.quantity || 1;
      return sum + Number(item.product?.price || 0) * quantity;
    }, 0);

    // Создаём заказ в транзакции
    const transaction = await this.sequelize.transaction();

    try {
      // Создаём заказ
      const newOrder = await this.orderModel.create(
        {
          user_id: userContext.userId,
          guest_email: userContext.guestEmail,
          total_amount: totalAmount,
          discount_amount: 0,
          status: OrderStatus.PENDING,
          promo_code_id: dto.promoCodeId || null,
        },
        { transaction },
      );

      this.logger.log(`[DEBUG] Created order ${newOrder.id}, totalAmount=${totalAmount}`);

      // Создаём элементы заказа
      for (const item of cartItems) {
        this.logger.log(`[DEBUG] Processing cart item: productId=${item.productId}, licenseTypeId=${item.licenseTypeId}, quantity=${item.quantity}`);
        
        const productLicense = await this.productLicenseModel.findOne({
          where: {
            product_id: item.productId,
            license_type_id: item.licenseTypeId,
          },
          transaction,
        });

        if (productLicense) {
          const quantity = item.quantity || 1;
          await this.orderItemModel.create(
            {
              order_id: newOrder.id,
              product_license_id: productLicense.id,
              price_at_purchase: Number(productLicense.price),
              quantity,
            },
            { transaction },
          );
          this.logger.log(`[DEBUG] Created order item for product_license_id=${productLicense.id}`);
        } else {
          this.logger.warn(`[DEBUG] ProductLicense NOT found for productId=${item.productId}, licenseTypeId=${item.licenseTypeId}`);
        }
      }

      await transaction.commit();
      this.logger.log(`[DEBUG] Transaction committed for order ${newOrder.id}`);

      // Загружаем заказ с элементами
      return await this.orderService.getOrderById(newOrder.id);
    } catch (error) {
      // rollback вызывается только если транзакция ещё не зафиксирована
      try {
        await transaction.rollback();
      } catch {
        // Игнорируем ошибку rollback — транзакция уже могла быть зафиксирована
      }
      this.logger.error(`[DEBUG] Error in createOrderOnly:`, error);
      throw error;
    }
  }

  /**
   * Формирование line_items для Stripe Checkout из корзины
   */
  private buildStripeLineItems(
    cartItems: CartItemResponse[],
  ): Array<{
    price_data: {
      currency: string;
      product_data: { name: string };
      unit_amount: number;
    };
    quantity: number;
  }> {
    return cartItems.map((item) => ({
      price_data: {
        currency: 'byn',
        product_data: {
          name: item.product.name,
        },
        unit_amount: Math.round(Number(item.product.price) * 100),
      },
      quantity: item.quantity || 1,
    }));
  }

  /**
   * Отправить email с подтверждением заказа и файлами
   */
  private async sendOrderConfirmationEmail(
    orderId: number,
    userId: number | null,
    guestEmail: string | null,
    locale: string,
  ): Promise<void> {
    try {
      // Определяем email получателя
      let email: string;

      if (userId) {
        const user = await this.userModel.findByPk(userId);
        if (!user) {
          this.logger.warn(
            `[DEBUG] User not found for order ${orderId}, userId: ${userId}`,
          );
          return;
        }
        if (!user.email) {
          this.logger.warn(
            `[DEBUG] User email is empty for order ${orderId}, userId: ${userId}`,
          );
          return;
        }
        email = user.email;
      } else if (guestEmail) {
        email = guestEmail;
      } else {
        this.logger.warn(
          `[DEBUG] No email provided for order ${orderId}`,
        );
        return;
      }

      // Отправляем email с файлами в фоне
      this.emailService.sendOrderConfirmationWithFiles(
        email,
        orderId,
        locale,
      );
      this.logger.log(
        `Order confirmation email sending in background for order ${orderId} to ${email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order confirmation email for order ${orderId}:`,
        error,
      );
    }
  }
}