import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product, ProductType } from '../../db/models/product.model';
import { ProductMedia } from '../../db/models/product-media.model';
import { ProductTranslation } from '../../db/models/product-translation.model';
import { ProductLicense } from '../../db/models/product-license.model';
import { ProductCategory } from '../../db/models/product-category.model';
import { Category } from '../../db/models/category.model';
import { User } from '../../db/models/user.model';
import { CategoryTranslation } from '../../db/models/category-translation.model';
import { LicenseType } from '../../db/models/license-type.model';
import { LicenseTypeTranslation } from '../../db/models/license-type-translation.model';
import { Language } from '../../common/enums/language.enum';
import { FileService, MediaFolder } from '../../common/services/file.service';
import { normalizeLanguage } from '../../translation/utils/language.utils';
import type { FindOptions } from 'sequelize';
import { Op, QueryTypes } from 'sequelize';
import {
  ProductWithRelations,
  ProductWithComputedFields,
  CreateProductDto,
  UpdateProductDto,
  ProductQueryParams,
} from '../../types/product';
import {
  ProductWithFullRelations,
} from '../../types/product/product-response.types';

type ProductWhereOptions = {
  is_active?: boolean;
  is_featured?: boolean;
  type?: ProductType;
  seller_id?: number | { [Op.in]: number[] };
  price?: { [Op.gte]?: number; [Op.lte]?: number };
};


