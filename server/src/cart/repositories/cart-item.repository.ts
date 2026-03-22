import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CartItem } from '../../db/models/cart-item.model';
import { FindOptions, FindAndCountOptions } from 'sequelize';
import { AddCartItemDto } from '../dto/add-cart-item.dto';

interface CartItemQuery {
  page?: number;
  limit?: number;
  userId?: number;
}

@Injectable()
export class CartItemRepository {
  constructor(
    @InjectModel(CartItem)
    private readonly cartItemModel: typeof CartItem,
  ) {}

  async findAll(options?: FindOptions): Promise<CartItem[]> {
    return this.cartItemModel.findAll(options);
  }

  async findById(id: number, options?: FindOptions): Promise<CartItem | null> {
    return this.cartItemModel.findByPk(id, options);
  }

  async findByUserId(
    userId: number,
    options?: FindOptions,
  ): Promise<CartItem[]> {
    return this.cartItemModel.findAll({
      where: { user_id: userId },
      ...options,
    });
  }

  async findByUserAndProduct(
    userId: number,
    productLicenseId: number,
    options?: FindOptions,
  ): Promise<CartItem | null> {
    return this.cartItemModel.findOne({
      where: { user_id: userId, product_license_id: productLicenseId },
      ...options,
    });
  }

  async findAndCountAll(
    query: CartItemQuery = {},
  ): Promise<{ rows: CartItem[]; count: number }> {
    const { page = 1, limit = 10, userId } = query;
    const offset = (page - 1) * limit;

    const where: Partial<CartItem> = {};

    if (userId) {
      where.user_id = userId;
    }

    const options: FindAndCountOptions = {
      where,
      offset,
      limit,
      order: [['created_at', 'DESC']],
    };

    return this.cartItemModel.findAndCountAll(options);
  }

  async create(data: { user_id: number; product_license_id: number; quantity: number }): Promise<CartItem> {
    return this.cartItemModel.create(data);
  }

  async update(id: number, data: Partial<AddCartItemDto>): Promise<CartItem> {
    const cartItem = await this.findById(id);
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return cartItem.update(data as any);
  }

  async delete(id: number): Promise<void> {
    const cartItem = await this.findById(id);
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await cartItem.destroy();
  }

  async deleteByUserId(userId: number): Promise<void> {
    await this.cartItemModel.destroy({
      where: { user_id: userId },
    });
  }
}
