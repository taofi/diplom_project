import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CartItem } from '../db/models/cart-item.model';
import { ProductLicense } from '../db/models/product-license.model';
import { Product } from '../db/models/product.model';
import { CartItemRepository } from './repositories/cart-item.repository';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { Op } from 'sequelize';

export interface CartItemResponse {
  id: number;
  productId: number;
  licenseTypeId: number;
  quantity: number;
  product?: {
    id: number;
    name: string;
    price: number;
    slug: string;
    media?: Array<{ url: string; is_main: boolean }>;
  };
  licenseType?: {
    id: number;
    name: string;
  };
}

// Тип для гостевой корзины в памяти
interface GuestCartItem {
  id: number;
  productLicenseId: number;
  quantity: number;
  createdAt: Date;
}

interface GuestCart {
  guestId: string;
  items: GuestCartItem[];
}

// Глобальное хранилище гостевых корзин (в памяти)
// В production лучше использовать Redis
const guestCarts = new Map<string, GuestCart>();
let guestItemIdCounter = 1;

@Injectable()
export class CartService {
  constructor(
    private readonly cartItemRepository: CartItemRepository,
    @InjectModel(ProductLicense)
    private readonly productLicenseModel: typeof ProductLicense,
    @InjectModel(Product)
    private readonly productModel: typeof Product,
  ) {}

  // ============ Guest Cart Methods ============

  /**
   * Получить гостевую корзину
   */
  async getGuestCart(guestId: string): Promise<GuestCartItem[]> {
    const cart = guestCarts.get(guestId);
    if (!cart) {
      return [];
    }
    return cart.items;
  }

  /**
   * Добавить товар в гостевую корзину
   */
  async addGuestItem(guestId: string, dto: AddCartItemDto): Promise<GuestCartItem> {
    // Проверяем, существует ли товар с таким license
    const productLicense = await this.productLicenseModel.findOne({
      where: {
        product_id: dto.productId,
        license_type_id: dto.licenseTypeId,
      },
    });

    if (!productLicense) {
      throw new NotFoundException('Product with this license not found');
    }

    // Получаем или создаём корзину
    let cart = guestCarts.get(guestId);
    if (!cart) {
      cart = { guestId, items: [] };
      guestCarts.set(guestId, cart);
    }

    // Проверяем, есть ли уже такой товар
    const existingItem = cart.items.find(
      (item) => item.productLicenseId === productLicense.id,
    );

    if (existingItem) {
      existingItem.quantity += dto.quantity;
      return existingItem;
    }

    // Добавляем новый элемент
    const newItem: GuestCartItem = {
      id: guestItemIdCounter++,
      productLicenseId: productLicense.id,
      quantity: dto.quantity,
      createdAt: new Date(),
    };
    cart.items.push(newItem);
    return newItem;
  }

