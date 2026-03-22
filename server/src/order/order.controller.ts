import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { OrderService, OrderResponse } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * GET /orders - Получить все заказы пользователя
   */
  @Get()
  async getOrders(@CurrentUserId() userId: number): Promise<OrderResponse[]> {
    return this.orderService.getOrdersByUserId(userId);
  }

  /**
   * GET /orders/:id - Получить конкретный заказ
   */
  @Get(':id')
  async getOrder(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) orderId: number,
  ): Promise<OrderResponse> {
    return this.orderService.getOrderById(orderId);
  }
}
