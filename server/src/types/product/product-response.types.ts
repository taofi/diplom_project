/**
 * Типы для Product Response
 * Разделение на типы для списка и для детального просмотра
 * 
 * Основные типы переэкспортируются из product.types.ts
 */

import { Language } from '../../common/enums/language.enum';
import type { EntityBase } from '../base/entity-base';
import type { Category } from '../../db/models/category.model';
import type { ProductMedia } from '../../db/models/product-media.model';
import type { ProductTranslation } from '../../db/models/product-translation.model';
import type { ProductLicense } from '../../db/models/product-license.model';
import type { LicenseType } from '../../db/models/license-type.model';
import { normalizeLanguage } from '../../translation/utils/language.utils';

// Re-export типов из product.types.ts
export type {
  ProductType,
  MediaType,
  CategoryInfo,
  TranslationInfo,
  MediaInfo,
  LicenseTypeInfo,
  LicenseInfo,
} from './product.types';

// Re-export enum из product.types.ts
export { ProductType as ProductTypeEnum, MediaType as MediaTypeEnum } from './product.types';

// =======================
// BASE PRODUCT FIELDS
// =======================

/**
 * Базовые поля Product (snake_case - как в базе данных)
 * Переименовано для избежания конфликта с product.types.ts
 * name, description перенесены в product_translations
 * sku удален
 */
export interface ProductFieldsResponse extends EntityBase {
  id: number;
  seller_id: number;
  // name и description теперь в translations
  price: number;
  discount_price: number | null;
  // sku удален
  type: import('./product.types').ProductType;
  file_url: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  main_image: string | null;
  created_at: Date;
  updated_at: Date;
}

// =======================
// RESPONSE TYPES
// =======================

/**
 * Product для списка (camelCase)
 * - main_image: вычисляется из media where is_cover = true
 * - НЕТ массива media
 * - name, description берутся из translations
 * - sku удален
 */
export interface ProductListItemResponse {
  id: number;
  sellerId: number;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  // sku удален
  type: import('./product.types').ProductType;
  fileUrl: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  mainImage: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations - только то, что нужно для списка
  licenses?: import('./product.types').LicenseInfo[];
  categories?: import('./product.types').CategoryInfo[];
}

/**
 * Product с загруженными отношениями (для детального просмотра)
 */
export type ProductWithFullRelations = ProductFieldsResponse & {
  translations?: ProductTranslation[];
  media?: ProductMedia[];
  licenses?: (ProductLicense & {
    license_type?: LicenseType;
  })[];
  categories?: Category[];
};

/**
 * Product для детального просмотра (полный)
 * - ВСЕ translations
 * - ВСЕ media
 * - main_image (вычисляется из media where is_cover = true)
 * - ВСЕ licenses
 * - ВСЕ categories
 * - sku удален
 */
export interface ProductDetailResponse {
  id: number;
  sellerId: number;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  // sku удален
  type: import('./product.types').ProductType;
  fileUrl: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  mainImage: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations - полный набор для детального просмотра
  translations?: import('./product.types').TranslationInfo[];
  media?: import('./product.types').MediaInfo[];
  licenses?: import('./product.types').LicenseInfo[];
  categories?: import('./product.types').CategoryInfo[];
}

// =======================
// RESPONSE FACTORY FUNCTIONS
// =======================

/**
 * Создать ProductListItemResponse из сущности с отношениями
 * - Вычисляет price = MIN(licenses.price)
 * - Вычисляет main_image из media where is_cover = true
 * - НЕ включает массив media
 * - name и description берутся из translations
 */
