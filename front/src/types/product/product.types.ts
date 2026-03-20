/**
 * Product Types - Базовые типы для Product
 */

import type { EntityBase, Timestamped } from '../base';
import { ProductType, MediaType } from './enums';

/**
 * Базовые поля продукта
 * name, description теперь берутся из translations
 * sku удален
 */
export interface ProductBase extends EntityBase, Timestamped {
  sellerId: number;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  // sku удален
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
 * DTO для обновления медиа при редактировании продукта
 */
export interface UpdateMediaItem {
  id: number;
  isCover?: boolean;
}

/**
 * DTO для создания продукта
 * name и description теперь передаются только в translations
 */
export interface CreateProductDto {
  // name и description перенесены в translations
  price: number;
  discountPrice?: number;
  // sku удален
  type: ProductType;
  // Основной файл продукта
  fileUrl?: string;
  // Временный URL файла (будет перемещен при создании)
  tempFileUrl?: string;
  // Временные URL медиа (будут перемещены при создании)
  // Может быть массив URL или массив объектов { url, isCover }
  tempMediaUrls?: { url: string; isCover?: boolean }[];
  stock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  mainImage?: string;
  categoryIds?: number[];
  // Переводы для продукта (поддержка mu-lingua)
  translations?: TranslationDto[];
  licenses?: LicenseDto[];
}

/**
 * DTO для обновления продукта
 */
export type UpdateProductDto = Partial<CreateProductDto> & {
  categoryIds?: number[];
  translations?: TranslationDto[];
  // Обновленные медиа (изменение isCover)
  updatedMedia?: UpdateMediaItem[];
  // ID удаленных медиа
  deletedMediaIds?: number[];
};
