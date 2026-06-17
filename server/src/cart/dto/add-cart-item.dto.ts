import { IsNotEmpty, IsNumber, IsOptional, IsInt, Min } from 'class-validator';

export class AddCartItemDto {
  @IsNumber({}, { message: 'Product ID must be a number' })
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: number;

  @IsNumber({}, { message: 'License type ID must be a number' })
  @IsNotEmpty({ message: 'License type ID is required' })
  licenseTypeId: number;

  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsOptional()
  quantity?: number;
}


