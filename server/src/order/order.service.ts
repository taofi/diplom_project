import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order, OrderStatus } from '../db/models/order.model';
import { OrderItem } from '../db/models/order-item.model';
import { CartService } from '../cart/cart.service';
import { ProductLicense } from '../db/models/product-license.model';
import { Product } from '../db/models/product.model';
import { ProductTranslation } from '../db/models/product-translation.model';
import { UserProduct } from '../db/models/user-product.model';

export interface CreateOrderFromCartOptions {
  userId: number;
  promoCodeId?: number;
  guestEmail?: string;
}

export interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  licenseTypeId: number;
  licenseTypeName: string;
  price: number;
  quantity: number;
}

export interface OrderResponse {
  id: number;
  userId: number | null;
  guestEmail: string | null;
  totalAmount: number;
  discountAmount: number;
  status: OrderStatus;
  items: OrderItemResponse[];
  createdAt: Date;
}

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order)
    private readonly orderModel: typeof Order,
    @InjectModel(OrderItem)
    private readonly orderItemModel: typeof OrderItem,
    @InjectModel(ProductLicense)
    private readonly productLicenseModel: typeof ProductLicense,
    @InjectModel(UserProduct)
    private readonly userProductModel: typeof UserProduct,
    private readonly cartService: CartService,
  ) {}

  private get sequelize() {
    return this.orderModel.sequelize!;
  }

  /**
   * Создать заказ из корзины
   */
  async createOrderFromCart(options: CreateOrderFromCartOptions): Promise<OrderResponse> {
    const { userId, promoCodeId, guestEmail } = options;

    // Получаем корзину
    const cartItems = await this.cartService.getCart(userId);

    if (cartItems.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    // Рассчитываем общую сумму (учитываем quantity)
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + Number(item.product?.price || 0) * (item.quantity || 1);
    }, 0);

    // Создаём заказ в транзакции
    const transaction = await this.sequelize.transaction();
    
    try {
      // Создаём заказ
      const newOrder = await this.orderModel.create({
        user_id: userId,
        guest_email: guestEmail || null,
        total_amount: totalAmount,
        discount_amount: 0,
        status: OrderStatus.PENDING,
        promo_code_id: promoCodeId || null,
      }, { transaction });

      // Создаём элементы заказа
      for (const item of cartItems) {
        const productLicense = await this.productLicenseModel.findByPk(item.productId);
        
        if (productLicense) {
          await this.orderItemModel.create({
            order_id: newOrder.id,
            product_license_id: productLicense.id,
            price_at_purchase: Number(productLicense.price),
            quantity: item.quantity || 1,
          }, { transaction });
        }
      }

      // Очищаем корзину
      await this.cartService.clearCart(userId);

      await transaction.commit();

      // Загружаем заказ с элементами
      return this.getOrderById(newOrder.id);
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // Игнорируем ошибку rollback - транзакция уже могла быть зафиксирована
      }
      throw error;
    }
  }

  /**
   * Получить заказ по ID
   */
  async getOrderById(orderId: number): Promise<OrderResponse> {
    const order = await this.orderModel.findByPk(orderId, {
      include: [
        {
          model: this.orderItemModel,
          include: [
            {
              model: this.productLicenseModel,
              include: [
                {
                  model: Product,
                  include: [{ model: ProductTranslation }],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrder(order);
  }

  /**
   * Получить все заказы пользователя
   */
  async getOrdersByUserId(userId: number): Promise<OrderResponse[]> {
    const orders = await this.orderModel.findAll({
      where: { user_id: userId },
      include: [
        {
          model: this.orderItemModel,
          include: [
            {
              model: this.productLicenseModel,
              include: [
                {
                  model: Product,
                  include: [{ model: ProductTranslation }],
                },
              ],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return orders.map((order) => this.formatOrder(order));
  }

  /**
   * Обновить статус заказа
   */
  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<OrderResponse> {
    const order = await this.orderModel.findByPk(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await order.update({ status });
    return this.getOrderById(orderId);
  }

  /**
   * Перенести заказы гостя на пользователя по email
   * Используется при верификации email на checkout
   */
  async transferGuestOrdersToUser(userId: number, guestEmail: string): Promise<number> {
    // Находим все заказы с указанным email гостя
    const guestOrders = await this.orderModel.findAll({
      where: {
        guest_email: guestEmail,
        user_id: null, // Только заказы без пользователя
      },
    });

    if (guestOrders.length === 0) {
      return 0;
    }

    // Обновляем user_id для всех найденных заказов
    // Также нужно создать UserProduct для каждого orderItem
    const transaction = await this.sequelize.transaction();

    try {
      for (const order of guestOrders) {
        // Обновляем заказ - привязываем к пользователю
        await order.update({ user_id: userId }, { transaction });

        // Для каждого orderItem создаем UserProduct
        await this.orderItemModel.update(
          { order_id: order.id }, // Это нужно для поиска orderItems
          { where: { order_id: order.id }, transaction }
        );

        // Получаем orderItems и создаем UserProduct
        const orderItems = await this.orderItemModel.findAll({
          where: { order_id: order.id },
        });

        for (const orderItem of orderItems) {
          // Проверяем, не существует ли уже UserProduct
          const existingUserProduct = await this.userProductModel.findOne({
            where: {
              user_id: userId,
              product_license_id: orderItem.product_license_id,
            },
          });

          if (existingUserProduct) {
            // Обновляем существующий UserProduct - увеличиваем count
            const newCount = (existingUserProduct.count || 1) + (orderItem.quantity || 1);
            await existingUserProduct.update({ count: newCount }, { transaction });
          } else {
            // Создаём новый UserProduct с count = quantity
            await this.userProductModel.create({
              user_id: userId,
              product_license_id: orderItem.product_license_id,
              order_id: order.id,
              purchased_at: order.created_at,
              count: orderItem.quantity || 1,
            }, { transaction });
          }
        }
      }

      await transaction.commit();
      return guestOrders.length;
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // Игнорируем ошибку rollback
      }
      throw error;
    }
  }

  /**
   * Форматировать заказ для ответа
   */
  private formatOrder(order: Order & { order_items?: OrderItem[] }): OrderResponse {
    const items: OrderItemResponse[] = (order.order_items || []).map((item) => {
      const license = item.product_license as ProductLicense | null;
      const product = license?.product as Product | null;
      const translation = product?.translations?.[0];

      return {
        id: item.id,
        productId: product?.id || 0,
        productName: translation?.name || '',
        licenseTypeId: license?.license_type_id || 0,
        licenseTypeName: '',
        price: Number(item.price_at_purchase),
        quantity: item.quantity || 1,
      };
    });

    return {
      id: order.id,
      userId: order.user_id,
      guestEmail: order.guest_email,
      totalAmount: Number(order.total_amount),
      discountAmount: Number(order.discount_amount),
      status: order.status,
      items,
      createdAt: order.created_at,
    };
  }
}
