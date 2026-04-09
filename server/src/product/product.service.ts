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
import { ProductMediaService } from './product-media.service';
import type { MediaInfo, LicenseInfo } from '../types/product';
import { MediaType } from '../db/models/product-media.model';
import {
  createProductListItemResponse,
  createProductDetailResponse,
  ProductListItemResponse,
  ProductDetailResponse,
} from '../types/product/product-response.types';

// Тип для результата обработки временных файлов
interface ProcessedFilesResult {
  fileUrl: string | null;
  mediaData: { url: string; isCover: boolean; mediaType: MediaType }[];
}

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly uploadsService: UploadsService,
    private readonly productMediaService: ProductMediaService,
  ) {}

  /**
   * Обработать временные файлы и переместить их в постоянное хранилище
   * @param sellerId - ID продавца
   * @param productId - ID продукта
   * @param dto - DTO с временными файлами (tempFileUrl, tempMediaUrls, fileUrl)
   * @returns информация о перемещенных файлах
   */
  private processTempFiles(
    sellerId: number,
    productId: number,
    dto: { tempFileUrl?: string; tempMediaUrls?: { url: string; isCover?: boolean }[]; fileUrl?: string },
  ): ProcessedFilesResult {
    // 1. Проверить наличие временных файлов
    const isTempFileUrl = dto.tempFileUrl || dto.fileUrl?.includes('/temp/');
    const hasTempMedia = dto.tempMediaUrls && dto.tempMediaUrls.length > 0;

    if (!isTempFileUrl && !hasTempMedia) {
      return { fileUrl: null, mediaData: [] };
    }

    // 2. Определить tempFileUrl
    const tempFileUrl = dto.tempFileUrl || (dto.fileUrl?.includes('/temp/') ? dto.fileUrl : undefined);

    // 3. Извлечь массив URL из tempMediaUrls
    const tempMediaUrls = dto.tempMediaUrls?.map((m) => m.url) || [];

    // Processing temp files

    // 4. Переместить файлы
    const movedFiles = this.uploadsService.moveProductFiles(
      sellerId,
      productId,
      tempFileUrl,
      tempMediaUrls,
    );

    // 5. Определить информацию об обложке из входных данных
    // Проверяем, была ли информация об isCover во входных данных
    const hasCoverInfo = dto.tempMediaUrls && dto.tempMediaUrls.some((m) => m.isCover !== undefined);

    // 6. Создать массив mediaData с определением isCover
    const mediaData: { url: string; isCover: boolean; mediaType: MediaType }[] =
      movedFiles.media.map((media, index) => {
      const mediaType = media.mimeType.startsWith('video/')
        ? MediaType.VIDEO
        : MediaType.IMAGE;
      // Если есть явная информация об обложке - используем её
      if (hasCoverInfo) {
        const originalMedia = dto.tempMediaUrls?.[index];
        return {
          url: media.url,
          isCover: (originalMedia?.isCover ?? false) && mediaType === MediaType.IMAGE,
          mediaType,
        };
      }
      
      // Если нет информации об isCover - первое медиа становится обложкой по умолчанию
      return { url: media.url, isCover: index === 0 && mediaType === MediaType.IMAGE, mediaType };
    });

    // Files processed

    return {
      fileUrl: movedFiles.file?.url || null,
      mediaData,
    };
  }

  async findAll(query: ProductQueryDto): Promise<{
    data: ProductListItemResponse[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    // DEBUG: Логирование языка
    
    // Only return active products for public queries unless user is seller
    // Но если isActive явно передан в запросе - используем его значение
    if (query.sellerId || (Array.isArray(query.sellerIds) && query.sellerIds.length > 0)) {
      query.isActive = true;
    } else if (query.isActive === undefined) {
      query.isActive = true;
    }

    // Используем оптимизированный метод для списка (без media массива)
    const result = await this.productRepository.findAllForList(query);
    

    
    // Передаем язык для получения name и description из translations
    return {
      data: result.rows.map((p) => createProductListItemResponse(p, query.language)),
      meta: {
        total: result.count,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(result.count / (query.limit || 10)),
      },
    };
  }

  async findById(id: number, language?: string): Promise<ProductDetailResponse> {
    // Используем полный метод с отношениями для детального просмотра
    const product = await this.productRepository.findByIdWithFullRelations(id, language);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    

    
    // Применяем перевод для указанного языка
    // name и description теперь берутся из translations в createProductDetailResponse
    
    // Передаем язык для получения name и description из translations
    return createProductDetailResponse(product, language);
  }

  /**
   * Получить товар со всеми переводами для админ-панели
   */
  async findByIdWithAllTranslations(id: number): Promise<ProductDetailResponse> {
    const product = await this.productRepository.findByIdWithFullRelations(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    // Возвращаем продукт со всеми переводами - они уже включены в response
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
    // Передаем язык для получения name и description из translations
    return {
      data: result.rows.map((p) => createProductListItemResponse(p, query.language)),
      meta: {
        total: result.count,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(result.count / (query.limit || 10)),
      },
    };
  }

  async create(sellerId: number, createProductDto: CreateProductDto) {
    // Creating product
    // SKU удален - больше не проверяем уникальность

    // Определяем fileUrl для создания продукта
    const fileUrl = createProductDto.tempFileUrl || createProductDto.fileUrl;

    if (!fileUrl) {
      throw new BadRequestException('File URL or temp file URL is required');
    }

    // Создаем продукт с временным URL файла
    // Убираем tempMediaUrls и tempFileUrl из объекта для репозитория
     
    const { tempMediaUrls: _tempM, tempFileUrl: _tempF, ...createData } = createProductDto;
    void _tempM; void _tempF;
    const product = await this.productRepository.create(
      {
        ...createData,
        fileUrl: fileUrl,
      },
      sellerId,
    );

    // Обрабатываем временные файлы с помощью унифицированной функции
    const processedFiles = this.processTempFiles(
      sellerId,
      product.id,
      createProductDto,
    );

    // Обновить file_url если файл был перемещен
    if (processedFiles.fileUrl) {
      await this.productRepository.update(product.id, {
        fileUrl: processedFiles.fileUrl,
      });
    }

    // Создать записи в product_media для перемещенных медиа
    for (const media of processedFiles.mediaData) {
      await this.productRepository.addMedia(product.id, {
        url: media.url,
        mediaType: media.mediaType,
        isCover: media.isCover,
      });
    }

    return this.findById(product.id);
  }

  async update(
    id: number,
    userId: number,
    isAdmin: boolean,
    updateProductDto: UpdateProductDto,
  ) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check ownership or admin
    if (!isAdmin && product.seller_id !== userId) {
      throw new ForbiddenException('You can only update your own products');
    }

    // SKU удален - больше не проверяем уникальность

    // Обрабатываем временные файлы с помощью унифицированной функции
    const processedFiles = this.processTempFiles(
      userId,
      id,
      updateProductDto,
    );

    // Обновить file_url если файл был перемещен
    if (processedFiles.fileUrl) {
      updateProductDto.fileUrl = processedFiles.fileUrl;
    }

    // Если добавляются новые медиа - обрабатываем обложки
    if (processedFiles.mediaData.length > 0) {
      // Проверяем, есть ли среди новых медиа хотя бы одна обложка
      const hasNewCover = processedFiles.mediaData.some((m) => m.isCover);
      
      // Если есть новая обложка - сбрасываем все существующие обложки
      if (hasNewCover) {
        await this.productRepository.clearMediaCovers(id);
      }
      
      // Создать записи в product_media для перемещенных медиа
      for (const media of processedFiles.mediaData) {
        await this.productRepository.addMedia(id, {
          url: media.url,
          mediaType: media.mediaType,
          isCover: media.isCover,
        });
      }
    }

    // Обработка обновления isCover для существующих медиа
    if (updateProductDto.updatedMedia && updateProductDto.updatedMedia.length > 0) {
      await this.productMediaService.updateMediaCovers(id, updateProductDto.updatedMedia);
    }

    // Обработка удаления медиа
    if (updateProductDto.deletedMediaIds && updateProductDto.deletedMediaIds.length > 0) {
      await this.productMediaService.deleteMediaBatch(id, updateProductDto.deletedMediaIds);
    }

    // Обработка лицензий
    if (updateProductDto.licenses && updateProductDto.licenses.length > 0) {
      // Удаляем старые лицензии и добавляем новые
      await this.productRepository.deleteAllLicenses(id);
      for (const license of updateProductDto.licenses) {
        await this.productRepository.addLicense(id, license.licenseTypeId, license.price);
      }
    }

    // Убираем tempMediaUrls и tempFileUrl из DTO перед сохранением в репозиторий
     
    const { tempMediaUrls: _dm, tempFileUrl: _df, updatedMedia: _um, deletedMediaIds: _dmi, licenses: _lic, ...cleanDto } = updateProductDto as UpdateProductDto & { tempMediaUrls?: { url: string; isCover?: boolean }[]; tempFileUrl?: string; updatedMedia?: { id: number; isCover?: boolean }[]; deletedMediaIds?: number[]; licenses?: { licenseTypeId: number; price: number }[] };
    void _dm; void _df; void _um; void _dmi; void _lic;

    return this.productRepository.update(id, cleanDto as UpdateProductDto);
  }

  async delete(id: number, userId: number, isAdmin: boolean) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check ownership or admin
    if (!isAdmin && product.seller_id !== userId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.productRepository.delete(id);
  }

  async activate(id: number, userId: number, isAdmin: boolean) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (!isAdmin && product.seller_id !== userId) {
      throw new ForbiddenException('You can only activate your own products');
    }

    await product.update({ is_active: true });
    return product;
  }

  async deactivate(id: number, userId: number, isAdmin: boolean) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (!isAdmin && product.seller_id !== userId) {
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

    if (
      addMediaDto.isCover &&
      addMediaDto.mediaType &&
      addMediaDto.mediaType !== MediaType.IMAGE
    ) {
      throw new BadRequestException('Cover media must be an image');
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
      product.licenses?.map((l) => {
        let licenseName = '';
        if (l.license_type?.translations && l.license_type.translations.length > 0) {
          licenseName = l.license_type.translations[0]?.name || '';
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
      }) || []
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

    const media = await this.productMediaService.findById(mediaId);
    if (!media || media.product_id !== id) {
      throw new NotFoundException(`Media with ID ${mediaId} not found for this product`);
    }
    if (media.media_type !== MediaType.IMAGE) {
      throw new BadRequestException('Cover media must be an image');
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
