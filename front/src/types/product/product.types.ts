/**
 * Product Types - Базовые типы для Product
 */

import type { EntityBase, Timestamped } from '../base';
import { ProductType, MediaType } from './enums';

/**
 * Базовые поля продукта
 */
export interface ProductBase extends EntityBase, Timestamped {
  sellerId: number;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  sku: string | null;
  type: ProductType;
  fileUrl: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  mainImage: string | null;
}

/**
 * DTO для перевода
 */
export interface TranslationDto {
  language?: string;
  name?: string;
  description?: string;
  shortDescription?: string;
}

/**
 * DTO для лицензии
 */
export interface LicenseDto {
  licenseTypeId: number;
  price: number;
}

/**
 * DTO для добавления медиа
 */
export interface AddMediaDto {
  url: string;
  mediaType: MediaType;
  isCover?: boolean;
  sortOrder?: number;
  youtubeId?: string;
  youtubeUrl?: string;
}

/**
 * DTO для создания продукта
 */
export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  sku?: string;
  type: ProductType;
  fileUrl: string;
  stock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  mainImage?: string;
  categoryIds?: number[];
  translations?: TranslationDto[];
  licenses?: LicenseDto[];
}

/**
 * DTO для обновления продукта
 */
export type UpdateProductDto = Partial<CreateProductDto> & {
  categoryIds?: number[];
  translations?: TranslationDto[];
};
