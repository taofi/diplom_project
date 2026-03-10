import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { DiscountType } from '../../db/models/promo-code.model';

export class CreatePromoCodeDto {
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code is required' })
  code: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: 'Discount value must be a number' })
  @IsNotEmpty({ message: 'Discount value is required' })
  discountValue: number;

  @IsEnum(DiscountType, { message: 'Invalid discount type' })
  @IsNotEmpty({ message: 'Discount type is required' })
  discountType: DiscountType;

  @IsNumber({}, { message: 'Min order value must be a number' })
  @IsOptional()
  minOrderValue?: number;

  @IsNumber({}, { message: 'Max discount amount must be a number' })
  @IsOptional()
  maxDiscountAmount?: number;

  @IsNumber({}, { message: 'Usage limit must be a number' })
  @IsOptional()
  usageLimit?: number;

  @IsNumber({}, { message: 'User usage limit must be a number' })
  @IsOptional()
  userUsageLimit?: number;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;

  @IsOptional()
  isActive?: boolean;
}
