import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatRoom, ChatRoomStatus } from '../../db/models/chat-room.model';
import { FindOptions, FindAndCountOptions } from 'sequelize';
import { Op } from 'sequelize';
import { CreateChatRoomDto } from '../dto/create-chat-room.dto';

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
    return this.chatRoomModel.create(data as any);
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
