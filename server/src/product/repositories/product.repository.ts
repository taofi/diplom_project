import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product, ProductType } from '../../db/models/product.model';
import { ProductMedia } from '../../db/models/product-media.model';
import { ProductTranslation } from '../../db/models/product-translation.model';
import { ProductLicense } from '../../db/models/product-license.model';
import { ProductCategory } from '../../db/models/product-category.model';
import { Category } from '../../db/models/category.model';
import { Language } from '../../common/enums/language.enum';
import { FileService, MediaFolder } from '../../common/services/file.service';
import type { FindOptions } from 'sequelize';
import { Op } from 'sequelize';
import {
  ProductWithRelations,
  CreateProductDto,
  UpdateProductDto,
  ProductQueryParams,
} from '../../types/product';

type ProductWhereOptions = {
  categoryId?: number;
  is_active?: boolean;
  is_featured?: boolean;
  type?: ProductType;
  seller_id?: number;
  price?: { [Op.gte]?: number; [Op.lte]?: number };
  [Op.or]?: Array<{
    name?: { [Op.iLike]: string };
    description?: { [Op.iLike]: string };
    sku?: { [Op.iLike]: string };
  }>;
};

/**
 * Интерфейс для создания Product в БД
 */
interface ProductCreateData {
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  sku: string | null;
  type: ProductType;
  file_url: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  main_image: string | null;
  seller_id: number;
}

/**
 * Интерфейс для обновления Product
 */
type ProductUpdateData = Partial<ProductCreateData>;

