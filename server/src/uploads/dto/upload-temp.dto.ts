import { IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * DTO для подтверждения перемещения файлов продукта
 */
export class ConfirmProductFilesDto {
  @IsNumber({}, { message: 'Product ID must be a number' })
  productId: number;

  @IsString({ message: 'Temp file URL must be a string' })
  @IsOptional()
  tempFileUrl?: string;

  @IsOptional()
  @IsString({ each: true })
  tempMediaUrls?: string[];
}
