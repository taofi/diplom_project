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
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: 'Price must be a number' })
  @IsNotEmpty({ message: 'Price is required' })
  @Min(0)
  price: number;

  @IsNumber({}, { message: 'Discount price must be a number' })
  @IsOptional()
  @Min(0)
  discountPrice?: number;

  @IsString({ message: 'SKU must be a string' })
  @IsOptional()
  sku?: string;

  @IsString({ message: 'Type must be a string' })
  @IsNotEmpty({ message: 'Type is required' })
  type: ProductType;

  @IsString({ message: 'File URL must be a string' })
  @IsNotEmpty({ message: 'File URL is required' })
  fileUrl: string;

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

  @IsString({ message: 'Main image must be a string' })
  @IsOptional()
  mainImage?: string;

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
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LicenseDto)
  licenses?: LicenseDto[];
}
