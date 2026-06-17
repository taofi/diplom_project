import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { PaymentStatus } from '../../db/models/payment.model';

export class CreatePaymentDto {
  @IsNumber({}, { message: 'Order ID must be a number' })
  @IsNotEmpty({ message: 'Order ID is required' })
  orderId: number;

  @IsString({ message: 'Payment method must be a string' })
  @IsNotEmpty({ message: 'Payment method is required' })
  paymentMethod: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @IsNotEmpty({ message: 'Amount is required' })
  amount: number;

  @IsString({ message: 'Transaction ID must be a string' })
  @IsOptional()
  transactionId?: string;

  @IsEnum(PaymentStatus, { message: 'Invalid payment status' })
  @IsOptional()
  status?: PaymentStatus;

  @IsString({ message: 'Provider must be a string' })
  @IsOptional()
  provider?: string;

  @IsString({ message: 'Provider payment ID must be a string' })
  @IsOptional()
  providerPaymentId?: string;

  @IsString({ message: 'Bank name must be a string' })
  @IsOptional()
  bankName?: string;

  @IsString({ message: 'Card number must be a string' })
  @IsOptional()
  cardNumber?: string;

  @IsString({ message: 'Cardholder name must be a string' })
  @IsOptional()
  cardholderName?: string;

  @IsString({ message: 'Card expiry must be a string' })
  @IsOptional()
  cardExpiry?: string;

  @IsString({ message: 'Billing address must be a string' })
  @IsOptional()
  billingAddress?: string;
}


