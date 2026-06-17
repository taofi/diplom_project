import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { DiscountType } from '../../db/models/promo-code.model';

export class UpdatePromoCodeDto {
  @IsString({ message: 'Code must be a string' })
  @IsOptional()
  code?: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @IsEnum(DiscountType, { message: 'Invalid discount type' })
  @IsOptional()
  type?: DiscountType;

  @IsNumber({}, { message: 'Value must be a number' })
  @IsOptional()
  value?: number;

  @IsNumber({}, { message: 'Minimum order value must be a number' })
  @IsOptional()
  minOrderValue?: number;

  @IsNumber({}, { message: 'Usage limit must be a number' })
  @IsOptional()
  usageLimit?: number;

  @IsNumber({}, { message: 'User usage limit must be a number' })
  @IsOptional()
  userUsageLimit?: number;

  @IsBoolean({ message: 'Is active must be a boolean' })
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;
}