export function createProductListItemResponse(
  product: ProductWithFullRelations,
  language?: string,
): ProductListItemResponse {
  // Вычисляем price как минимальную цену из лицензий
  let price = 0;
  if (product.licenses && product.licenses.length > 0) {
    const prices = product.licenses.map((l) => Number(l.price));
    price = Math.min(...prices);
  }

  // Получаем main_image из медиа где is_cover = true
  let mainImage = '';
  if (product.media && product.media.length > 0) {
    const coverMedia = product.media.find((m) => m.is_cover);
    mainImage = coverMedia ? String(coverMedia.url) : '';
  }

  // Получаем name и description из translations
  let name = '';
  let description: string | null = null;

  // Работаем с translations - используем toJSON() для получения dataValues
  const translations = product.translations;

  if (translations && translations.length > 0) {
    const translationsData = translations.map((t) => t.toJSON());
    const normalizedLang = normalizeLanguage(language);
    const translation = translationsData.find((t: { language?: string; name?: string; description?: string }) =>
      String(t.language).toLowerCase() === normalizedLang.toLowerCase()
    ) || translationsData[0];

    if (translation) {
      name = translation.name || '';
      description = translation.description || null;
    }
  }

  const response: ProductListItemResponse = {
    id: product.id,
    sellerId: product.seller_id,
    name,
    description,
    price,
    discountPrice: product.discount_price
      ? Number(product.discount_price)
      : null,
    // sku удален
    type: product.type,
    fileUrl: product.file_url,
    stock: product.stock,
    isActive: product.is_active,
    isFeatured: product.is_featured,
    mainImage: mainImage || null,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };

  // Добавляем licenses
  if (product.licenses) {
    const normalizedLang = normalizeLanguage(language);
    response.licenses = product.licenses.map((l) => {
      let licenseName = l.license_type?.slug || '';
      if (l.license_type?.translations && l.license_type.translations.length > 0) {
        const translationsArr = l.license_type.translations.map((t) => t.toJSON ? t.toJSON() : t);
        const translation = translationsArr.find(
          (t: { locale?: string; name?: string }) => 
            t.locale?.toLowerCase() === normalizedLang.toLowerCase()
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

  // Добавляем categories
  if (product.categories) {
    response.categories = product.categories.map((cat) => ({
      id: cat.id,
      name:
        (cat as Category & { translations?: Array<{ name: string }> })
          .translations?.[0]?.name ?? '',
    }));
  }

  return response;
}

/**
 * Создать ProductDetailResponse из сущности с отношениями
 * - Включает ВСЕ translations
 * - Включает ВСЕ media
 * - Вычисляет main_image из media where is_cover = true
 * - Включает ВСЕ licenses
 * - Включает ВСЕ categories
 * - name и description берутся из translations по языку
 */
export function createProductDetailResponse(
  product: ProductWithFullRelations,
  language?: string,
): ProductDetailResponse {
  // Вычисляем price как минимальную цену из лицензий
  let price = 0;
  if (product.licenses && product.licenses.length > 0) {
    const prices = product.licenses.map((l) => Number(l.price));
    price = Math.min(...prices);
  }

  // Получаем main_image из медиа где is_cover = true
  let mainImage = '';
  if (product.media && product.media.length > 0) {
    const coverMedia = product.media.find((m) => m.is_cover);
    mainImage = coverMedia ? String(coverMedia.url) : '';
  }

  // Получаем name и description из translations
  let name = '';
  let description: string | null = null;

  const translations = product.translations;
  if (translations && translations.length > 0) {
    const translationsData = translations.map((t) => t.toJSON());
    const normalizedLang = normalizeLanguage(language);
    const translation = translationsData.find((t: { language?: string; name?: string; description?: string }) =>
      String(t.language).toLowerCase() === normalizedLang.toLowerCase()
    ) || translationsData[0];

    if (translation) {
      name = translation.name || '';
      description = translation.description || null;
    }
  }

  const response: ProductDetailResponse = {
    id: product.id,
    sellerId: product.seller_id,
    name,
    description,
    price,
    discountPrice: product.discount_price
      ? Number(product.discount_price)
      : null,
    // sku удален
    type: product.type,
    fileUrl: product.file_url,
    stock: product.stock,
    isActive: product.is_active,
    isFeatured: product.is_featured,
    mainImage: mainImage || null,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };

  // Добавляем translations
  if (product.translations) {
    response.translations = product.translations.map((t) => ({
      language: t.language as Language,
      name: t.name,
      description: t.description,
      shortDescription: t.shortDescription,
    }));
  }

  // Добавляем media
  if (product.media) {
    response.media = product.media.map((m) => ({
      id: m.id,
      url: m.url,
      mediaType: m.media_type,
      isCover: m.is_cover,
      sortOrder: m.sort_order,
    }));
  }

  // Добавляем licenses
  if (product.licenses) {
    const normalizedLang = normalizeLanguage(language);
    response.licenses = product.licenses.map((l) => {
      let licenseName = l.license_type?.slug || '';
      if (l.license_type?.translations && l.license_type.translations.length > 0) {
        const translationsArr = l.license_type.translations.map((t) => t.toJSON ? t.toJSON() : t);
        const translation =
          translationsArr.find(
            (t: { locale?: string; name?: string }) =>
              t.locale?.toLowerCase() === normalizedLang.toLowerCase(),
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

  // Добавляем categories
  if (product.categories) {
    response.categories = product.categories.map((cat) => ({
      id: cat.id,
      name:
        (cat as Category & { translations?: Array<{ name: string }> })
          .translations?.[0]?.name ?? '',
    }));
  }

  return response;
}

/**
 * Результат с продуктами и пагинацией (для внутреннего использования)
 */
export interface ProductListResponseInternal {
  data: ProductListItemResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Создать ProductListResponse из списка продуктов
 */
export function createProductListResponseForResponse(
  products: ProductWithFullRelations[],
  total: number,
  page: number,
  limit: number,
  language?: string,
): ProductListResponseInternal {
  return {
    data: products.map((p) => createProductListItemResponse(p, language)),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