  /**
   * Обновить количество товара в гостевой корзине
   */
  async updateGuestItemQuantity(
    guestId: string,
    itemId: number,
    quantity: number,
  ): Promise<GuestCartItem> {
    const cart = guestCarts.get(guestId);
    if (!cart) {
      throw new NotFoundException('Guest cart not found');
    }

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.id !== itemId);
      throw new NotFoundException('Cart item removed');
    }

    item.quantity = quantity;
    return item;
  }

  /**
   * Удалить товар из гостевой корзины
   */
  async removeGuestItem(guestId: string, itemId: number): Promise<void> {
    const cart = guestCarts.get(guestId);
    if (!cart) {
      throw new NotFoundException('Guest cart not found');
    }

    const itemIndex = cart.items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) {
      throw new NotFoundException('Cart item not found');
    }

    cart.items.splice(itemIndex, 1);
  }

  /**
   * Очистить гостевую корзину
   */
  async clearGuestCart(guestId: string): Promise<void> {
    guestCarts.delete(guestId);
  }

  /**
   * Получить количество товаров в гостевой корзине
   */
  async getGuestCartCount(guestId: string): Promise<number> {
    const cart = guestCarts.get(guestId);
    if (!cart) {
      return 0;
    }
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Синхронизировать гостевую корзину с пользовательской
   */
  async syncCart(
    userId: number,
    guestItems: Array<{ productLicenseId: number; quantity: number }>,
  ): Promise<CartItemResponse[]> {
    // Для каждого элемента гостевой корзины добавляем в пользовательскую
    for (const guestItem of guestItems) {
      // Проверяем, есть ли уже такой товар
      const existingItem = await this.cartItemRepository.findByUserAndProduct(
        userId,
        guestItem.productLicenseId,
      );

      if (existingItem) {
        // Обновляем количество
        await existingItem.update({
          quantity: existingItem.quantity + guestItem.quantity,
        });
      } else {
        // Создаём новый элемент
        await this.cartItemRepository.create({
          user_id: userId,
          product_license_id: guestItem.productLicenseId,
          quantity: guestItem.quantity,
        });
      }
    }

    // Возвращаем обновлённую корзину
    return this.getCart(userId);
  }

  /**
   * Получить корзину пользователя
   */
  async getCart(userId: number): Promise<CartItemResponse[]> {
    const cartItems = await this.cartItemRepository.findByUserId(userId, {
      include: [
        {
          model: this.productLicenseModel,
          include: [
            {
              model: this.productModel,
            },
          ],
        },
      ],
    });

    return this.formatCartItems(cartItems);
  }

  /**
   * Добавить товар в корзину
   */
  async addItem(userId: number, dto: AddCartItemDto): Promise<CartItemResponse> {
    // Проверяем, существует ли товар с таким license
    const productLicense = await this.productLicenseModel.findOne({
      where: {
        product_id: dto.productId,
        license_type_id: dto.licenseTypeId,
      },
    });

    if (!productLicense) {
      throw new NotFoundException('Product with this license not found');
    }

    // Проверяем, есть ли уже такой товар в корзине
    const existingItem = await this.cartItemRepository.findByUserAndProduct(
      userId,
      productLicense.id,
    );

    if (existingItem) {
      // Обновляем количество
      await existingItem.update({ quantity: existingItem.quantity + dto.quantity });
      await existingItem.reload();
      
      return this.formatCartItem(existingItem, await this.getProductLicense(productLicense.id));
    }

    // Создаем новый элемент корзины
    const cartItem = await this.cartItemRepository.create({
      user_id: userId,
      product_license_id: productLicense.id,
      quantity: dto.quantity,
    });

    // Загружаем с связями для возврата
    const fullItem = await this.cartItemRepository.findById(cartItem.id, {
      include: [
        {
          model: this.productLicenseModel,
          include: [{ model: this.productModel }],
        },
      ],
    });

    if (!fullItem) {
      throw new NotFoundException('Failed to create cart item');
    }

    return this.formatCartItem(fullItem);
  }

  /**
   * Обновить количество товара в корзине
   */
  async updateItemQuantity(
    userId: number,
    itemId: number,
    quantity: number,
  ): Promise<CartItemResponse> {
    const cartItem = await this.cartItemRepository.findById(itemId);

    if (!cartItem || cartItem.user_id !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity <= 0) {
      await this.cartItemRepository.delete(itemId);
      throw new NotFoundException('Cart item removed');
    }

    await cartItem.update({ quantity });
    await cartItem.reload();

    return this.formatCartItem(cartItem, await this.getProductLicense(cartItem.product_license_id));
  }

  /**
   * Удалить товар из корзины
   */
  async removeItem(userId: number, itemId: number): Promise<void> {
    const cartItem = await this.cartItemRepository.findById(itemId);

    if (!cartItem || cartItem.user_id !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.delete(itemId);
  }

  /**
   * Очистить корзину
   */
  async clearCart(userId: number): Promise<void> {
    await this.cartItemRepository.deleteByUserId(userId);
  }

  /**
   * Получить количество товаров в корзине
   */
  async getCartCount(userId: number): Promise<number> {
    const cartItems = await this.cartItemRepository.findByUserId(userId);
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Получить ProductLicense с включенными данными
   */
  private async getProductLicense(id: number) {
    return this.productLicenseModel.findByPk(id, {
      include: [{ model: this.productModel }],
    });
  }

  /**
   * Форматировать элемент корзины
   */
  private formatCartItem(
    cartItem: CartItem,
    productLicense?: ProductLicense | null,
  ): CartItemResponse {
    const license = productLicense || (cartItem as any).product_license;
    const product = license?.product;

    return {
      id: cartItem.id,
      productId: product?.id || 0,
      licenseTypeId: license?.license_type_id || 0,
      quantity: cartItem.quantity,
      product: product
        ? {
            id: product.id,
            name: product.name,
            price: license?.price || 0,
            slug: product.slug,
            media: [],
          }
        : undefined,
      licenseType: license
        ? {
            id: license.license_type_id,
            name: '', // TODO: получить из license type
          }
        : undefined,
    };
  }

  /**
   * Форматировать массив элементов корзины
   */
  private formatCartItems(cartItems: CartItem[]): CartItemResponse[] {
    return cartItems.map((item) => this.formatCartItem(item));
  }
}
