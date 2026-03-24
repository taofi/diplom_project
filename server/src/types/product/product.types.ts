/**
 * Типы для Product
 * Включает базовые поля, типы с отношениями и DTO
 */

import type { EntityBase } from '../base/entity-base';
import { Language } from '../../common/enums/language.enum';
import type { User } from '../../db/models/user.model';
import type { Category } from '../../db/models/category.model';
import type { ProductMedia } from '../../db/models/product-media.model';
import type { ProductTranslation } from '../../db/models/product-translation.model';
import type { ProductLicense } from '../../db/models/product-license.model';
import type { LicenseType } from '../../db/models/license-type.model';
import { normalizeLanguage } from '../../translation/utils/language.utils';

// =======================
// ENUMS
// =======================

export enum ProductType {
  BRUSH = 'brush',
  ILLUSTRATION = 'illustration',
}

/**
 * Тип медиафайла
 */
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  YOUTUBE = 'youtube',
}

// =======================
// DTOs (camelCase - для ввода/вывода API)
// =======================

/**
 * DTO для перевода продукта
 */
export interface TranslationDto {
  language?: string;
  name?: string;
  description?: string;
  shortDescription?: string;
}

/**
 * DTO для лицензии продукта
 */
export interface LicenseDto {
  licenseTypeId: number;
  price: number;
}

/**
 * DTO для создания продукта (camelCase)
 * price вычисляется как MIN(licenses.price)
 * name и description теперь передаются только в translations
 */
export interface CreateProductDto {
  // name и description перенесены в translations
  // price убран - вычисляется как MIN(licenses.price)
  discountPrice?: number;
  // sku удален
  type: ProductType;
  fileUrl?: string;
  // Временный URL файла (будет перемещен при создании продукта)
  tempFileUrl?: string;
  // Временные URL медиа (будут перемещены при создании продукта)
  // Может быть массив URL или массив объектов { url, isCover }
  tempMediaUrls?: { url: string; isCover?: boolean }[];
  stock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  // mainImage убран - берется из media where is_cover = true
  categoryIds?: number[];
  translations?: TranslationDto[];
  licenses?: LicenseDto[];
}

/**
 * DTO для обновления продукта (все поля опциональны)
 * price вычисляется как MIN(licenses.price)
 */
export type UpdateProductDto = Partial<Omit<CreateProductDto, 'price' | 'mainImage'>> & {
  categoryIds?: number[];
  translations?: TranslationDto[];
  // Поддержка временных файлов при обновлении
  tempFileUrl?: string;
  tempMediaUrls?: { url: string; isCover?: boolean }[];
  // Обновленные медиа (изменение isCover для существующих)
  updatedMedia?: { id: number; isCover?: boolean }[];
  // ID удаленных медиа
  deletedMediaIds?: number[];
};

// =======================
// BASE TYPES (snake_case - как в БД)
// =======================

/**
 * Базовые поля Product (snake_case - как в базе данных)
 * name, description перенесены в product_translations
 * sku удален
 */
export interface ProductFields extends EntityBase {
  id: number;
  seller_id: number;
  // name и description теперь в translations
  price: number;
  discount_price: number | null;
  // sku удален
  type: ProductType;
  file_url: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  main_image: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Базовые поля только для чтения (без id)
 */
export type ProductCreateFields = Omit<
  ProductFields,
  'id' | 'created_at' | 'updated_at'
>;

/**
 * Поля для обновления (все опционально)
 */
export type ProductUpdateFields = Partial<ProductCreateFields>;

// =======================
// RELATIONS TYPES
// =======================

/**
 * Информация о продавце для ответа
 */
export interface SellerInfo {
  id: number;
  username: string;
  email?: string;
  avatarUrl?: string;
}

/**
 * Информация о категории для ответа
 */
export interface CategoryInfo {
  id: number;
  name: string;
}

/**
 * Информация о переводе для ответа
 */
export interface TranslationInfo {
  language: Language;
  name: string;
  description: string | null;
  shortDescription: string | null;
}

/**
 * Информація про медіа для відповіді
 */
export interface MediaInfo {
  id: number;
  url: string;
  mediaType: MediaType;
  isCover: boolean;
  sortOrder: number;
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
 * Информация о лицензии продукта для ответа
 */
export interface LicenseInfo {
  id: number;
  licenseTypeId: number;
  price: number;
  licenseType?: LicenseTypeInfo;
}

// =======================
// RESPONSE TYPES (camelCase)
// =======================

/**
 * Product для ответа API (camelCase)
 * name, description берутся из translations по языку
 * sku удален из ответа
 */
export interface ProductResponse {
  id: number;
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
  createdAt: Date;
  updatedAt: Date;

