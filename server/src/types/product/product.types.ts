

import type { EntityBase } from '../base/entity-base';
import { Language } from '../../common/enums/language.enum';
import type { User } from '../../db/models/user.model';
import type { Category } from '../../db/models/category.model';
import type { ProductMedia } from '../../db/models/product-media.model';
import type { ProductTranslation } from '../../db/models/product-translation.model';
import type { ProductLicense } from '../../db/models/product-license.model';
import type { LicenseType } from '../../db/models/license-type.model';
import { normalizeLanguage } from '../../translation/utils/language.utils';


export enum ProductType {
  BRUSH = 'brush',
  ILLUSTRATION = 'illustration',
}


export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  YOUTUBE = 'youtube',
}



export interface TranslationDto {
  language?: string;
  name?: string;
  description?: string;
  shortDescription?: string;
}


export interface LicenseDto {
  licenseTypeId: number;
  price: number;
}


export interface CreateProductDto {
  discountPrice?: number;
  type: ProductType;
  fileUrl?: string;
  tempFileUrl?: string;
  tempMediaUrls?: { url: string; isCover?: boolean }[];
  stock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  categoryIds?: number[];
  translations?: TranslationDto[];
  licenses?: LicenseDto[];
}


export type UpdateProductDto = Partial<Omit<CreateProductDto, 'price' | 'mainImage'>> & {
  categoryIds?: number[];
  translations?: TranslationDto[];
  tempFileUrl?: string;
  tempMediaUrls?: { url: string; isCover?: boolean }[];
  updatedMedia?: { id: number; isCover?: boolean }[];
  deletedMediaIds?: number[];
};



export interface ProductFields extends EntityBase {
  id: number;
  seller_id: number;
  price: number;
  discount_price: number | null;
  type: ProductType;
  file_url: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  main_image: string | null;
  created_at: Date;
  updated_at: Date;
}


export type ProductCreateFields = Omit<
  ProductFields,
  'id' | 'created_at' | 'updated_at'
>;


export type ProductUpdateFields = Partial<ProductCreateFields>;



export interface SellerInfo {
  id: number;
  username: string;
  email?: string;
  avatarUrl?: string;
}


export interface CategoryInfo {
  id: number;
  name: string;
}


export interface TranslationInfo {
  language: Language;
  name: string;
  description: string | null;
  shortDescription: string | null;
}


export interface MediaInfo {
  id: number;
  url: string;
  mediaType: MediaType;
  isCover: boolean;
  sortOrder: number;
}


export interface LicenseTypeInfo {
  id: number;
  name: string;
  slug?: string;
}


export interface LicenseInfo {
  id: number;
  licenseTypeId: number;
  price: number;
  licenseType?: LicenseTypeInfo;
}



export interface ProductResponse {
  id: number;
  sellerId: number;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  type: ProductType;
  fileUrl: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  mainImage: string | null;
  createdAt: Date;
  updatedAt: Date;

  seller?: SellerInfo;
  categories?: CategoryInfo[];
  translations?: TranslationInfo[];
  media?: MediaInfo[];
  licenses?: LicenseInfo[];
}


export type ProductWithRelations = ProductFields & {
  seller?: User;
  categories?: Category[];
  translations?: ProductTranslation[];
  media?: ProductMedia[];
  licenses?: (ProductLicense & {
    license_type?: LicenseType;
  })[];
};


export type ProductWithComputedFields = ProductWithRelations & {
  price: number;
  main_image: string;
};



export interface ProductQueryParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  isActive?: boolean;
  search?: string;
  type?: ProductType;
  sellerId?: number;
  sellerIds?: number[];
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}


export interface ProductListResponse {
  data: ProductResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}



export function createProductResponse(
  product: ProductWithRelations,
  language?: string,
): ProductResponse {
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
    type: product.type,
    fileUrl: product.file_url,
    stock: product.stock,
    isActive: product.is_active,
    isFeatured: product.is_featured,
    mainImage: product.main_image,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };

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
      let licenseName = '';
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
            }
          : undefined,
      };
    });
  }

  return response;
}


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


