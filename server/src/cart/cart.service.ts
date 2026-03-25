import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CartItem } from '../db/models/cart-item.model';
import { ProductLicense } from '../db/models/product-license.model';
import { Product } from '../db/models/product.model';
import { CartItemRepository } from './repositories/cart-item.repository';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { TranslationService } from '../translation/translation.service';

export interface CartItemResponse {
  id: number;
  productId: number;
  licenseTypeId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    slug: string;
    coverImage: string | null;
  };
  licenseType: {
    id: number;
    name: string;
  };
}

// Тип для гостевой корзины в памяти
interface GuestCartItem {
  id: number;
  productLicenseId: number;
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
    private readonly translationService: TranslationService,
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
   * Получить гостевую корзину с форматированными данными (с переводами)
   */
  async getFormattedGuestCart(guestId: string, locale?: string): Promise<CartItemResponse[]> {
    const cart = guestCarts.get(guestId);
    if (!cart || cart.items.length === 0) {
      return [];
    }

    // Загружаем данные о каждом товаре
    const formattedItems: CartItemResponse[] = [];
    
    for (const item of cart.items) {
      try {
        const productLicense = await this.getProductLicense(item.productLicenseId);
        if (productLicense) {
          const formattedItem = await this.formatCartItemFromLicense(productLicense, locale);
          formattedItem.id = item.id;
          formattedItems.push(formattedItem);
        }
      } catch (error) {
        // Пропускаем товары, которые не удалось загрузить
        console.error('Failed to load product for guest cart item:', error);
      }
    }

    return formattedItems;
  }

  /**
   * Форматировать элемент корзины из ProductLicense
   */
  private async formatCartItemFromLicense(
    productLicense: ProductLicense & { product?: Product },
    locale?: string,
  ): Promise<CartItemResponse> {
    const product = productLicense.product;

    // Получаем переводы
    let productName = '';
    let licenseTypeName = '';
    let coverImage: string | null = null;

    if (product) {
      // Получаем перевод продукта
      const productTranslation = await this.translationService.getProductTranslation(
        product.id,
        locale,
      );
      if (productTranslation) {
        productName = productTranslation.name;
      } else {
        // Fallback - используем main_image как имя
        productName = `Product #${product.id}`;
      }

      // Получаем главное изображение (is_cover = true)
      coverImage = await this.translationService.getProductCoverImage(product.id);
      
      // Fallback на main_image если нет обложки
      if (!coverImage && product.main_image) {
        coverImage = product.main_image;
      }
    }

    // Получаем перевод типа лицензии
    if (productLicense.license_type_id) {
      const licenseTranslation = await this.translationService.getLicenseTypeTranslation(
        productLicense.license_type_id,
        locale,
      );
      if (licenseTranslation) {
        licenseTypeName = licenseTranslation.name;
      }
    }

    return {
      id: 0, // Will be set by caller
      productId: product?.id || 0,
      licenseTypeId: productLicense.license_type_id || 0,
      quantity: 1, // Для гостевой корзины quantity всегда 1
      product: {
        id: product?.id || 0,
        name: productName,
        price: productLicense.price || 0,
        slug: `product-${product?.id}`, // Используем ID вместо slug
        coverImage,
      },
      licenseType: {
        id: productLicense.license_type_id || 0,
        name: licenseTypeName,
      },
    };
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

    // Проверяем, есть ли уже такой товар (по правилам плана - не добавляем дубликаты)
    const existingItem = cart.items.find(
      (item) => item.productLicenseId === productLicense.id,
    );

    if (existingItem) {
      // Товар уже есть, возвращаем существующий (не увеличиваем количество)
      return existingItem;
    }

    // Добавляем новый элемент (без quantity - всегда 1)
    const newItem: GuestCartItem = {
      id: guestItemIdCounter++,
      productLicenseId: productLicense.id,
      createdAt: new Date(),
    };
    cart.items.push(newItem);
    return newItem;
  }

  /**
   * Добавить товар в гостевую корзину и вернуть с переводами
   */
  async addFormattedGuestItem(
    guestId: string,
    dto: AddCartItemDto,
    locale?: string,
  ): Promise<CartItemResponse> {
    const item = await this.addGuestItem(guestId, dto);
    
    // Загружаем данные о товаре с переводами
    const productLicense = await this.getProductLicense(item.productLicenseId);
    if (!productLicense) {
      throw new NotFoundException('Product not found');
    }

    const formattedItem = await this.formatCartItemFromLicense(productLicense, locale);
    formattedItem.id = item.id;
    return formattedItem;
  }