interface ProductCreateData {
  discount_price: number | null;
  type: ProductType;
  file_url: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  seller_id: number;
}


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

  private get sequelize() {
    return this.productModel.sequelize!;
  }

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
        { model: ProductTranslation, as: 'translations' },
        { model: ProductLicense },
        { model: Category },
      ],
    });

    if (!product) return null;

    if (product.licenses && product.licenses.length > 0) {
      const prices = product.licenses.map((l) => Number(l.price));
      (product as unknown as ProductWithComputedFields).price = Math.min(...prices);
    } else {
      (product as unknown as ProductWithComputedFields).price = 0;
    }

    if (product.media && product.media.length > 0) {
      const coverMedia = product.media.find((m) => m.is_cover);
      const url = coverMedia?.url;
      (product as unknown as ProductWithComputedFields).main_image = url ? String(url) : '';
    } else {
      (product as unknown as ProductWithComputedFields).main_image = '';
    }

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

  
  async findByIdWithFullRelations(
    id: number,
    language?: string,
  ): Promise<ProductWithFullRelations | null> {
    const normalizedLanguage = language ? normalizeLanguage(language) : undefined;
    const product = await this.productModel.findByPk(id, {
      include: [
        { model: User, as: 'seller', attributes: ['id', 'name', 'avatar_url'] },
        { model: ProductMedia },
        { model: ProductTranslation, as: 'translations' },
        { model: ProductLicense, include: [{ model: LicenseType, include: [LicenseTypeTranslation] }] },
        {
          model: Category,
          include: [
            {
              model: CategoryTranslation,
              ...(normalizedLanguage ? { where: { locale: normalizedLanguage }, required: false } : {}),
            },
          ],
        },
      ],
    });

    if (!product) return null;

    if (product.licenses && product.licenses.length > 0) {
      const prices = product.licenses.map((l) => Number(l.price));
      (product as unknown as ProductWithComputedFields).price = Math.min(
        ...prices,
      );
    } else {
      (product as unknown as ProductWithComputedFields).price = 0;
    }

    if (product.media && product.media.length > 0) {
      const coverMedia = product.media.find((m) => m.is_cover);
      const url = coverMedia?.url;
      (product as unknown as ProductWithComputedFields).main_image = url
        ? String(url)
        : '';
    } else {
      (product as unknown as ProductWithComputedFields).main_image = '';
    }

    return product as unknown as ProductWithFullRelations;
  }

  
  async findAllForList(
    query: ProductQueryParams = {},
  ): Promise<{ rows: ProductWithFullRelations[]; count: number }> {
    const {
      page = 1,
      limit = 10,
      categoryId,
      isActive,
      search,
      type,
      sellerId,
      sellerIds,
      isFeatured,
      minPrice,
      maxPrice,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    const offset = (page - 1) * limit;

    const where: ProductWhereOptions = {};

    const categoryInclude = categoryId
      ? {
          model: Category,
          where: { id: categoryId },
          required: true,
        }
      : { model: Category };

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    if (type) {
      where.type = type;
    }

    if (Array.isArray(sellerIds) && sellerIds.length > 0) {
      where.seller_id = { [Op.in]: sellerIds };
    } else if (sellerId) {
      where.seller_id = sellerId;
    }

    if (isFeatured !== undefined) {
      where.is_featured = isFeatured;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceSubquery = `(SELECT MIN(pl.price) FROM product_licenses pl WHERE pl.product_id = "Product".id)`;
      
      if (minPrice !== undefined) {
        where[Op.and] = where[Op.and] || [];
        (where[Op.and] as unknown[]).push(this.sequelize.literal(`${priceSubquery} >= ${minPrice}`));
      }
      if (maxPrice !== undefined) {
        where[Op.and] = where[Op.and] || [];
        (where[Op.and] as unknown[]).push(this.sequelize.literal(`${priceSubquery} <= ${maxPrice}`));
      }
    }

    let translationWhere: Record<string, unknown> | undefined;
    if (search) {
      translationWhere = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ],
        language: [Language.RUSSIAN, Language.ENGLISH],
      };
    }

    let order: FindOptions<Product>['order'];
    if (sortBy === 'price') {
      const priceSubquery = `(SELECT MIN(pl.price) FROM product_licenses pl WHERE pl.product_id = "Product".id)`;
      order = [[this.sequelize.literal(priceSubquery), sortOrder.toUpperCase() as 'ASC' | 'DESC']];
    } else {
      order = [[sortBy, sortOrder.toUpperCase() as 'ASC' | 'DESC']];
    }

    const result = await this.productModel.findAndCountAll({
      where,
      offset,
      limit,
      distinct: true,
      order,
      include: [
        { model: User, as: 'seller', attributes: ['id', 'name', 'avatar_url'] },
        categoryInclude,
        { model: ProductLicense, include: [{ model: LicenseType, include: [LicenseTypeTranslation] }] },
        {
          model: ProductMedia,
          where: { is_cover: true },
          required: false,
        },
        {
          model: ProductTranslation,
          as: 'translations',
          where: translationWhere,
          required: !!search,
        },
      ],
    });



    const rows = result.rows.map((product): ProductWithFullRelations => {


      if (product.licenses && product.licenses.length > 0) {
        const prices = product.licenses.map((l) => Number(l.price));
        (product as unknown as ProductWithComputedFields).price = Math.min(...prices);
      } else {
        (product as unknown as ProductWithComputedFields).price = 0;
      }

      if (product.media && product.media.length > 0) {
        const coverMedia = product.media.find((m) => m.is_cover);
        (product as unknown as ProductWithComputedFields).main_image = coverMedia ? String(coverMedia.url) : '';
      } else {
        (product as unknown as ProductWithComputedFields).main_image = '';
      }

      return product as unknown as ProductWithFullRelations;
    });

    return {
      rows,
      count: result.count,
    };
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
      sellerIds,
      isFeatured,
      minPrice,
      maxPrice,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    const offset = (page - 1) * limit;

    const where: ProductWhereOptions = {};

    const categoryInclude = categoryId
      ? {
          model: Category,
          where: { id: categoryId },
          required: true,
        }
      : { model: Category };

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    if (type) {
      where.type = type;
    }

    if (Array.isArray(sellerIds) && sellerIds.length > 0) {
      where.seller_id = { [Op.in]: sellerIds };
    } else if (sellerId) {
      where.seller_id = sellerId;
    }

    if (isFeatured !== undefined) {
      where.is_featured = isFeatured;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceSubquery = `(SELECT MIN(pl.price) FROM product_licenses pl WHERE pl.product_id = "Product".id)`;
      
      if (minPrice !== undefined) {
        where[Op.and] = where[Op.and] || [];
        (where[Op.and] as unknown[]).push(this.sequelize.literal(`${priceSubquery} >= ${minPrice}`));
      }
      if (maxPrice !== undefined) {
        where[Op.and] = where[Op.and] || [];
        (where[Op.and] as unknown[]).push(this.sequelize.literal(`${priceSubquery} <= ${maxPrice}`));
      }
    }

    let translationWhere: Record<string, unknown> | undefined;
    if (search) {
      translationWhere = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ],
        language: [Language.RUSSIAN, Language.ENGLISH],
      };
    }

    let order: FindOptions<Product>['order'];
    if (sortBy === 'price') {
      const priceSubquery = `(SELECT MIN(pl.price) FROM product_licenses pl WHERE pl.product_id = "Product".id)`;
      order = [[this.sequelize.literal(priceSubquery), sortOrder.toUpperCase() as 'ASC' | 'DESC']];
    } else {
      order = [[sortBy, sortOrder.toUpperCase() as 'ASC' | 'DESC']];
    }

    const result = await this.productModel.findAndCountAll({
      where,
      offset,
      limit,
      distinct: true,
      order,
      include: [
        categoryInclude,
        { model: ProductMedia },
        { model: ProductLicense },
        {
          model: ProductTranslation,
          as: 'translations',
          where: translationWhere,
          required: !!search,
        },
      ],
    });

    const rows = result.rows.map((product): ProductWithComputedFields => {
      if (product.licenses && product.licenses.length > 0) {
        const prices = product.licenses.map((l) => Number(l.price));
        product.price = Math.min(...prices);
      } else {
        product.price = 0;
      }

      if (product.media && product.media.length > 0) {
        const coverMedia = product.media.find((m) => m.is_cover);
        product.main_image = coverMedia ? String(coverMedia.url) : '';
      } else {
        product.main_image = '';
      }

      return product as ProductWithComputedFields;
    });

    return {
      rows: rows as unknown as ProductWithRelations[],
      count: result.count,
    };
  }

  async create(
    data: CreateProductDto,
    sellerId: number,
  ): Promise<ProductWithRelations> {
    const createData: ProductCreateData = {
      discount_price: data.discountPrice ?? null,
      type: data.type,
      file_url: data.fileUrl ?? '',
      stock: data.stock ?? 0,
      is_active: data.isActive ?? true,
      is_featured: data.isFeatured ?? false,
      seller_id: sellerId,
    };

    const product = await this.productModel.create(createData as any);

    if (data.categoryIds && data.categoryIds.length > 0) {
      for (const categoryId of data.categoryIds) {
        await ProductCategory.create({
          product_id: product.id,
          category_id: categoryId,
        });
      }
    }

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

    const updateData: ProductUpdateData = {};

    if (data.discountPrice !== undefined)
      updateData.discount_price = data.discountPrice;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.fileUrl !== undefined) updateData.file_url = data.fileUrl;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.isFeatured !== undefined) updateData.is_featured = data.isFeatured;

    await product.update(updateData);

    if (data.categoryIds !== undefined) {
      await ProductCategory.destroy({ where: { product_id: id } });
      for (const categoryId of data.categoryIds) {
        await ProductCategory.create({
          product_id: id,
          category_id: categoryId,
        });
      }
    }

    if (data.translations !== undefined) {
      for (const translation of data.translations) {
        const lang = (translation.language as Language) || Language.ENGLISH;
        
        const existingTranslation = await this.productTranslationModel.findOne({
          where: { productId: id, language: lang },
        });
        
        if (existingTranslation) {
          await existingTranslation.update({
            name: translation.name || '',
            description: translation.description || '',
            shortDescription: translation.shortDescription || '',
          });
        } else {
          await this.productTranslationModel.create({
            productId: id,
            name: translation.name || '',
            description: translation.description || '',
            shortDescription: translation.shortDescription || '',
            language: lang,
          } as any);


        }
      }
    }

    return this.findByIdWithRelations(id) as Promise<ProductWithRelations>;
  }

  async delete(id: number): Promise<void> {
    const product = await this.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    this.deleteAllMediaFiles(id);

    await ProductCategory.destroy({ where: { product_id: id } });
    await this.productTranslationModel.destroy({ where: { productId: id } });
    await this.productLicenseModel.destroy({ where: { product_id: id } });
    await this.productMediaModel.destroy({ where: { product_id: id } });

    await product.destroy();
  }

  
  private deleteAllMediaFiles(productId: number): void {
    this.fileService.deleteMediaFolderFiles(MediaFolder.PRODUCT, productId);
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

    if (media.url) {
      this.fileService.deleteFile(media.url);
    }

    await media.destroy();
  }

  async clearMediaCovers(productId: number): Promise<void> {
    await this.productMediaModel.update(
      { is_cover: false },
      { where: { product_id: productId } },
    );
  }

  async setMediaCover(mediaId: number, isCover: boolean): Promise<void> {
    await this.productMediaModel.update(
      { is_cover: isCover },
      { where: { id: mediaId } },
    );
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

  async findLicenseById(licenseId: number): Promise<ProductLicense | null> {
    return this.productLicenseModel.findByPk(licenseId);
  }

  async deleteLicense(licenseId: number): Promise<void> {
    await this.sequelize.transaction(async (t) => {
      const license = await this.productLicenseModel.findByPk(licenseId, { transaction: t });
      if (!license) {
        throw new NotFoundException('License not found');
      }
      await license.destroy({ transaction: t });
    });
  }

  async countLicenses(productId: number): Promise<number> {
    return this.productLicenseModel.count({
      where: { product_id: productId },
    });
  }

  async deleteAllLicenses(productId: number): Promise<void> {
    const usedLicenseIds = await this.sequelize.query(
      `SELECT pl.id FROM product_licenses pl
       INNER JOIN order_items oi ON pl.id = oi.product_license_id
       WHERE pl.product_id = :productId`,
      {
        replacements: { productId },
        type: QueryTypes.SELECT,
      },
    );

    const usedIds = (usedLicenseIds as { id: number }[]).map((row) => row.id);

    if (usedIds.length > 0) {
      await this.productLicenseModel.destroy({
        where: {
          product_id: productId,
          id: { [Op.notIn]: usedIds },
        },
      });
    } else {
      await this.productLicenseModel.destroy({
        where: { product_id: productId },
      });
    }
  }
}


