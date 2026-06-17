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

interface GuestCartItem {
  id: number;
  productLicenseId: number;
  createdAt: Date;
}

interface GuestCart {
  guestId: string;
  items: GuestCartItem[];
}

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


  
  async getGuestCart(guestId: string): Promise<GuestCartItem[]> {
    const cart = guestCarts.get(guestId);
    if (!cart) {
      return [];
    }
    return cart.items;
  }

  
  async getFormattedGuestCart(guestId: string, locale?: string): Promise<CartItemResponse[]> {
    const cart = guestCarts.get(guestId);
    if (!cart || cart.items.length === 0) {
      return [];
    }

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
        console.error('Failed to load product for guest cart item:', error);
      }
    }

    return formattedItems;
  }

  
  private async formatCartItemFromLicense(
    productLicense: ProductLicense & { product?: Product },
    locale?: string,
  ): Promise<CartItemResponse> {
    const product = productLicense.product;

    let productName = '';
    let licenseTypeName = '';
    let coverImage: string | null = null;

    if (product) {
      const productTranslation = await this.translationService.getProductTranslation(
        product.id,
        locale,
      );
      if (productTranslation) {
        productName = productTranslation.name;
      } else {
        productName = `Product #${product.id}`;
      }

      coverImage = await this.translationService.getProductCoverImage(product.id);
      
      if (!coverImage && product.main_image) {
        coverImage = product.main_image;
      }
    }

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
      id: 0,
      productId: product?.id || 0,
      licenseTypeId: productLicense.license_type_id || 0,
      quantity: 1,
      product: {
        id: product?.id || 0,
        name: productName,
        price: productLicense.price || 0,
        slug: `product-${product?.id}`,
        coverImage,
      },
      licenseType: {
        id: productLicense.license_type_id || 0,
        name: licenseTypeName,
      },
    };
  }

  
  async addGuestItem(guestId: string, dto: AddCartItemDto): Promise<GuestCartItem> {
    const productLicense = await this.productLicenseModel.findOne({
      where: {
        product_id: dto.productId,
        license_type_id: dto.licenseTypeId,
      },
    });

    if (!productLicense) {
      throw new NotFoundException('Product with this license not found');
    }

    let cart = guestCarts.get(guestId);
    if (!cart) {
      cart = { guestId, items: [] };
      guestCarts.set(guestId, cart);
    }

    const existingItem = cart.items.find(
      (item) => item.productLicenseId === productLicense.id,
    );

    if (existingItem) {
      return existingItem;
    }

    const newItem: GuestCartItem = {
      id: guestItemIdCounter++,
      productLicenseId: productLicense.id,
      createdAt: new Date(),
    };
    cart.items.push(newItem);
    return newItem;
  }

  
  async addFormattedGuestItem(
    guestId: string,
    dto: AddCartItemDto,
    locale?: string,
  ): Promise<CartItemResponse> {
    const item = await this.addGuestItem(guestId, dto);
    
    const productLicense = await this.getProductLicense(item.productLicenseId);
    if (!productLicense) {
      throw new NotFoundException('Product not found');
    }

    const formattedItem = await this.formatCartItemFromLicense(productLicense, locale);
    formattedItem.id = item.id;
    return formattedItem;
  }

  
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

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.id !== itemId);
      throw new NotFoundException('Cart item removed');
    }

    const productLicense = await this.getProductLicense(item.productLicenseId);
    if (!productLicense) {
      throw new NotFoundException('Product not found');
    }

    const formattedItem = await this.formatCartItemFromLicense(productLicense, locale);
    formattedItem.id = item.id;
    return formattedItem;
  }

  
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

  
  async clearGuestCart(guestId: string): Promise<void> {
    guestCarts.delete(guestId);
  }

  
  async getGuestCartCount(guestId: string): Promise<number> {
    const cart = guestCarts.get(guestId);
    if (!cart) {
      return 0;
    }
    return cart.items.length;
  }

  
  async syncCart(
    userId: number,
    guestItems: Array<{ productLicenseId: number }>,
    locale?: string,
  ): Promise<CartItemResponse[]> {
    for (const guestItem of guestItems) {
      const existingItem = await this.cartItemRepository.findByUserAndProduct(
        userId,
        guestItem.productLicenseId,
      );

      if (!existingItem) {
        await this.cartItemRepository.create({
          user_id: userId,
          product_license_id: guestItem.productLicenseId,
          quantity: 1,
        });
      }
    }

    return this.getCart(userId, locale);
  }

  
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

  
  async addItem(userId: number, dto: AddCartItemDto, locale?: string): Promise<CartItemResponse> {
    const productLicense = await this.productLicenseModel.findOne({
      where: {
        product_id: dto.productId,
        license_type_id: dto.licenseTypeId,
      },
    });

    if (!productLicense) {
      throw new NotFoundException('Product with this license not found');
    }

    const existingItem = await this.cartItemRepository.findByUserAndProduct(
      userId,
      productLicense.id,
    );

    if (existingItem) {
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

    const cartItem = await this.cartItemRepository.create({
      user_id: userId,
      product_license_id: productLicense.id,
      quantity: dto.quantity || 1,
    });

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

    await cartItem.update({ quantity });
    await cartItem.reload();

    return this.formatCartItem(cartItem, locale);
  }

  
  async removeItem(userId: number, itemId: number): Promise<void> {
    const cartItem = await this.cartItemRepository.findById(itemId);

    if (!cartItem || cartItem.user_id !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.delete(itemId);
  }

  
  async clearCart(userId: number): Promise<void> {
    await this.cartItemRepository.deleteByUserId(userId);
  }

  
  async getCartCount(userId: number): Promise<number> {
    const cartItems = await this.cartItemRepository.findByUserId(userId);
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  
  private async getProductLicense(id: number) {
    return this.productLicenseModel.findByPk(id, {
      include: [{ model: this.productModel }],
    });
  }

  
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

  
  private async formatCartItem(
    cartItem: CartItem,
    locale?: string,
  ): Promise<CartItemResponse> {
    const license = (cartItem as any).product_license;
    const product = license?.product;

    let productName = product?.name || '';
    let licenseTypeName = '';
    let coverImage: string | null = null;

    if (product) {
      const productTranslation = await this.translationService.getProductTranslation(
        product.id,
        locale,
      );
      if (productTranslation) {
        productName = productTranslation.name;
      }

      coverImage = await this.translationService.getProductCoverImage(product.id);
    }

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

  
  private async formatCartItems(cartItems: CartItem[], locale?: string): Promise<CartItemResponse[]> {
    return Promise.all(cartItems.map((item) => this.formatCartItem(item, locale)));
  }
}


