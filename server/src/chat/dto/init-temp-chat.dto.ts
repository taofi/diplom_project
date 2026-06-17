import { IsNumber, IsOptional, IsString } from 'class-validator';

export class InitTempChatDto {
  @IsNumber({}, { message: 'Seller ID must be a number' })
  @IsOptional()
  sellerId?: number;

  @IsNumber({}, { message: 'Product ID must be a number' })
  @IsOptional()
  productId?: number;

  @IsNumber({}, { message: 'User Product ID must be a number' })
  @IsOptional()
  userProductId?: number;

  @IsString({ message: 'Language must be a string' })
  @IsOptional()
  lang?: string;
}


