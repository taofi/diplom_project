import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ProductMedia, MediaType } from '../db/models/product-media.model';


@Injectable()
export class ProductMediaService {
  constructor(
    @InjectModel(ProductMedia)
    private readonly productMediaModel: typeof ProductMedia,
  ) {}

  
  async setMediaAsCover(productId: number, mediaId: number): Promise<ProductMedia> {
    const media = await this.productMediaModel.findOne({
      where: { id: mediaId, product_id: productId },
    });

    if (!media) {
      throw new NotFoundException(
        `Media with ID ${mediaId} not found for product ${productId}`,
      );
    }

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

  
  async updateMediaCovers(
    productId: number,
    updates: { id: number; isCover?: boolean }[],
  ): Promise<void> {
    if (!updates || updates.length === 0) return;

    const allMedia = await this.productMediaModel.findAll({
      where: { product_id: productId },
    });

    const hasNewCover = updates.some((u) => u.isCover === true);

    if (hasNewCover) {
      await this.productMediaModel.update(
        { is_cover: false },
        { where: { product_id: productId } },
      );
    }

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

  
  async deleteMediaBatch(productId: number, mediaIds: number[]): Promise<void> {
    if (!mediaIds || mediaIds.length === 0) return;

    await this.productMediaModel.destroy({
      where: {
        id: { [Op.in]: mediaIds },
        product_id: productId,
      },
    });
  }

  
  async getMediaByProduct(productId: number): Promise<ProductMedia[]> {
    return this.productMediaModel.findAll({
      where: { product_id: productId },
    });
  }

  
  async findById(mediaId: number): Promise<ProductMedia | null> {
    return this.productMediaModel.findByPk(mediaId);
  }
}


