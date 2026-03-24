import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatRoom, ChatRoomStatus, ChatRoomVisibility } from '../../db/models/chat-room.model';
import { FindOptions, FindAndCountOptions } from 'sequelize';
import { Op } from 'sequelize';
import { CreateChatRoomDto } from '../dto/create-chat-room.dto';
import { User } from '../../db/models/user.model';
import { Product } from '../../db/models/product.model';
import { ProductMedia } from '../../db/models/product-media.model';
import { ProductTranslation } from '../../db/models/product-translation.model';
import { UserProduct } from '../../db/models/user-product.model';
import { ProductLicense } from '../../db/models/product-license.model';
import { LicenseType } from '../../db/models/license-type.model';

interface ChatRoomQuery {
  page?: number;
  limit?: number;
  userId?: number;
  productId?: number;
  status?: ChatRoomStatus;
}

type ChatRoomWhereOptions = FindOptions['where'] & {
  product_id?: number;
  status?: ChatRoomStatus;
  [Op.or]?: Array<{
    buyer_id?: number;
    seller_id?: number;
  }>;
};

@Injectable()
export class ChatRoomRepository {
  constructor(
    @InjectModel(ChatRoom)
    private readonly chatRoomModel: typeof ChatRoom,
  ) {}

  async findAll(options?: FindOptions): Promise<ChatRoom[]> {
    return this.chatRoomModel.findAll(options);
  }

  async findById(id: number, options?: FindOptions): Promise<ChatRoom | null> {
    return this.chatRoomModel.findByPk(id, options);
  }

  async findByUserId(
    userId: number,
    options?: FindOptions,
  ): Promise<ChatRoom[]> {
    return this.chatRoomModel.findAll({
      where: {
        [Op.or]: [{ buyer_id: userId }, { seller_id: userId }],
      },
      ...options,
    });
  }

  /**
   * Find all visible chat rooms for a user (for chat list display)
   * Only returns chats where visibility is VISIBLE
   * Includes: buyer, seller, product with translations and cover media
   */
  async findVisibleByUserId(
    userId: number,
    options?: FindOptions,
  ): Promise<ChatRoom[]> {
    return this.chatRoomModel.findAll({
      where: {
        [Op.or]: [{ buyer_id: userId }, { seller_id: userId }],
        visibility: ChatRoomVisibility.VISIBLE,
      },
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'seller', attributes: ['id', 'name', 'avatar_url'] },
        {
          model: Product,
          as: 'product',
          include: [
            { model: ProductTranslation, as: 'translations' },
            {
              model: ProductMedia,
              where: { is_cover: true },
              required: false,
              attributes: ['id', 'url', 'is_cover'],
            },
          ],
        },
        // Добавляем UserProduct для получения данных о лицензии и цене
        {
          model: UserProduct,
          as: 'user_product',
          include: [
            {
              model: ProductLicense,
              include: [LicenseType],
            },
          ],
          required: false,
        },
      ],
      ...options,
    });
  }

  /**
   * Find pending chat rooms for a user (created by other user, waiting for first message)
   * Used to check if a pending chat exists when creating a new one
   */
  async findPendingByUserId(
    userId: number,
    options?: FindOptions,
  ): Promise<ChatRoom[]> {
    return this.chatRoomModel.findAll({
      where: {
        [Op.or]: [
          { buyer_id: userId, visibility: ChatRoomVisibility.PENDING },
          { seller_id: userId, visibility: ChatRoomVisibility.PENDING },
        ],
      },
      ...options,
    });
  }

  /**
   * Find a specific pending chat by buyer and seller/product
   */
  async findPendingByParticipants(
    buyerId: number,
    sellerId: number,
    productId?: number,
  ): Promise<ChatRoom | null> {
    return this.chatRoomModel.findOne({
      where: {
        buyer_id: buyerId,
        seller_id: sellerId,
        ...(productId && { product_id: productId }),
        visibility: ChatRoomVisibility.PENDING,
      },
    });
  }

  /**
   * Update chat room visibility to VISIBLE
   */
  async makeVisible(id: number): Promise<ChatRoom> {
    const chatRoom = await this.findById(id);
    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }
    return chatRoom.update({ visibility: ChatRoomVisibility.VISIBLE });
  }

  async findByProductId(
    productId: number,
    options?: FindOptions,
  ): Promise<ChatRoom[]> {
    return this.chatRoomModel.findAll({
      where: { product_id: productId },
      ...options,
    });
  }

  async findAndCountAll(
    query: ChatRoomQuery = {},
  ): Promise<{ rows: ChatRoom[]; count: number }> {
    const { page = 1, limit = 10, userId, productId, status } = query;
    const offset = (page - 1) * limit;

    const where: ChatRoomWhereOptions = {};

    if (userId) {
      where[Op.or] = [{ buyer_id: userId }, { seller_id: userId }];
    }

    if (productId) {
      where.product_id = productId;
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

    return this.chatRoomModel.findAndCountAll(options);
  }

  async create(data: CreateChatRoomDto): Promise<ChatRoom> {
    // Маппим camelCase в snake_case для Sequelize
    return this.chatRoomModel.create({
      buyer_id: data.buyerId,
      seller_id: data.sellerId,
      product_id: data.productId,
      user_product_id: data.userProductId,
      status: data.status,
      visibility: data.visibility,
      subject: data.subject,
    });
  }

  async update(
    id: number,
    data: Partial<CreateChatRoomDto>,
  ): Promise<ChatRoom> {
    const chatRoom = await this.findById(id);
    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    return chatRoom.update(data as any);
  }

  async delete(id: number): Promise<void> {
    const chatRoom = await this.findById(id);
    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    await chatRoom.destroy();
  }
}
