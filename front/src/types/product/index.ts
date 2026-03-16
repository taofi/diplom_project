/**
 * Product Types
 * Централизованные типы для продуктов
 * 
 * Структура согласно plans/types-architecture.md:
 * - enums.ts - Перечисления
 * - product.types.ts - Базовые типы и DTO
 * - product-query.types.ts - Типы запросов
 * - product-relations.types.ts - Типы с отношениями
 */

// Re-export from base for convenience
export type { 
  EntityBase, 
  Timestamped, 
  PaginationParams, 
  PaginationMeta, 
  PaginatedResult, 
  BaseQueryParams 
} from '../base';

// Enums
export { MediaType, ProductType } from './enums';

// Base types and DTOs
export type { 
  ProductBase, 
  CreateProductDto, 
  UpdateProductDto, 
  TranslationDto, 
  LicenseDto,
  AddMediaDto
} from './product.types';

// Query types
export type { 
  ProductQueryParams, 
  ProductListResponse 
} from './product-query.types';

// Relation types
export type {
  SellerInfo,
  CategoryInfo,
  TranslationInfo,
  LicenseTypeInfo,
  LicenseInfo,
  ProductMediaBase,
  ProductImageInfo,
  ProductVideoInfo,
  ProductYouTubeInfo,
  MediaInfo,
  ProductResponse
} from './product-relations.types';

// =======================
// HELPER FUNCTIONS
// =======================

import { MediaType } from './enums';
import type { AddMediaDto } from './product.types';
import type { ProductBase } from './product.types';

/**
 * Определить тип медиа по URL
 */
export function detectMediaType(url: string): MediaType {
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return MediaType.YOUTUBE;
    }
  }

  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  if (videoExtensions.some(ext => url.toLowerCase().endsWith(ext))) {
    return MediaType.VIDEO;
  }

  return MediaType.IMAGE;
}

/**
 * Извлечь YouTube ID из URL
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Получить thumbnail URL для YouTube
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'max' = 'medium'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    max: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Получить embed URL для YouTube
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Создать медиа из URL (автоматическое определение типа)
 */
export function createMediaFromUrl(
  url: string,
  options?: { isCover?: boolean; sortOrder?: number },
): AddMediaDto {
  const mediaType = detectMediaType(url);
  const result: AddMediaDto = {
    url,
    mediaType,
    isCover: options?.isCover ?? false,
    sortOrder: options?.sortOrder ?? 0,
  };

  if (mediaType === MediaType.YOUTUBE) {
    const youtubeId = extractYouTubeId(url);
    if (youtubeId) {
      result.youtubeId = youtubeId;
      result.youtubeUrl = url;
      result.url = getYouTubeEmbedUrl(youtubeId);
    }
  }

  return result;
}

// =======================
// FACTORY FUNCTIONS
// =======================

import { ProductType } from './enums';

/**
 * Создать базовый ProductResponse
 */
export function createProductBase(product: Partial<ProductBase>): ProductBase {
  return {
    id: product.id ?? 0,
    sellerId: product.sellerId ?? 0,
    name: product.name ?? '',
    description: product.description ?? null,
    price: product.price ?? 0,
    discountPrice: product.discountPrice ?? null,
    sku: product.sku ?? null,
    type: product.type ?? ProductType.BRUSH,
    fileUrl: product.fileUrl ?? '',
    stock: product.stock ?? 0,
    isActive: product.isActive ?? true,
    isFeatured: product.isFeatured ?? false,
    mainImage: product.mainImage ?? null,
    createdAt: product.createdAt ?? new Date(),
    updatedAt: product.updatedAt ?? new Date(),
  };
}
