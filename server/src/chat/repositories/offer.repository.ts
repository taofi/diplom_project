import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Offer, OfferStatus } from '../../db/models/offer.model';
import { Op } from 'sequelize';

@Injectable()
export class OfferRepository {
  constructor(
    @InjectModel(Offer)
    private offerModel: typeof Offer,
  ) {}

  async create(data: Partial<Offer>): Promise<Offer> {
    return this.offerModel.create(data);
  }

  async findById(id: number): Promise<Offer | null> {
    return this.offerModel.findByPk(id, {
      include: ['chat_room', 'creator', 'author'],
    });
  }

  async findByChatRoom(chatRoomId: number): Promise<Offer[]> {
    return this.offerModel.findAll({
      where: { chat_room_id: chatRoomId },
      include: ['creator', 'author'],
      order: [['created_at', 'DESC']],
    });
  }

  async findActiveByUser(userId: number): Promise<Offer[]> {
    return this.offerModel.findAll({
      where: {
        [Op.or]: [
          { creator_id: userId },
          { author_id: userId },
        ],
        status: {
          [Op.notIn]: [OfferStatus.REJECTED, OfferStatus.COMPLETED],
        },
      },
      include: ['chat_room', 'creator', 'author'],
    });
  }

  /**
   * Найти все заказы пользователя (включая завершённые)
   * Используется для страницы заказов
   */
  async findAllByUser(userId: number): Promise<Offer[]> {
    return this.offerModel.findAll({
      where: {
        [Op.or]: [
          { creator_id: userId },
          { author_id: userId },
        ],
      },
      include: ['chat_room', 'creator', 'author'],
      order: [['created_at', 'DESC']],
    });
  }

  async updateStatus(id: number, status: OfferStatus): Promise<Offer> {
    const offer = await this.findById(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    offer.status = status;
    await offer.save();
    return offer;
  }

  async updatePrice(id: number, newPrice: number, originalPrice: number): Promise<Offer> {
    const offer = await this.findById(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    offer.price = newPrice;
    offer.original_price = originalPrice;
    await offer.save();
    return offer;
  }

  async updatePriceOnly(id: number, price: number): Promise<Offer> {
    const offer = await this.findById(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    offer.price = price;
    await offer.save();
    return offer;
  }

  async setFiles(
    id: number,
    authorImageUrls: string[],
    authorFileUrl: string | null,
  ): Promise<Offer> {
    const offer = await this.findById(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    offer.preview_url = authorImageUrls[0] ?? null;
    offer.author_images_urls = JSON.stringify(authorImageUrls);
    offer.author_file_url = authorFileUrl;
    offer.source_files_urls = JSON.stringify(authorFileUrl ? [authorFileUrl] : []);
    await offer.save();
    return offer;
  }

  async setCreatorAttachments(
    id: number,
    attachmentUrls: string[],
  ): Promise<Offer> {
    const offer = await this.findById(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    offer.creator_attachments_urls = JSON.stringify(attachmentUrls);
    await offer.save();
    return offer;
  }

  async markAsPaid(id: number): Promise<Offer> {
    const offer = await this.findById(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    offer.is_paid = true;
    offer.paid_at = new Date();
    offer.status = OfferStatus.COMPLETED;
    await offer.save();
    return offer;
  }

  async findByIdOrFail(id: number): Promise<Offer> {
    const offer = await this.findById(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return offer;
  }
}