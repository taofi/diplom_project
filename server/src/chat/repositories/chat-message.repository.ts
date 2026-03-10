import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatMessage, MessageType } from '../../db/models/chat-message.model';
import { FindOptions, FindAndCountOptions } from 'sequelize';
import { CreateChatMessageDto } from '../dto/create-chat-message.dto';

interface ChatMessageQuery {
  page?: number;
  limit?: number;
  chatRoomId?: number;
  senderId?: number;
  type?: MessageType;
}

type ChatMessageWhereOptions = FindOptions['where'] & {
  chat_room_id?: number;
  sender_id?: number;
  message_type?: MessageType;
};

@Injectable()
export class ChatMessageRepository {
  constructor(
    @InjectModel(ChatMessage)
    private readonly chatMessageModel: typeof ChatMessage,
  ) {}

  async findAll(options?: FindOptions): Promise<ChatMessage[]> {
    return this.chatMessageModel.findAll(options);
  }

  async findById(
    id: number,
    options?: FindOptions,
  ): Promise<ChatMessage | null> {
    return this.chatMessageModel.findByPk(id, options);
  }

  async findByChatRoomId(
    chatRoomId: number,
    options?: FindOptions,
  ): Promise<ChatMessage[]> {
    return this.chatMessageModel.findAll({
      where: { chat_room_id: chatRoomId },
      ...options,
    });
  }

  async findBySenderId(
    senderId: number,
    options?: FindOptions,
  ): Promise<ChatMessage[]> {
    return this.chatMessageModel.findAll({
      where: { sender_id: senderId },
      ...options,
    });
  }

  async findAndCountAll(
    query: ChatMessageQuery = {},
  ): Promise<{ rows: ChatMessage[]; count: number }> {
    const { page = 1, limit = 20, chatRoomId, senderId, type } = query;
    const offset = (page - 1) * limit;

    const where: ChatMessageWhereOptions = {};

    if (chatRoomId) {
      where.chat_room_id = chatRoomId;
    }

    if (senderId) {
      where.sender_id = senderId;
    }

    if (type) {
      where.message_type = type;
    }

    const options: FindAndCountOptions = {
      where,
      offset,
      limit,
      order: [['created_at', 'ASC']],
    };

    return this.chatMessageModel.findAndCountAll(options);
  }

  async create(data: CreateChatMessageDto): Promise<ChatMessage> {
    return this.chatMessageModel.create(data as any);
  }

  async update(
    id: number,
    data: Partial<CreateChatMessageDto>,
  ): Promise<ChatMessage> {
    const chatMessage = await this.findById(id);
    if (!chatMessage) {
      throw new NotFoundException('Chat message not found');
    }

    return chatMessage.update(data as any);
  }

  async delete(id: number): Promise<void> {
    const chatMessage = await this.findById(id);
    if (!chatMessage) {
      throw new NotFoundException('Chat message not found');
    }

    await chatMessage.destroy();
  }
}
