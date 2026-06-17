import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order, OrderStatus } from '../../db/models/order.model';
import { FindOptions, FindAndCountOptions } from 'sequelize';
import { Op } from 'sequelize';
import { CreateOrderDto } from '../dto/create-order.dto';

interface OrderQuery {
  page?: number;
  limit?: number;
  userId?: number;
  status?: OrderStatus;
  search?: string;
}

type OrderWhereOptions = FindOptions['where'] & {
  user_id?: number;
  status?: OrderStatus;
  [Op.or]?: Array<{
    id?: { [Op.iLike]: string };
    orderNumber?: { [Op.iLike]: string };
  }>;
};

@Injectable()
export class OrderRepository {
  constructor(
    @InjectModel(Order)
    private readonly orderModel: typeof Order,
  ) {}

  async findAll(options?: FindOptions): Promise<Order[]> {
    return this.orderModel.findAll(options);
  }

  async findById(id: number, options?: FindOptions): Promise<Order | null> {
    return this.orderModel.findByPk(id, options);
  }

  async findByUserId(userId: number, options?: FindOptions): Promise<Order[]> {
    return this.orderModel.findAll({
      where: { user_id: userId },
      ...options,
    });
  }

  async findAndCountAll(
    query: OrderQuery = {},
  ): Promise<{ rows: Order[]; count: number }> {
    const { page = 1, limit = 10, userId, status, search } = query;
    const offset = (page - 1) * limit;

    const where: OrderWhereOptions = {};

    if (userId) {
      where.user_id = userId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { id: { [Op.iLike]: `%${search}%` } },
        { orderNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const options: FindAndCountOptions = {
      where,
      offset,
      limit,
      order: [['created_at', 'DESC']],
    };

    return this.orderModel.findAndCountAll(options);
  }

  async create(data: CreateOrderDto): Promise<Order> {
    return this.orderModel.create(data as any);
  }

  async update(id: number, data: Partial<CreateOrderDto>): Promise<Order> {
    const order = await this.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order.update(data as any);
  }

  async delete(id: number): Promise<void> {
    const order = await this.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await order.destroy();
  }
}


