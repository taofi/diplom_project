import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order, OrderStatus } from '../db/models/order.model';
import { OrderItem } from '../db/models/order-item.model';
import { ProductLicense } from '../db/models/product-license.model';
import { UserProduct } from '../db/models/user-product.model';
import { User } from '../db/models/user.model';
import { CartService } from '../cart/cart.service';
import { OrderService, OrderResponse } from '../order/order.service';
import { EmailService } from '../email/email.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CartItemResponse } from '../cart/cart.service';

export interface CheckoutResponse {
  order: OrderResponse;
  success: boolean;
}

@Injectable()
export class CheckoutService {
  constructor(
    @InjectModel(Order)
    private readonly orderModel: typeof Order,
    @InjectModel(OrderItem)
    private readonly orderItemModel: typeof OrderItem,
    @InjectModel(ProductLicense)
    private readonly productLicenseModel: typeof ProductLicense,
    @InjectModel(UserProduct)
    private readonly userProductModel: typeof UserProduct,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly emailService: EmailService,
  ) {}

  private get sequelize() {
    return this.orderModel.sequelize!;
  }

  /**
   * Создать заказ из корзины (для авторизованных пользователей)
   */
  async checkoutByUserId(
    userId: number,
    dto: CreateCheckoutDto,
    locale?: string,
  ): Promise<CheckoutResponse> {
    // Получаем корзину пользователя
    const cartItems = await this.cartService.getCart(userId, locale);

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Создаём заказ
    const order = await this.createOrder(
      cartItems,
      { userId, guestEmail: null },
      dto,
    );

    // Очищаем корзину пользователя
    await this.cartService.clearCart(userId);

    // Отправляем email с файлами заказа
    await this.sendOrderConfirmationEmail(order.id, userId, null, locale || 'ru');

    return {
      order,
      success: true,
    };
  }

  /**
   * Создать заказ из гостевой корзины
   */
  async checkoutByGuestId(
    guestId: string,
    dto: CreateCheckoutDto,
    locale?: string,
  ): Promise<CheckoutResponse> {
    if (!dto.guestEmail) {
      throw new BadRequestException('Email is required for guest checkout');
    }

    // Получаем гостевую корзину
    const cartItems = await this.cartService.getFormattedGuestCart(guestId, locale);

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Создаём заказ
    const order = await this.createOrder(
      cartItems,
      { userId: null, guestEmail: dto.guestEmail },
      dto,
    );

    // Очищаем гостевую корзину
    await this.cartService.clearGuestCart(guestId);

    // Отправляем email с файлами заказа
    await this.sendOrderConfirmationEmail(order.id, null, dto.guestEmail, locale || 'ru');

    return {
      order,
      success: true,
    };
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
        // Для авторизованного пользователя получаем email из базы
        const user = await this.userModel.findByPk(userId);
        if (!user) {
          console.warn(`User not found for order ${orderId}`);
          return;
        }
        email = user.email;
      } else if (guestEmail) {
        email = guestEmail;
      } else {
        console.warn(`No email provided for order ${orderId}`);
        return;
      }

      // Отправляем email с файлами в фоне
      this.emailService.sendOrderConfirmationWithFiles(email, orderId, locale);
      console.log(`Order confirmation email sending in background for order ${orderId} to ${email}`);
    } catch (error) {
      // Логируем ошибку, но не блокируем успешный checkout
      console.error(`Failed to send order confirmation email for order ${orderId}:`, error);
    }
  }

  /**
   * Общая логика создания заказа
   */
  private async createOrder(
    cartItems: CartItemResponse[],
    userContext: { userId: number | null; guestEmail: string | null },
    dto: CreateCheckoutDto,
  ): Promise<OrderResponse> {
    // Рассчитываем общую сумму (приводим к числу)
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + Number(item.product?.price || 0);
    }, 0);

    // Создаём заказ в транзакции
    const transaction = await this.sequelize.transaction();

    try {
      // Создаём заказ
      const newOrder = await this.orderModel.create({
        user_id: userContext.userId,
        guest_email: userContext.guestEmail,
        total_amount: totalAmount,
        discount_amount: 0,
        status: OrderStatus.PENDING,
        promo_code_id: dto.promoCodeId || null,
      }, { transaction });

      // Создаём элементы заказа
      for (const item of cartItems) {
        const productLicense = await this.productLicenseModel.findOne({
          where: {
            product_id: item.productId,
            license_type_id: item.licenseTypeId,
          },
        });

        if (productLicense) {
          await this.orderItemModel.create({
            order_id: newOrder.id,
            product_license_id: productLicense.id,
            price_at_purchase: Number(productLicense.price),
          }, { transaction });

          // Создаём UserProduct для авторизованного пользователя
          if (userContext.userId) {
            await this.userProductModel.create({
              user_id: userContext.userId,
              product_license_id: productLicense.id,
              order_id: newOrder.id,
              purchased_at: new Date(),
            }, { transaction });
          }
        }
      }

      await transaction.commit();

      // Загружаем заказ с элементами
      return await this.orderService.getOrderById(newOrder.id);
    } catch (error) {
      // rollback вызывается только если транзакция ещё не зафиксирована
      try {
        await transaction.rollback();
      } catch {
        // Игнорируем ошибку rollback - транзакция уже могла быть зафиксирована
      }
      throw error;
    }
  }
}
