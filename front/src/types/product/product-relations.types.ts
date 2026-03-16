/**
 * Product Relations Types - Типы с отношениями для Product
 */

import type { ProductBase } from './product.types';
import { MediaType } from './enums';

/**
 * Информация о продавце
 */
export interface SellerInfo {
  id: number;
  username: string;
  email?: string;
  avatarUrl?: string;
}

/**
 * Информация о категории
 */
export interface CategoryInfo {
  id: number;
  name: string;
}

/**
 * Информация о переводе
 */
export interface TranslationInfo {
  language: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
}

/**
 * Информация о типе лицензии
 */
export interface LicenseTypeInfo {
  id: number;
  name: string;
  slug?: string;
}

/**
 * Информация о лицензии
 */
export interface LicenseInfo {
  id: number;
  licenseTypeId: number;
  price: number;
  licenseType?: LicenseTypeInfo;
}

/**
 * Базовые поля медиа
 */
export interface ProductMediaBase {
  id: number;
  url: string;
  mediaType: MediaType;
  isCover: boolean;
  sortOrder: number;
}

/**
 * Изображение
 */
export interface ProductImageInfo extends ProductMediaBase {
  mediaType: MediaType.IMAGE;
}

/**
 * Видео
 */
export interface ProductVideoInfo extends ProductMediaBase {
  mediaType: MediaType.VIDEO;
  duration?: number;
  thumbnailUrl?: string;
}

/**
 * YouTube
 */
export interface ProductYouTubeInfo extends ProductMediaBase {
  mediaType: MediaType.YOUTUBE;
  youtubeId: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
}

/**
 * Медиа для продукта (объединенный тип)
 */
export type MediaInfo = ProductImageInfo | ProductVideoInfo | ProductYouTubeInfo;

/**
 * Product с загруженными отношениями (для отображения)
 */
export interface ProductResponse extends ProductBase {
  seller?: SellerInfo;
  categories?: CategoryInfo[];
  translations?: TranslationInfo[];
  media?: MediaInfo[];
  licenses?: LicenseInfo[];
}
