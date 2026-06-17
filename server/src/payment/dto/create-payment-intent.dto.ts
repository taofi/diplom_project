import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreatePaymentIntentDto {
  @IsNumber({}, { message: 'Order ID must be a number' })
  @IsNotEmpty({ message: 'Order ID is required' })
  orderId: number;

  @IsString({ message: 'Payment method must be a string' })
  @IsIn(['card'], { message: 'Payment method must be card' })
  paymentMethod: string;

  @IsString({ message: 'Return URL must be a string' })
  @IsOptional()
  returnUrl?: string;
}