  /**
   * Обновить количество товара в гостевой корзине
   * (больше не поддерживается - quantity всегда 1)
   */
  async updateGuestItemQuantity(
    guestId: string,
    itemId: number,
    quantity: number,
    locale?: string,
  ): Promise<CartItemResponse> {
    const cart = guestCarts.get(guestId);
    if (!cart) {
      throw new NotFoundException('Guest cart not found');
    }

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    // Если quantity <= 0, удаляем товар
    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.id !== itemId);
      throw new NotFoundException('Cart item removed');
    }

    // Загружаем данные о товаре с переводами
    const productLicense = await this.getProductLicense(item.productLicenseId);
    if (!productLicense) {
      throw new NotFoundException('Product not found');
    }

    const formattedItem = await this.formatCartItemFromLicense(productLicense, locale);
    formattedItem.id = item.id;
    return formattedItem;
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
    // Всегда 1 на товар
    return cart.items.length;
  }

  /**
   * Синхронизировать гостевую корзину с пользовательской
   */
  async syncCart(
    userId: number,
    guestItems: Array<{ productLicenseId: number }>,
    locale?: string,
  ): Promise<CartItemResponse[]> {
    // Для каждого элемента гостевой корзины добавляем в пользовательскую
    for (const guestItem of guestItems) {
      // Проверяем, есть ли уже такой товар
      const existingItem = await this.cartItemRepository.findByUserAndProduct(
        userId,
        guestItem.productLicenseId,
      );

      if (!existingItem) {
        // Создаём новый элемент (quantity всегда 1)
        await this.cartItemRepository.create({
          user_id: userId,
          product_license_id: guestItem.productLicenseId,
          quantity: 1,
        });
      }
      // Если товар уже есть - не добавляем дубликат
    }

    // Возвращаем обновлённую корзину
    return this.getCart(userId, locale);
  }

  /**
   * Получить корзину пользователя
   */
  async getCart(userId: number, locale?: string): Promise<CartItemResponse[]> {
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

    return this.formatCartItems(cartItems, locale);
  }

  /**
   * Добавить товар в корзину
   */
  async addItem(userId: number, dto: AddCartItemDto, locale?: string): Promise<CartItemResponse> {
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
      // Товар уже есть - увеличиваем количество на quantity из DTO
      const newQuantity = (existingItem.quantity || 1) + (dto.quantity || 1);
      await existingItem.update({ quantity: newQuantity });
      await existingItem.reload();
      
      const fullItem = await this.cartItemRepository.findById(existingItem.id, {
        include: [
          {
            model: this.productLicenseModel,
            include: [{ model: this.productModel }],
          },
        ],
      });
      
      return this.formatCartItem(fullItem!, locale);
    }

    // Создаем новый элемент корзины с quantity из DTO (по умолчанию 1)
    const cartItem = await this.cartItemRepository.create({
      user_id: userId,
      product_license_id: productLicense.id,
      quantity: dto.quantity || 1,
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

    return this.formatCartItem(fullItem, locale);
  }

  /**
   * Обновить количество товара в корзине
   */
  async updateItemQuantity(
    userId: number,
    itemId: number,
    quantity: number,
    locale?: string,
  ): Promise<CartItemResponse> {
    const cartItem = await this.cartItemRepository.findById(itemId);

    if (!cartItem || cartItem.user_id !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity <= 0) {
      await this.cartItemRepository.delete(itemId);
      throw new NotFoundException('Cart item removed');
    }

    // Обновляем количество
    await cartItem.update({ quantity });
    await cartItem.reload();

    return this.formatCartItem(cartItem, locale);
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
    // Сумма всех quantity
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
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
   * Найти product_license_id по productId и licenseTypeId
   * Используется при синхронизации корзины с фронта
   */
  async findProductLicenseId(
    productId: number,
    licenseTypeId: number,
  ): Promise<number | null> {
    const productLicense = await this.productLicenseModel.findOne({
      where: {
        product_id: productId,
        license_type_id: licenseTypeId,
      },
    });
    return productLicense?.id || null;
  }

  /**
   * Форматировать элемент корзины
   */
  private async formatCartItem(
    cartItem: CartItem,
    locale?: string,
  ): Promise<CartItemResponse> {
    const license = (cartItem as any).product_license;
    const product = license?.product;

    // Получаем переводы
    let productName = product?.name || '';
    let licenseTypeName = '';
    let coverImage: string | null = null;

    if (product) {
      // Получаем перевод продукта
      const productTranslation = await this.translationService.getProductTranslation(
        product.id,
        locale,
      );
      if (productTranslation) {
        productName = productTranslation.name;
      }

      // Получаем главное изображение
      coverImage = await this.translationService.getProductCoverImage(product.id);
    }

    // Получаем перевод типа лицензии
    if (license?.license_type_id) {
      const licenseTranslation = await this.translationService.getLicenseTypeTranslation(
        license.license_type_id,
        locale,
      );
      if (licenseTranslation) {
        licenseTypeName = licenseTranslation.name;
      }
    }

    return {
      id: cartItem.id,
      productId: product?.id || 0,
      licenseTypeId: license?.license_type_id || 0,
      quantity: cartItem.quantity || 1,
      product: product
        ? {
            id: product.id,
            name: productName,
            price: license?.price || 0,
            slug: product.slug,
            coverImage,
          }
        : ({} as any),
      licenseType: license
        ? {
            id: license.license_type_id,
            name: licenseTypeName,
          }
        : ({} as any),
    };
  }

  /**
   * Форматировать массив элементов корзины
   */
  private async formatCartItems(cartItems: CartItem[], locale?: string): Promise<CartItemResponse[]> {
    // Используем Promise.all для параллельной загрузки переводов
    return Promise.all(cartItems.map((item) => this.formatCartItem(item, locale)));
  }
}
