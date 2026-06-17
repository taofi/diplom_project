import {
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { OrderStatus } from '../../db/models/order.model';

export class CreateOrderDto {
  @IsNumber({}, { message: 'User ID must be a number' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: number;

  @IsNumber({}, { message: 'Total price must be a number' })
  @IsNotEmpty({ message: 'Total price is required' })
  totalPrice: number;

  @IsNumber({}, { message: 'Discount must be a number' })
  @IsOptional()
  discount?: number;

  @IsString({ message: 'Promo code must be a string' })
  @IsOptional()
  promoCode?: string;

  @IsString({ message: 'Payment method must be a string' })
  @IsNotEmpty({ message: 'Payment method is required' })
  paymentMethod: string;

  @IsString({ message: 'Shipping address must be a string' })
  @IsNotEmpty({ message: 'Shipping address is required' })
  shippingAddress: string;

  @IsString({ message: 'Billing address must be a string' })
  @IsOptional()
  billingAddress?: string;

  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  @IsOptional()
  status?: OrderStatus;

  @IsArray({ message: 'Order items must be an array' })
  @IsNotEmpty({ message: 'Order items are required' })
  items: Array<{
    productId: number;
    licenseTypeId: number;
    quantity: number;
    price: number;
    discountPrice?: number;
  }>;

  @IsString({ message: 'Customer notes must be a string' })
  @IsOptional()
  customerNotes?: string;
}


