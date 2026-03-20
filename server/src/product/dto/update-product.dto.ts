import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from '../../db/models/product.model';

class TranslationDto {
  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;
}

export class UpdateProductDto {
  // name и description перенесены в массив translations
  // sku удален

  // price убран - вычисляется как MIN(licenses.price)

  @IsNumber({}, { message: 'Discount price must be a number' })
  @IsOptional()
  @Min(0)
  discountPrice?: number;

  @IsString({ message: 'Type must be a string' })
  @IsOptional()
  type?: ProductType;

  @IsString({ message: 'File URL must be a string' })
  @IsOptional()
  fileUrl?: string;

  @IsNumber({}, { message: 'Stock must be a number' })
  @IsOptional()
  @Min(0)
  stock?: number;

  @IsBoolean({ message: 'Is active must be a boolean' })
  @IsOptional()
  isActive?: boolean;

  @IsBoolean({ message: 'Is featured must be a boolean' })
  @IsOptional()
  isFeatured?: boolean;

  // mainImage убран - берется из media where is_cover = true

  @IsArray({ message: 'Category IDs must be an array' })
  @IsOptional()
  @IsNumber({}, { each: true })
  categoryIds?: number[];

  @IsArray({ message: 'Translations must be an array' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations?: TranslationDto[];

  // Лицензии (добавляются/обновляются при редактировании)
  @IsArray({ message: 'Licenses must be an array' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  licenses?: { licenseTypeId: number; price: number }[];

  // Временный URL основного файла (будет перемещен при обновлении)
  @IsString({ message: 'Temp file URL must be a string' })
  @IsOptional()
  tempFileUrl?: string;

  // Временные URL медиа (будут перемещены при обновлении)
  @IsArray({ message: 'Temp media URLs must be an array' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  tempMediaUrls?: { url: string; isCover?: boolean }[];

  // Обновленные медиа (изменение isCover для существующих)
  @IsArray({ message: 'Updated media must be an array' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  updatedMedia?: { id: number; isCover?: boolean }[];

  // ID удаленных медиа
  @IsArray({ message: 'Deleted media IDs must be an array' })
  @IsOptional()
  @IsNumber({}, { each: true })
  deletedMediaIds?: number[];
}
