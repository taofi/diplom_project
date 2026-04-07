import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ProductMedia, MediaType } from '../db/models/product-media.model';

/**
 * Сервис для работы с медиа файлами продуктов
 * Содержит вспомогательные функции для управления медиа
 */
@Injectable()
export class ProductMediaService {
  constructor(
    @InjectModel(ProductMedia)
    private readonly productMediaModel: typeof ProductMedia,
  ) {}

  /**
   * Установить медиа как обложку продукта
   * При установке - сбрасывает isCover у всех остальных медиа этого продукта
   */
  async setMediaAsCover(productId: number, mediaId: number): Promise<ProductMedia> {
    const media = await this.productMediaModel.findOne({
      where: { id: mediaId, product_id: productId },
    });

    if (!media) {
      throw new NotFoundException(
        `Media with ID ${mediaId} not found for product ${productId}`,
      );
    }

    // Сбросить все обложки и установить новую
    await this.productMediaModel.update(
      { is_cover: false },
      { where: { product_id: productId } },
    );

    await this.productMediaModel.update(
      { is_cover: true },
      { where: { id: mediaId } },
    );

    return this.productMediaModel.findByPk(mediaId) as Promise<ProductMedia>;
  }

  /**
   * Обновить isCover для массива медиа
   * Если устанавливается isCover=true для одного, сбрасывается у остальных
   */
  async updateMediaCovers(
    productId: number,
    updates: { id: number; isCover?: boolean }[],
  ): Promise<void> {
    if (!updates || updates.length === 0) return;

    // Найти все медиа для продукта
    const allMedia = await this.productMediaModel.findAll({
      where: { product_id: productId },
    });

    // Проверить, есть ли хотя бы одно isCover=true в updates
    const hasNewCover = updates.some((u) => u.isCover === true);

    // Если есть новая обложка - сбрасываем все существующие
    if (hasNewCover) {
      await this.productMediaModel.update(
        { is_cover: false },
        { where: { product_id: productId } },
      );
    }

    // Обновить указанные медиа
    for (const update of updates) {
      const media = allMedia.find((m) => m.id === update.id);
      if (media) {
        if (update.isCover === true && media.media_type !== MediaType.IMAGE) {
          throw new BadRequestException('Cover media must be an image');
        }
        await this.productMediaModel.update(
          { is_cover: update.isCover ?? media.is_cover },
          { where: { id: update.id } },
        );
      }
    }
  }

  /**
   * Удалить медиа по ID
   */
  async deleteMedia(productId: number, mediaId: number): Promise<void> {
    const media = await this.productMediaModel.findOne({
      where: { id: mediaId, product_id: productId },
    });

    if (!media) {
      throw new NotFoundException(
        `Media with ID ${mediaId} not found for product ${productId}`,
      );
    }

    await this.productMediaModel.destroy({ where: { id: mediaId } });
  }

  /**
   * Удалить массив медиа
   */
  async deleteMediaBatch(productId: number, mediaIds: number[]): Promise<void> {
    if (!mediaIds || mediaIds.length === 0) return;

    await this.productMediaModel.destroy({
      where: {
        id: { [Op.in]: mediaIds },
        product_id: productId,
      },
    });
  }

  /**
   * Получить все медиа продукта
   */
  async getMediaByProduct(productId: number): Promise<ProductMedia[]> {
    return this.productMediaModel.findAll({
      where: { product_id: productId },
    });
  }

  /**
   * Найти медиа по ID
   */
  async findById(mediaId: number): Promise<ProductMedia | null> {
    return this.productMediaModel.findByPk(mediaId);
  }
}
