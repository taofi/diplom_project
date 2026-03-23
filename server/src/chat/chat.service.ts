import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatRoom, ChatRoomStatus } from '../db/models/chat-room.model';
import { ChatMessage, MessageType } from '../db/models/chat-message.model';
import { ChatOffer, ChatOfferStatus } from '../db/models/chat-offer.model';
import { CustomOrder, CustomOrderStatus } from '../db/models/custom-order.model';
import { CustomOrderRevision } from '../db/models/custom-order-revision.model';
import { ChatRoomRepository } from './repositories/chat-room.repository';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import { ChatOfferRepository } from './repositories/chat-offer.repository';
import { TempChatService } from './temp-chat.service';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { Op, FindOptions } from 'sequelize';
import { UserProduct } from '../db/models/user-product.model';
import { Product } from '../db/models/product.model';
import { ProductLicense } from '../db/models/product-license.model';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRoomRepository: ChatRoomRepository,
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly chatOfferRepository: ChatOfferRepository,
    private readonly tempChatService: TempChatService,
    @InjectModel(ChatRoom)
    private readonly chatRoomModel: typeof ChatRoom,
    @InjectModel(ChatMessage)
    private readonly chatMessageModel: typeof ChatMessage,
    @InjectModel(ChatOffer)
    private readonly chatOfferModel: typeof ChatOffer,
    @InjectModel(CustomOrder)
    private readonly customOrderModel: typeof CustomOrder,
    @InjectModel(CustomOrderRevision)
    private readonly customOrderRevisionModel: typeof CustomOrderRevision,
    @InjectModel(UserProduct)
    private readonly userProductModel: typeof UserProduct,
    @InjectModel(Product)
    private readonly productModel: typeof Product,
  ) {}

  // ==================== UserProduct Integration ====================

  /**
   * Проверить, купил ли пользователь товар
   */
  async hasUserPurchasedProduct(userId: number, productId: number): Promise<boolean> {
    const userProduct = await this.userProductModel.findOne({
      where: { user_id: userId },
      include: [
        {
          model: ProductLicense,
          where: { product_id: productId },
          required: true,
        },
      ],
    });
    return !!userProduct;
  }

  /**
   * Получить список купленных товаров с информацией об авторе
   */
  async getPurchasedProductsWithAuthors(userId: number) {
    return this.userProductModel.findAll({
      where: { user_id: userId },
      include: [
        {
          model: ProductLicense,
          include: [
            {
              model: this.productModel,
              attributes: ['id', 'seller_id', 'main_image'],
            },
          ],
        },
      ],
    });
  }

  /**
   * Проверить, может ли пользователь создать чат с автором товара
   * (только для купленных товаров)
   */
  async canUserChatWithSeller(userId: number, productId: number): Promise<boolean> {
    return this.hasUserPurchasedProduct(userId, productId);
  }

  // ==================== Temp Chat (Redis) ====================

  /**
   * Создать временный чат в Redis
   */
  async createTempChat(
    buyerId: number,
    sellerId: number,
    productId?: number,
    userProductId?: number,
  ) {
    return this.tempChatService.createTempChat(
      buyerId,
      sellerId,
      productId,
      userProductId,
    );
  }

  /**
   * Получить временный чат из Redis
   */
  async getTempChat(id: string) {
    return this.tempChatService.getTempChat(id);
  }

  /**
   * Удалить временный чат из Redis
   */
  async deleteTempChat(id: string) {
    return this.tempChatService.deleteTempChat(id);
  }

  // ==================== Chat Rooms ====================

  /**
   * Получить все чаты пользователя
   */
  async getUserChatRooms(userId: number, page = 1, limit = 20) {
    return this.chatRoomRepository.findAndCountAll({
      page,
      limit,
      userId,
    });
  }

  /**
   * Получить чат с сообщениями
   */
  async getChatRoomWithMessages(chatRoomId: number, page = 1, limit = 50) {
    const chatRoom = await this.chatRoomRepository.findById(chatRoomId, {
      include: [
        { model: this.chatMessageModel, as: 'messages' },
      ],
    });

    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    const messages = await this.chatMessageRepository.findAndCountAll({
      page,
      limit,
      chatRoomId,
    });

    return {
      chatRoom,
      messages: messages.rows,
      total: messages.count,
    };
  }

  /**
   * Найти существующий чат по параметрам
   */
  async findExistingChat(
    buyerId: number,
    sellerId: number,
    productId?: number,
  ): Promise<ChatRoom | null> {
    const where: any = {
      [Op.or]: [
        { buyer_id: buyerId, seller_id: sellerId },
        { buyer_id: sellerId, seller_id: buyerId },
      ],
      status: ChatRoomStatus.OPEN,
    };

    if (productId) {
      where.product_id = productId;
    } else {
      (where as Record<string, unknown>).product_id = null;
    }

    return this.chatRoomModel.findOne({ where } as FindOptions);
  }

  /**
   * Создать чат (или получить существующий)
   */
  async getOrCreateChat(
    buyerId: number,
    sellerId: number,
    productId?: number,
  ): Promise<ChatRoom> {
    // Попробовать найти существующий чат
    const existingChat = await this.findExistingChat(buyerId, sellerId, productId);
    if (existingChat) {
      return existingChat;
    }

    // Создать новый чат
    const createChatDto: CreateChatRoomDto = {
      buyerId,
      sellerId,
      productId,
      status: ChatRoomStatus.OPEN,
    };

    return this.chatRoomRepository.create(createChatDto);
  }

  /**
   * Создать чат из временного (при отправке первого сообщения)
   */
  async createChatFromTempChat(tempChatId: string): Promise<ChatRoom> {
    const tempChat = await this.tempChatService.getTempChat(tempChatId);
    if (!tempChat) {
      throw new NotFoundException('Temp chat not found');
    }

    // Проверить, нет ли уже существующего чата
    const existingChat = await this.findExistingChat(
      tempChat.buyerId,
      tempChat.sellerId,
      tempChat.productId || undefined,
    );

    if (existingChat) {
      // Удалить временный чат и вернуть существующий
      await this.tempChatService.deleteTempChat(tempChatId);
      return existingChat;
    }

    // Создать новый чат
    const chat = await this.getOrCreateChat(
      tempChat.buyerId,
      tempChat.sellerId,
      tempChat.productId || undefined,
    );

    // Удалить временный чат
    await this.tempChatService.deleteTempChat(tempChatId);

    return chat;
  }

  // ==================== Messages ====================

  /**
   * Отправить сообщение
   */
  async sendMessage(
    chatRoomId: number | string,
    senderId: number,
    content: string,
    type: MessageType = MessageType.TEXT,
    attachmentUrl?: string,
  ): Promise<ChatMessage> {
    let roomId: number;

    // Если это временный чат (строка), создаем постоянный чат
    if (typeof chatRoomId === 'string') {
      const chat = await this.createChatFromTempChat(chatRoomId);
      roomId = chat.id;
    } else {
      roomId = chatRoomId;
    }

    // Проверить, что чат существует
    const chatRoom = await this.chatRoomRepository.findById(roomId);
    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    // Создать сообщение
    const messageDto: CreateChatMessageDto = {
      chatRoomId: roomId,
      senderId,
      content,
      type,
      mediaUrl: attachmentUrl,
    };

    const message = await this.chatMessageRepository.create(messageDto);

    // Обновить last_message_at в чате
    await this.chatRoomRepository.update(roomId, {
      last_message_at: new Date(),
    } as any);

    return message;
  }

  /**
   * Получить сообщения чата
   */
  async getMessages(chatRoomId: number, page = 1, limit = 50) {
    return this.chatMessageRepository.findAndCountAll({
      page,
      limit,
      chatRoomId,
    });
  }

  /**
   * Отметить сообщения как прочитанные
   */
  async markMessagesAsRead(chatRoomId: number, userId: number) {
    await this.chatMessageModel.update(
      { is_read: true },
      {
        where: {
          chat_room_id: chatRoomId,
          sender_id: { [Op.ne]: userId },
          is_read: false,
        },
      },
    );
  }

  // ==================== Offers ====================

  /**
   * Создать предложение
   */
  async createOffer(
    chatRoomId: number,
    messageId: number,
    sellerId: number,
    description: string,
    price: number,
    deadline: Date,
  ): Promise<ChatOffer> {
    return this.chatOfferRepository.create({
      chat_room_id: chatRoomId,
      message_id: messageId,
      seller_id: sellerId,
      description,
      price,
      deadline,
      status: ChatOfferStatus.PENDING,
    });
  }

  /**
   * Принять предложение
   */
  async acceptOffer(offerId: number, buyerId: number): Promise<CustomOrder> {
    const offer = await this.chatOfferRepository.findById(offerId, {
      include: [this.chatRoomModel],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.status !== ChatOfferStatus.PENDING) {
      throw new BadRequestException('Offer is not pending');
    }

    // Обновить статус предложения
    await this.chatOfferRepository.updateStatus(offerId, ChatOfferStatus.ACCEPTED);

    const chatRoomId = offer.chat_room_id;

    // Создать заказ
    const customOrder = await this.customOrderModel.create({
      chat_offer_id: offerId,
      buyer_id: buyerId,
      seller_id: offer.seller_id,
      chat_room_id: chatRoomId,
      description: offer.description,
      price: offer.price,
      status: CustomOrderStatus.IN_PROGRESS,
      deadline: offer.deadline,
    });

    return customOrder;
  }

  /**
   * Отклонить предложение
   */
  async declineOffer(offerId: number): Promise<ChatOffer> {
    return this.chatOfferRepository.updateStatus(offerId, ChatOfferStatus.DECLINED);
  }

  /**
   * Получить предложения чата
   */
  async getChatOffers(chatRoomId: number) {
    return this.chatOfferRepository.findByChatRoomId(chatRoomId);
  }

  // ==================== Custom Orders ====================

  /**
   * Получить заказы пользователя
   */
  async getUserOrders(userId: number, page = 1, limit = 20) {
    const { rows, count } = await this.customOrderModel.findAndCountAll({
      where: {
        [Op.or]: [{ buyer_id: userId }, { seller_id: userId }],
      },
      offset: (page - 1) * limit,
      limit,
      order: [['created_at', 'DESC']],
    });

    return { rows, count };
  }

  /**
   * Получить заказ с ревизиями
   */
  async getOrderWithRevisions(orderId: number) {
    const order = await this.customOrderModel.findByPk(orderId, {
      include: [this.customOrderRevisionModel],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Добавить ревизию с файлом
   */
  async addRevision(
    orderId: number,
    fileUrl: string,
    comment?: string,
  ): Promise<CustomOrderRevision> {
    const order = await this.customOrderModel.findByPk(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Создать ревизию
    const revision = await this.customOrderRevisionModel.create({
      custom_order_id: orderId,
      file_url: fileUrl,
      comment,
      is_approved: false,
    });

    // Обновить статус заказа
    await order.update({ status: CustomOrderStatus.REVIEW });

    return revision;
  }

  /**
   * Одобрить результат
   */
  async approveOrder(orderId: number): Promise<CustomOrder> {
    const order = await this.customOrderModel.findByPk(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order.update({ status: CustomOrderStatus.COMPLETED });
  }

  /**
   * Запросить доработку
   */
  async requestRevision(orderId: number): Promise<CustomOrder> {
    const order = await this.customOrderModel.findByPk(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order.update({ status: CustomOrderStatus.REVISION });
  }

  /**
   * Получить чаты покупателей для автора
   */
  async getSellerChats(sellerId: number, page = 1, limit = 20) {
    return this.chatRoomRepository.findAndCountAll({
      page,
      limit,
      userId: sellerId,
    });
  }
}