  // Relations
  seller?: SellerInfo;
  categories?: CategoryInfo[];
  translations?: TranslationInfo[];
  media?: MediaInfo[];
  licenses?: LicenseInfo[];
}

/**
 * Product с загруженными отношениями (для внутреннего использования)
 */
export type ProductWithRelations = ProductFields & {
  seller?: User;
  categories?: Category[];
  translations?: ProductTranslation[];
  media?: ProductMedia[];
  licenses?: (ProductLicense & {
    license_type?: LicenseType;
  })[];
};

/**
 * Расширенный тип Product с вычисляемыми полями для репозитория
 */
export type ProductWithComputedFields = ProductWithRelations & {
  price: number;
  main_image: string;
};

// =======================
// QUERY TYPES
// =======================

/**
 * Параметры запроса для продуктов
 */
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  isActive?: boolean;
  search?: string;
  type?: ProductType;
  sellerId?: number;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Результат с продуктами и пагинацией
 */
export interface ProductListResponse {
  data: ProductResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// =======================
// FACTORY FUNCTIONS
// =======================

/**
 * Создать ProductResponse из сущности с отношениями
 * name и description берутся из translations
 */
export function createProductResponse(
  product: ProductWithRelations,
  language?: string,
): ProductResponse {
  // Получаем name и description из translations
  let name = '';
  let description: string | null = null;

  const translations = product.translations;
  if (translations && translations.length > 0) {
    const translationsData = translations.map((t) => t.toJSON());
    const normalizedLang = normalizeLanguage(language) as Language;
    const translation = translationsData.find((t: { language?: string }) =>
      String(t.language).toLowerCase() === normalizedLang.toLowerCase()
    ) || translationsData[0];

    if (translation) {
      name = translation.name || '';
      description = translation.description || null;
    }
  }

  const response: ProductResponse = {
    id: product.id,
    sellerId: product.seller_id,
    name,
    description,
    price: Number(product.price),
    discountPrice: product.discount_price
      ? Number(product.discount_price)
      : null,
    // sku удален
    type: product.type,
    fileUrl: product.file_url,
    stock: product.stock,
    isActive: product.is_active,
    isFeatured: product.is_featured,
    mainImage: product.main_image,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };

  // Add relations if loaded
  if (product.seller) {
    response.seller = {
      id: product.seller.id,
      username: product.seller.name,
      email: product.seller.email,
      avatarUrl: product.seller.avatar_url ?? undefined,
    };
  }

  if (product.categories) {
    response.categories = product.categories.map((cat) => ({
      id: cat.id,
      name:
        (cat as Category & { translations?: Array<{ name: string }> })
          .translations?.[0]?.name ?? '',
    }));
  }

  if (product.translations) {
    response.translations = product.translations.map((t) => ({
      language: t.language,
      name: t.name,
      description: t.description,
      shortDescription: t.shortDescription,
    }));
  }

  if (product.media) {
    response.media = product.media.map((m) => ({
      id: m.id,
      url: m.url,
      mediaType: m.media_type,
      isCover: m.is_cover,
      sortOrder: m.sort_order,
    }));
  }

  if (product.licenses) {
    const normalizedLang = normalizeLanguage(language);
    response.licenses = product.licenses.map((l) => {
      let licenseName = l.license_type?.slug || '';
      if (l.license_type?.translations && l.license_type.translations.length > 0) {
        const translationsArr: Array<{locale?: string; name?: string}> = l.license_type.translations.map((t) => t.toJSON ? t.toJSON() : t);
        const translation = translationsArr.find(
          (t) => t.locale?.toLowerCase() === normalizedLang.toLowerCase()
        ) || translationsArr[0];
        if (translation?.name) {
          licenseName = translation.name;
        }
      }
      return {
        id: l.id,
        licenseTypeId: l.license_type_id,
        price: Number(l.price),
        licenseType: l.license_type
          ? {
              id: l.license_type.id,
              name: licenseName,
              slug: l.license_type.slug,
            }
          : undefined,
      };
    });
  }

  return response;
}

/**
 * Создать ProductListResponse из списка продуктов
 */
export function createProductListResponse(
  products: ProductWithRelations[],
  total: number,
  page: number,
  limit: number,
  language?: string,
): ProductListResponse {
  return {
    data: products.map((p) => createProductResponse(p, language)),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
