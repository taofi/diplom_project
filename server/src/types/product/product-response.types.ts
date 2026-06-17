

import { Language } from '../../common/enums/language.enum';
import type { EntityBase } from '../base/entity-base';
import type { Category } from '../../db/models/category.model';
import type { ProductMedia } from '../../db/models/product-media.model';
import type { ProductTranslation } from '../../db/models/product-translation.model';
import type { ProductLicense } from '../../db/models/product-license.model';
import type { LicenseType } from '../../db/models/license-type.model';
import type { User } from '../../db/models/user.model';
import { normalizeLanguage } from '../../translation/utils/language.utils';

export type {
  ProductType,
  MediaType,
  CategoryInfo,
  TranslationInfo,
  MediaInfo,
  LicenseTypeInfo,
  LicenseInfo,
} from './product.types';

export { ProductType as ProductTypeEnum, MediaType as MediaTypeEnum } from './product.types';



export interface ProductFieldsResponse extends EntityBase {
  id: number;
  seller_id: number;
  price: number;
  discount_price: number | null;
  type: import('./product.types').ProductType;
  file_url: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  main_image: string | null;
  created_at: Date;
  updated_at: Date;
}



export interface ProductListItemResponse {
  id: number;
  sellerId: number;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  type: import('./product.types').ProductType;
  fileUrl: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  mainImage: string | null;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: number;
    name: string;
    avatarUrl?: string | null;
  };

  licenses?: import('./product.types').LicenseInfo[];
  categories?: import('./product.types').CategoryInfo[];
}


export type ProductWithFullRelations = ProductFieldsResponse & {
  seller?: User;
  translations?: ProductTranslation[];
  media?: ProductMedia[];
  licenses?: (ProductLicense & {
    license_type?: LicenseType;
  })[];
  categories?: Category[];
};


export interface ProductDetailResponse {
  id: number;
  sellerId: number;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  type: import('./product.types').ProductType;
  fileUrl: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  mainImage: string | null;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: number;
    name: string;
    avatarUrl?: string | null;
  };

  translations?: import('./product.types').TranslationInfo[];
  media?: import('./product.types').MediaInfo[];
  licenses?: import('./product.types').LicenseInfo[];
  categories?: import('./product.types').CategoryInfo[];
}



export function createProductListItemResponse(
  product: ProductWithFullRelations,
  language?: string,
): ProductListItemResponse {
  const normalizedLang = normalizeLanguage(language);
  let price = 0;
  if (product.licenses && product.licenses.length > 0) {
    const prices = product.licenses.map((l) => Number(l.price));
    price = Math.min(...prices);
  }

  let mainImage = '';
  if (product.media && product.media.length > 0) {
    const coverMedia = product.media.find((m) => m.is_cover);
    mainImage = coverMedia ? String(coverMedia.url) : '';
  }

  let name = '';
  let description: string | null = null;

  const translations = product.translations;

  if (translations && translations.length > 0) {
    const translationsData = translations.map((t) => t.toJSON());
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
    type: product.type,
    fileUrl: product.file_url,
    stock: product.stock,
    isActive: product.is_active,
    isFeatured: product.is_featured,
    mainImage: mainImage || null,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };

  if (product.seller) {
    response.author = {
      id: product.seller.id,
      name: product.seller.name,
      avatarUrl: product.seller.avatar_url ?? null,
    };
  }

  if (product.licenses) {
    response.licenses = product.licenses.map((l) => {
      let licenseName = '';
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
            }
          : undefined,
      };
    });
  }

  if (product.categories) {
    response.categories = product.categories.map((cat) => ({
      id: cat.id,
      name: getCategoryName(cat, normalizedLang),
    }));
  }

  return response;
}


export function createProductDetailResponse(
  product: ProductWithFullRelations,
  language?: string,
): ProductDetailResponse {
  const normalizedLang = normalizeLanguage(language);
  let price = 0;
  if (product.licenses && product.licenses.length > 0) {
    const prices = product.licenses.map((l) => Number(l.price));
    price = Math.min(...prices);
  }

  let mainImage = '';
  if (product.media && product.media.length > 0) {
    const coverMedia = product.media.find((m) => m.is_cover);
    mainImage = coverMedia ? String(coverMedia.url) : '';
  }

  let name = '';
  let description: string | null = null;

  const translations = product.translations;
  if (translations && translations.length > 0) {
    const translationsData = translations.map((t) => t.toJSON());
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
    type: product.type,
    fileUrl: product.file_url,
    stock: product.stock,
    isActive: product.is_active,
    isFeatured: product.is_featured,
    mainImage: mainImage || null,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };

  if (product.seller) {
    response.author = {
      id: product.seller.id,
      name: product.seller.name,
      avatarUrl: product.seller.avatar_url ?? null,
    };
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
    response.licenses = product.licenses.map((l) => {
      let licenseName = '';
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
            }
          : undefined,
      };
    });
  }

  if (product.categories) {
    response.categories = product.categories.map((cat) => ({
      id: cat.id,
      name: getCategoryName(cat, normalizedLang),
    }));
  }

  return response;
}

function getCategoryName(category: Category, normalizedLanguage: string): string {
  const translations =
    (category as Category & { translations?: Array<{ locale?: string; name?: string; toJSON?: () => unknown }> })
      .translations || [];

  if (!translations.length) {
    return '';
  }

  const normalizedTranslations = translations.map((translation) =>
    translation.toJSON ? (translation.toJSON()) : translation,
  );

  const localized = normalizedTranslations.find(
    (translation) =>
      translation.locale?.toLowerCase() === normalizedLanguage.toLowerCase() && !!translation.name,
  );

  if (localized?.name) {
    return localized.name;
  }

  return normalizedTranslations.find((translation) => !!translation.name)?.name || '';
}


export interface ProductListResponseInternal {
  data: ProductListItemResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}


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


