import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
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

class LicenseDto {
  @IsNumber()
  @IsNotEmpty()
  licenseTypeId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;
}

export class CreateProductDto {
  // name и description перенесены в массив translations
  // sku удален

  // price убран - теперь вычисляется как MIN(licenses.price)

  @IsNumber({}, { message: 'Discount price must be a number' })
  @IsOptional()
  @Min(0)
  discountPrice?: number;

  @IsString({ message: 'Type must be a string' })
  @IsNotEmpty({ message: 'Type is required' })
  type: ProductType;

  // Основной файл продукта
  @IsString({ message: 'File URL must be a string' })
  @IsOptional()
  fileUrl?: string;

  // Временный URL файла (будет перемещен при создании продукта)
  @IsString({ message: 'Temp file URL must be a string' })
  @IsOptional()
  tempFileUrl?: string;

  // Временные URL медиа (будут перемещены при создании продукта)
  // Может быть массив URL (строк) или массив объектов { url, isCover }
  @IsOptional()
  tempMediaUrls?: { url: string; isCover?: boolean }[];

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

  // mainImage убран - теперь берется из media where is_cover = true

  @IsArray({ message: 'Category IDs must be an array' })
  @IsOptional()
  @IsNumber({}, { each: true })
  categoryIds?: number[];

  @IsArray({ message: 'Translations must be an array' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations?: TranslationDto[];

  @IsArray({ message: 'Licenses must be an array' })
  @ValidateNested({ each: true })
  @Type(() => LicenseDto)
  @IsNotEmpty({ message: 'At least one license is required' })
  licenses: LicenseDto[];
}
