import { Product } from '../../db/models/product.model';

export class ProductResponseDto {
  id: number;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  sku: string | null;
  type: string;
  fileUrl: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  mainImage: string | null;
  sellerId: number;
  createdAt: Date;
  updatedAt: Date;

  // Relations (included when expanded)
  seller?: {
    id: number;
    username: string;
    email?: string;
  };
  categories?: Array<{
    id: number;
    name: string;
  }>;
  translations?: Array<{
    language: string;
    name: string;
    description: string | null;
    shortDescription: string | null;
  }>;
  media?: Array<{
    id: number;
    url: string;
    mediaType: string;
    isCover: boolean;
    sortOrder: number;
  }>;
  licenses?: Array<{
    id: number;
    licenseTypeId: number;
    licenseType?: {
      id: number;
      name: string;
    };
    price: number;
  }>;

  static fromEntity(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.description = product.description;
    dto.price = Number(product.price);
    dto.discountPrice = product.discount_price ? Number(product.discount_price) : null;
    dto.sku = product.sku;
    dto.type = product.type;
    dto.fileUrl = product.file_url;
    dto.stock = product.stock;
    dto.isActive = product.is_active;
    dto.isFeatured = product.is_featured;
    dto.mainImage = product.main_image;
    dto.sellerId = product.seller_id;
    dto.createdAt = product.created_at;
    dto.updatedAt = product.updated_at;

    // Include relations if loaded
    if ((product as any).seller) {
      dto.seller = {
        id: (product as any).seller.id,
        username: (product as any).seller.username,
        email: (product as any).seller.email,
      };
    }

    if ((product as any).categories) {
      dto.categories = (product as any).categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
      }));
    }

    if ((product as any).translations) {
      dto.translations = (product as any).translations.map((t: any) => ({
        language: t.language,
        name: t.name,
        description: t.description,
        shortDescription: t.shortDescription,
      }));
    }

    if ((product as any).media) {
      dto.media = (product as any).media.map((m: any) => ({
        id: m.id,
        url: m.url,
        mediaType: m.media_type,
        isCover: m.is_cover,
        sortOrder: m.sort_order,
      }));
    }

    if ((product as any).licenses) {
      dto.licenses = (product as any).licenses.map((l: any) => ({
        id: l.id,
        licenseTypeId: l.license_type_id,
        price: Number(l.price),
        licenseType: l.license_type ? {
          id: l.license_type.id,
          name: l.license_type.name,
        } : undefined,
      }));
    }

    return dto;
  }
}

export class ProductListResponseDto {
  data: ProductResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  static fromEntities(
    products: Product[],
    total: number,
    page: number,
    limit: number,
  ): ProductListResponseDto {
    return {
      data: products.map((p) => ProductResponseDto.fromEntity(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
