import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { CustomOrderStatus } from '../../db/models/custom-order.model';

export class CreateCustomOrderDto {
  @IsNumber({}, { message: 'Buyer ID must be a number' })
  @IsNotEmpty({ message: 'Buyer ID is required' })
  buyerId: number;

  @IsNumber({}, { message: 'Seller ID must be a number' })
  @IsOptional()
  sellerId?: number;

  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @IsString({ message: 'Requirements must be a string' })
  @IsOptional()
  requirements?: string;

  @IsNumber({}, { message: 'Budget must be a number' })
  @IsOptional()
  budget?: number;

  @IsNumber({}, { message: 'Duration must be a number' })
  @IsOptional()
  duration?: number;

  @IsEnum(CustomOrderStatus, { message: 'Invalid custom order status' })
  @IsOptional()
  status?: CustomOrderStatus;

  @IsString({ message: 'Files must be a string' })
  @IsOptional()
  files?: string;

  @IsString({ message: 'Notes must be a string' })
  @IsOptional()
  notes?: string;
}
