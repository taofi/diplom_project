import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatOffer, ChatOfferStatus } from '../../db/models/chat-offer.model';
import { FindOptions, FindAndCountOptions } from 'sequelize';
import { Op } from 'sequelize';

interface ChatOfferQuery {
  page?: number;
  limit?: number;
  chatRoomId?: number;
  sellerId?: number;
  status?: ChatOfferStatus;
}

type ChatOfferWhereOptions = FindOptions['where'] & {
  chat_room_id?: number;
  seller_id?: number;
  status?: ChatOfferStatus;
};

@Injectable()
export class ChatOfferRepository {
  constructor(
    @InjectModel(ChatOffer)
    private readonly chatOfferModel: typeof ChatOffer,
  ) {}

  async findAll(options?: FindOptions): Promise<ChatOffer[]> {
    return this.chatOfferModel.findAll(options);
  }

  async findById(
    id: number,
    options?: FindOptions,
  ): Promise<ChatOffer | null> {
    return this.chatOfferModel.findByPk(id, options);
  }

  async findByChatRoomId(
    chatRoomId: number,
    options?: FindOptions,
  ): Promise<ChatOffer[]> {
    return this.chatOfferModel.findAll({
      where: { chat_room_id: chatRoomId },
      ...options,
    });
  }

  async findBySellerId(
    sellerId: number,
    options?: FindOptions,
  ): Promise<ChatOffer[]> {
    return this.chatOfferModel.findAll({
      where: { seller_id: sellerId },
      ...options,
    });
  }

  async findPendingByChatRoomId(chatRoomId: number): Promise<ChatOffer[]> {
    return this.chatOfferModel.findAll({
      where: {
        chat_room_id: chatRoomId,
        status: ChatOfferStatus.PENDING,
      },
    });
  }

  async findAndCountAll(
    query: ChatOfferQuery = {},
  ): Promise<{ rows: ChatOffer[]; count: number }> {
    const { page = 1, limit = 10, chatRoomId, sellerId, status } = query;
    const offset = (page - 1) * limit;

    const where: ChatOfferWhereOptions = {};

    if (chatRoomId) {
      where.chat_room_id = chatRoomId;
    }

    if (sellerId) {
      where.seller_id = sellerId;
    }

    if (status) {
      where.status = status;
    }

    const options: FindAndCountOptions = {
      where,
      offset,
      limit,
      order: [['created_at', 'DESC']],
    };

    return this.chatOfferModel.findAndCountAll(options);
  }

  async create(data: Partial<ChatOffer>): Promise<ChatOffer> {
    return this.chatOfferModel.create(data as any);
  }

  async update(
    id: number,
    data: Partial<ChatOffer>,
  ): Promise<ChatOffer> {
    const chatOffer = await this.findById(id);
    if (!chatOffer) {
      throw new NotFoundException('Chat offer not found');
    }

    return chatOffer.update(data as any);
  }

  async updateStatus(
    id: number,
    status: ChatOfferStatus,
  ): Promise<ChatOffer> {
    const chatOffer = await this.findById(id);
    if (!chatOffer) {
      throw new NotFoundException('Chat offer not found');
    }

    return chatOffer.update({
      status,
      responded_at: new Date(),
    } as any);
  }

  async delete(id: number): Promise<void> {
    const chatOffer = await this.findById(id);
    if (!chatOffer) {
      throw new NotFoundException('Chat offer not found');
    }

    await chatOffer.destroy();
  }
}
