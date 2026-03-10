import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { OrderStatus } from '../../db/models/order.model';

export class UpdateOrderDto {
  @IsString({ message: 'Order number must be a string' })
  @IsOptional()
  orderNumber?: string;

  @IsNumber({}, { message: 'Total amount must be a number' })
  @IsOptional()
  totalAmount?: number;

  @IsString({ message: 'Payment method must be a string' })
  @IsOptional()
  paymentMethod?: string;

  @IsString({ message: 'Payment status must be a string' })
  @IsOptional()
  paymentStatus?: string;

  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  @IsOptional()
  status?: OrderStatus;

  @IsString({ message: 'Shipping address must be a string' })
  @IsOptional()
  shippingAddress?: string;

  @IsString({ message: 'Billing address must be a string' })
  @IsOptional()
  billingAddress?: string;

  @IsString({ message: 'Tracking number must be a string' })
  @IsOptional()
  trackingNumber?: string;

  @IsString({ message: 'Notes must be a string' })
  @IsOptional()
  notes?: string;
}
