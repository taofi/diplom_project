import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddCartItemDto {
  @IsNumber({}, { message: 'Product ID must be a number' })
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: number;

  @IsNumber({}, { message: 'License type ID must be a number' })
  @IsNotEmpty({ message: 'License type ID is required' })
  licenseTypeId: number;
}
