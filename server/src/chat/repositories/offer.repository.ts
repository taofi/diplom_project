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

  async setFiles(
    id: number,
    previewUrl: string,
    sourceFilesUrls: string[],
  ): Promise<Offer> {
    const offer = await this.findById(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    offer.preview_url = previewUrl;
    offer.source_files_urls = JSON.stringify(sourceFilesUrls);
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
}