@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Product)
    private readonly productModel: typeof Product,
    @InjectModel(ProductMedia)
    private readonly productMediaModel: typeof ProductMedia,
    @InjectModel(ProductTranslation)
    private readonly productTranslationModel: typeof ProductTranslation,
    @InjectModel(ProductLicense)
    private readonly productLicenseModel: typeof ProductLicense,
    private readonly fileService: FileService,
  ) {}

  async findAll(options?: FindOptions<Product>): Promise<Product[]> {
    return this.productModel.findAll(options);
  }

  async findById(
    id: number,
    options?: FindOptions<Product>,
  ): Promise<Product | null> {
    return this.productModel.findByPk(id, options);
  }

  async findByIdWithRelations(
    id: number,
  ): Promise<ProductWithRelations | null> {
    const product = await this.productModel.findByPk(id, {
      include: [
        { model: ProductMedia },
        { model: ProductTranslation },
        { model: ProductLicense, include: [Category] },
        { model: Category },
      ],
    });

    if (!product) return null;

    // Добавляем типизированные связи
    return product as unknown as ProductWithRelations;
  }

  async findBySku(
    sku: string,
    options?: FindOptions<Product>,
  ): Promise<Product | null> {
    return this.productModel.findOne({
      where: { sku },
      ...options,
    });
  }

  async findAndCountAll(
    query: ProductQueryParams = {},
  ): Promise<{ rows: ProductWithRelations[]; count: number }> {
    const {
      page = 1,
      limit = 10,
      categoryId,
      isActive,
      search,
      type,
      sellerId,
      isFeatured,
      minPrice,
      maxPrice,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    const offset = (page - 1) * limit;

    const where: ProductWhereOptions = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    if (type) {
      where.type = type;
    }

    if (sellerId) {
      where.seller_id = sellerId;
    }

    if (isFeatured !== undefined) {
      where.is_featured = isFeatured;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price[Op.gte] = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price[Op.lte] = maxPrice;
      }
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const result = await this.productModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [[sortBy, sortOrder.toUpperCase() as 'ASC' | 'DESC']],
      include: [{ model: Category }],
    });

    return {
      rows: result.rows as unknown as ProductWithRelations[],
      count: result.count,
    };
  }

  async create(
    data: CreateProductDto,
    sellerId: number,
  ): Promise<ProductWithRelations> {
    const createData: ProductCreateData = {
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      discount_price: data.discountPrice ?? null,
      sku: data.sku ?? null,
      type: data.type,
      file_url: data.fileUrl,
      stock: data.stock ?? 0,
      is_active: data.isActive ?? true,
      is_featured: data.isFeatured ?? false,
      main_image: data.mainImage ?? null,
      seller_id: sellerId,
    };

    const product = await this.productModel.create(createData as any);

    // Add categories
    if (data.categoryIds && data.categoryIds.length > 0) {
      for (const categoryId of data.categoryIds) {
        await ProductCategory.create({
          product_id: product.id,
          category_id: categoryId,
        });
      }
    }

    // Add translations
    if (data.translations && data.translations.length > 0) {
      for (const translation of data.translations) {
        await this.productTranslationModel.create({
          productId: product.id,
          name: translation.name || '',
          description: translation.description || '',
          shortDescription: translation.shortDescription || '',
          language: (translation.language as Language) || Language.ENGLISH,
        } as any);
      }
    }

    // Add licenses
    if (data.licenses && data.licenses.length > 0) {
      for (const license of data.licenses) {
        await this.productLicenseModel.create({
          product_id: product.id,
          license_type_id: license.licenseTypeId,
          price: license.price,
        });
      }
    }

    return this.findByIdWithRelations(
      product.id,
    ) as Promise<ProductWithRelations>;
  }

  async update(
    id: number,
    data: UpdateProductDto,
  ): Promise<ProductWithRelations> {
    const product = await this.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update basic fields
    const updateData: ProductUpdateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.discountPrice !== undefined)
      updateData.discount_price = data.discountPrice;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.fileUrl !== undefined) updateData.file_url = data.fileUrl;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.isFeatured !== undefined) updateData.is_featured = data.isFeatured;
    if (data.mainImage !== undefined) updateData.main_image = data.mainImage;

    await product.update(updateData);

    // Update categories if provided
    if (data.categoryIds !== undefined) {
      await ProductCategory.destroy({ where: { product_id: id } });
      for (const categoryId of data.categoryIds) {
        await ProductCategory.create({
          product_id: id,
          category_id: categoryId,
        });
      }
    }

    // Update translations if provided
    if (data.translations !== undefined) {
      await this.productTranslationModel.destroy({ where: { productId: id } });
      for (const translation of data.translations) {
        await this.productTranslationModel.create({
          productId: id,
          name: translation.name || '',
          description: translation.description || '',
          shortDescription: translation.shortDescription || '',
          language: (translation.language as Language) || Language.ENGLISH,
        } as any);
      }
    }

    return this.findByIdWithRelations(id) as Promise<ProductWithRelations>;
  }

  async delete(id: number): Promise<void> {
    const product = await this.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Delete all media files from disk
    this.deleteAllMediaFiles(id);

    // Delete related records
    await ProductCategory.destroy({ where: { product_id: id } });
    await this.productTranslationModel.destroy({ where: { productId: id } });
    await this.productLicenseModel.destroy({ where: { product_id: id } });
    await this.productMediaModel.destroy({ where: { product_id: id } });

    await product.destroy();
  }

  /**
   * Delete all media files for a product from disk
   */
  private deleteAllMediaFiles(productId: number): void {
    this.fileService.deleteFolderFiles(MediaFolder.PRODUCT, productId);
  }

  async addMedia(
    productId: number,
    data: {
      url: string;
      mediaType?: string;
      isCover?: boolean;
      sortOrder?: number;
    },
  ): Promise<ProductMedia> {
    return this.productMediaModel.create({
      product_id: productId,
      url: data.url,
      media_type: (data.mediaType as ProductMedia['media_type']) || 'image',
      is_cover: data.isCover || false,
      sort_order: data.sortOrder || 0,
    });
  }

  async deleteMedia(mediaId: number): Promise<void> {
    const media = await this.productMediaModel.findByPk(mediaId);
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Delete the file from disk
    if (media.url) {
      this.fileService.deleteFile(media.url);
    }

    await media.destroy();
  }

  async addLicense(
    productId: number,
    licenseTypeId: number,
    price: number,
  ): Promise<ProductLicense> {
    return this.productLicenseModel.create({
      product_id: productId,
      license_type_id: licenseTypeId,
      price,
    });
  }
}
