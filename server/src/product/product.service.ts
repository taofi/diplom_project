import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ProductRepository } from './repositories/product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { AddMediaDto } from './dto/add-media.dto';
import { AddLicenseDto } from './dto/add-license.dto';
import { UploadsService } from '../uploads/uploads.service';
import type { MediaInfo, LicenseInfo } from '../types/product';
import {
  createProductListItemResponse,
  createProductDetailResponse,
  ProductListItemResponse,
  ProductDetailResponse,
} from '../types/product/product-response.types';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly uploadsService: UploadsService,
  ) {}

  async findAll(query: ProductQueryDto): Promise<{
    data: ProductListItemResponse[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    // Only return active products for public queries unless user is seller
    // Но если isActive явно передан в запросе - используем его значение
    if (query.isActive === undefined && !query.sellerId) {
      query.isActive = true;
    }

    // Используем оптимизированный метод для списка (без media массива)
    const result = await this.productRepository.findAllForList(query);
    return {
      data: result.rows.map(createProductListItemResponse),
      meta: {
        total: result.count,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(result.count / (query.limit || 10)),
      },
    };
  }

  async findById(id: number): Promise<ProductDetailResponse> {
    // Используем полный метод с отношениями для детального просмотра
    const product = await this.productRepository.findByIdWithFullRelations(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return createProductDetailResponse(product);
  }

  async findMyProducts(
    sellerId: number,
    query: ProductQueryDto,
  ): Promise<{
    data: ProductListItemResponse[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    query.sellerId = sellerId;
    // Используем оптимизированный метод для списка
    const result = await this.productRepository.findAllForList(query);
    return {
      data: result.rows.map(createProductListItemResponse),
      meta: {
        total: result.count,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(result.count / (query.limit || 10)),
      },
    };
  }

  async create(sellerId: number, createProductDto: CreateProductDto) {
    // DEBUG: Логирование для отладки создания товара
    console.log('[DEBUG create product] sellerId:', sellerId);
    console.log('[DEBUG create product] dto:', JSON.stringify(createProductDto, null, 2));
    
    // Check if SKU already exists
    if (createProductDto.sku) {
      const existingProduct = await this.productRepository.findBySku(
        createProductDto.sku,
      );
      if (existingProduct) {
        throw new ForbiddenException('Product with this SKU already exists');
      }
    }

    // Проверяем, есть ли временные файлы для перемещения
    // Поддерживаем два варианта:
    // 1. Явные поля tempFileUrl и tempMediaUrls
    // 2. fileUrl содержит /temp/ - значит это временный файл
    const isTempFileUrl =
      createProductDto.fileUrl?.includes('/temp/') ||
      createProductDto.tempFileUrl;
    const hasTempMedia =
      createProductDto.tempMediaUrls &&
      createProductDto.tempMediaUrls.length > 0;
    const hasTempFiles = isTempFileUrl || hasTempMedia;

    // Определяем fileUrl для создания продукта
    const fileUrl = createProductDto.tempFileUrl || createProductDto.fileUrl;
    
    if (!fileUrl) {
      throw new BadRequestException('File URL or temp file URL is required');
    }

    // Создаем продукт с временным URL файла
    // Убираем tempMediaUrls из объекта для репозитория
    const { tempMediaUrls: _tempMediaUrls, ...createData } =
      createProductDto as any;
    const product = await this.productRepository.create(
      {
        ...createData,
        fileUrl: fileUrl,
      },
      sellerId,
    );

    // Если есть временные файлы - перемещаем их
    // Определяем какой URL передавать - если fileUrl содержит /temp/, используем его
    const tempFileUrl =
      createProductDto.tempFileUrl ||
      (createProductDto.fileUrl?.includes('/temp/')
        ? createProductDto.fileUrl
        : undefined);
    
    // tempMediaUrls уже массив объектов { url, isCover } - извлекаем только URL
    const tempMediaUrls = createProductDto.tempMediaUrls?.map((m) => m.url);
    
    if (hasTempFiles) {
      console.log('[DEBUG] Has temp files, moving...');
      console.log('[DEBUG] tempFileUrl:', tempFileUrl);
      console.log('[DEBUG] tempMediaUrls:', tempMediaUrls);
      // Переместить файлы из temp в permanent
      const movedFiles = this.uploadsService.moveProductFiles(
        sellerId,
        product.id,
        tempFileUrl,
        tempMediaUrls,
      );
      console.log('[DEBUG] movedFiles:', JSON.stringify(movedFiles, null, 2));

      // Обновить file_url если был перемещен
      if (movedFiles.file) {
        await this.productRepository.update(product.id, {
          fileUrl: movedFiles.file.url,
        });
      }

      // Создать записи в product_media для перемещенных медиа
      console.log('[DEBUG] Adding media, count:', movedFiles.media.length);
      
      // Определяем какой файл является обложкой
      // Если во входных данных была информация об isCover - используем её
      let coverFilename: string | undefined;
      if (createProductDto.tempMediaUrls) {
        const coverItem = createProductDto.tempMediaUrls.find((m) => m.isCover);
        if (coverItem) {
          // Извлекаем только имя файла из URL
          coverFilename = coverItem.url.split('/').pop();
        }
      }
      console.log('[DEBUG] coverFilename:', coverFilename);
      
      for (const media of movedFiles.media) {
        // Определяем isCover: либо из входных данных, либо первое медиа
        // Сравниваем по имени файла
        const mediaFilename = media.url.split('/').pop();
        const isCover = coverFilename 
          ? mediaFilename?.includes(coverFilename.split('/').pop() || '') 
          : movedFiles.media[0]?.url === media.url;
        console.log('[DEBUG] Adding media:', media.url, 'isCover:', isCover);
        await this.productRepository.addMedia(product.id, {
          url: media.url,
          mediaType: 'image', // По умолчанию
          isCover: isCover,
        });
      }
    }

    return this.findById(product.id);
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

  async deleteLicense(id: number, licenseId: number, sellerId: number): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.seller_id !== sellerId) {
      throw new ForbiddenException(
        'You can only delete licenses from your own products',
      );
    }

    // Check if license exists
    const license = await this.productRepository.findLicenseById(licenseId);
    if (!license || license.product_id !== id) {
      throw new NotFoundException(`License not found for this product`);
    }

    // Check if this is the last license - cannot delete the last license
    const licenseCount = await this.productRepository.countLicenses(id);
    if (licenseCount <= 1) {
      throw new BadRequestException(
        'Cannot delete the last license. Product must have at least one license.',
      );
    }

    await this.productRepository.deleteLicense(licenseId);
  }

  async setMediaAsCover(id: number, mediaId: number, sellerId: number) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.seller_id !== sellerId) {
      throw new ForbiddenException(
        'You can only set cover for your own products media',
      );
    }

    // Сначала сбрасываем все is_cover для этого продукта
    await this.productRepository.clearMediaCovers(id);
    
    // Устанавливаем указанное медиа как cover
    await this.productRepository.setMediaCover(mediaId, true);
    
    return this.getMedia(id);
  }

  async updateFile(id: number, sellerId: number, fileUrl: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.seller_id !== sellerId) {
      throw new ForbiddenException(
        'You can only update file for your own products',
      );
    }

    // Если был старый файл - удаляем его
    if (product.file_url) {
      // Можно добавить логику удаления старого файла
    }

    return this.productRepository.update(id, { fileUrl });
  }

  async deleteFile(id: number, sellerId: number) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.seller_id !== sellerId) {
      throw new ForbiddenException(
        'You can only delete file from your own products',
      );
    }

    // Удаляем файл с диска если нужно
    // Можно добавить логику удаления файла

    return this.productRepository.update(id, { fileUrl: '' });
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
