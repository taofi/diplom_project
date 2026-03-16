import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ProductRepository } from './repositories/product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { AddMediaDto } from './dto/add-media.dto';
import { AddLicenseDto } from './dto/add-license.dto';
import type { MediaInfo, LicenseInfo } from '../types/product';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async findAll(query: ProductQueryDto) {
    // Only return active products for public queries unless user is seller
    if (!query.sellerId) {
      query.isActive = true;
    }

    const result = await this.productRepository.findAndCountAll(query);
    return {
      data: result.rows,
      meta: {
        total: result.count,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(result.count / (query.limit || 10)),
      },
    };
  }

  async findById(id: number) {
    const product = await this.productRepository.findByIdWithRelations(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findMyProducts(sellerId: number, query: ProductQueryDto) {
    query.sellerId = sellerId;
    const result = await this.productRepository.findAndCountAll(query);
    return {
      data: result.rows,
      meta: {
        total: result.count,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(result.count / (query.limit || 10)),
      },
    };
  }

  async create(sellerId: number, createProductDto: CreateProductDto) {
    // Check if SKU already exists
    if (createProductDto.sku) {
      const existingProduct = await this.productRepository.findBySku(
        createProductDto.sku,
      );
      if (existingProduct) {
        throw new ForbiddenException('Product with this SKU already exists');
      }
    }

    // Set seller ID and create product
    const product = await this.productRepository.create(
      createProductDto,
      sellerId,
    );

    return product;
  }

  async update(
    id: number,
    sellerId: number,
    updateProductDto: UpdateProductDto,
  ) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check ownership or admin (admin check would be done via guard)
    if (product.seller_id !== sellerId) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Check if SKU is being changed to an existing one
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findBySku(
        updateProductDto.sku,
      );
      if (existingProduct && existingProduct.id !== id) {
        throw new ForbiddenException('Product with this SKU already exists');
      }
    }

    return this.productRepository.update(id, updateProductDto);
  }

  async delete(id: number, sellerId: number) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check ownership or admin
    if (product.seller_id !== sellerId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.productRepository.delete(id);
  }

  async activate(id: number, sellerId: number) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.seller_id !== sellerId) {
      throw new ForbiddenException('You can only activate your own products');
    }

    await product.update({ is_active: true });
    return product;
  }

  async deactivate(id: number, sellerId: number) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.seller_id !== sellerId) {
      throw new ForbiddenException('You can only deactivate your own products');
    }

    await product.update({ is_active: false });
    return product;
  }

  async addMedia(id: number, sellerId: number, addMediaDto: AddMediaDto) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.seller_id !== sellerId) {
      throw new ForbiddenException(
        'You can only add media to your own products',
      );
    }

    return this.productRepository.addMedia(id, addMediaDto);
  }

  async deleteMedia(id: number, mediaId: number, sellerId: number) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.seller_id !== sellerId) {
      throw new ForbiddenException(
        'You can only delete media from your own products',
      );
    }

    await this.productRepository.deleteMedia(mediaId);
  }

  async addLicense(id: number, sellerId: number, addLicenseDto: AddLicenseDto) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.seller_id !== sellerId) {
      throw new ForbiddenException(
        'You can only add licenses to your own products',
      );
    }

    return this.productRepository.addLicense(
      id,
      addLicenseDto.licenseTypeId,
      addLicenseDto.price,
    );
  }

  async getLicenses(id: number): Promise<LicenseInfo[]> {
    const product = await this.productRepository.findByIdWithRelations(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return (
      product.licenses?.map((l) => ({
        id: l.id,
        licenseTypeId: l.license_type_id,
        price: Number(l.price),
        licenseType: l.license_type
          ? {
              id: l.license_type.id,
              name: l.license_type.slug,
              slug: l.license_type.slug,
            }
          : undefined,
      })) || []
    );
  }

  async getMedia(id: number): Promise<MediaInfo[]> {
    const product = await this.productRepository.findByIdWithRelations(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return (
      product.media?.map((m) => ({
        id: m.id,
        url: m.url,
        mediaType: m.media_type,
        isCover: m.is_cover,
        sortOrder: m.sort_order,
      })) || []
    );
  }
}
