import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatRoom, ChatRoomStatus, ChatRoomVisibility } from '../db/models/chat-room.model';
import { ChatMessage, MessageType } from '../db/models/chat-message.model';
import { ChatOffer, ChatOfferStatus } from '../db/models/chat-offer.model';
import { CustomOrder, CustomOrderStatus } from '../db/models/custom-order.model';
import { CustomOrderRevision } from '../db/models/custom-order-revision.model';
import { ChatRoomRepository } from './repositories/chat-room.repository';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import { ChatOfferRepository } from './repositories/chat-offer.repository';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { Op, WhereOptions } from 'sequelize';
import { UserProduct } from '../db/models/user-product.model';
import { Product } from '../db/models/product.model';
import { ProductLicense } from '../db/models/product-license.model';

interface ChatRoomWhereClause {
  [Op.or]: Array<{ buyer_id: number; seller_id: number }>;
  status: ChatRoomStatus;
  visibility: ChatRoomVisibility;
  product_id?: number | null;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRoomRepository: ChatRoomRepository,
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly chatOfferRepository: ChatOfferRepository,
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

  // ==================== Chat Visibility ====================

  /**
   * Создать чат напрямую в БД с visibility: PENDING
   * Чат не будет виден автору пока покупатель не напишет первое сообщение
   */
  async createPendingChat(
    buyerId: number,
    sellerId: number | undefined,
    productId?: number,
    userProductId?: number,
  ): Promise<ChatRoom> {
    // Проверяем, что sellerId валиден
    if (!sellerId || sellerId <= 0) {
      throw new BadRequestException('Valid seller ID is required');
    }

    // Проверить, нет ли уже существующего чата
    const existingChat = await this.findExistingChat(buyerId, sellerId, productId);
    if (existingChat) {
      return existingChat;
    }

    // Проверить, нет ли уже PENDING чата
    const pendingChat = await this.chatRoomRepository.findPendingByParticipants(
      buyerId,
      sellerId,
      productId,
    );
    if (pendingChat) {
      return pendingChat;
    }

    // Создать новый чат с visibility: PENDING
    const createChatDto: CreateChatRoomDto = {
      buyerId,
      sellerId,
      productId,
      userProductId,
      status: ChatRoomStatus.OPEN,
      visibility: ChatRoomVisibility.PENDING,
    };

    return this.chatRoomRepository.create(createChatDto);
  }

  /**
   * Сделать чат видимым (при отправке первого сообщения)
   */
  async makeChatVisible(chatRoomId: number): Promise<ChatRoom> {
    return this.chatRoomRepository.makeVisible(chatRoomId);
  }

  // ==================== Chat Rooms ====================

  /**
   * Получить все видимые чаты пользователя
   * Возвращает только чаты с visibility: VISIBLE
   */
  async getUserChatRooms(userId: number, page = 1, limit = 20) {
    // Используем findVisibleByUserId чтобы получить только видимые чаты
    const chats = await this.chatRoomRepository.findVisibleByUserId(userId, {
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });
    
    const count = chats.length;
    
    return { rows: chats, count };
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
   * Найти существующий чат по параметрам (только VISIBLE чаты)
   */
  async findExistingChat(
    buyerId: number,
    sellerId: number,
    productId?: number,
  ): Promise<ChatRoom | null> {
    const where: ChatRoomWhereClause = {
      [Op.or]: [
        { buyer_id: buyerId, seller_id: sellerId },
        { buyer_id: sellerId, seller_id: buyerId },
      ],
      status: ChatRoomStatus.OPEN,
      visibility: ChatRoomVisibility.VISIBLE,
    };

    if (productId) {
      where.product_id = productId;
    } else {
      where.product_id = null;
    }

    return this.chatRoomModel.findOne({ where: where as WhereOptions });
  }

  /**
   * Создать чат (или получить существующий VISIBLE чат)
   */
  async getOrCreateChat(
    buyerId: number,
    sellerId: number,
    productId?: number,
  ): Promise<ChatRoom> {
    // Попробовать найти существующий VISIBLE чат
    const existingChat = await this.findExistingChat(buyerId, sellerId, productId);
    if (existingChat) {
      return existingChat;
    }

    // Создать новый чат с visibility: PENDING
    const createChatDto: CreateChatRoomDto = {
      buyerId,
      sellerId,
      productId,
      status: ChatRoomStatus.OPEN,
      visibility: ChatRoomVisibility.PENDING,
    };

    return this.chatRoomRepository.create(createChatDto);
  }

  // ==================== Messages ====================

  /**
   * Отправить сообщение
   * При отправке первого сообщения делает чат видимым
   */
  async sendMessage(
    chatRoomId: number | string,
    senderId: number,
    content: string,
    type: MessageType = MessageType.TEXT,
    attachmentUrl?: string,
  ): Promise<ChatMessage> {
    let roomId: number;

    // Если это PENDING чат (число), создаем VISIBLE чат
    if (typeof chatRoomId === 'number') {
      roomId = chatRoomId;
    } else {
      // Legacy: поддержка старых temp чатов из Redis
      throw new BadRequestException('Temp chat is no longer supported. Use chat ID directly.');
    }

    // Проверить, что чат существует
    const chatRoom = await this.chatRoomRepository.findById(roomId);
    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    // Если чат PENDING, сделать его VISIBLE
    if (chatRoom.visibility === ChatRoomVisibility.PENDING) {
      await this.makeChatVisible(roomId);
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
   * Получить чаты покупателей для автора (только VISIBLE)
   */
  async getSellerChats(sellerId: number, page = 1, limit = 20) {
    const chats = await this.chatRoomRepository.findVisibleByUserId(sellerId, {
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });
    
    const count = chats.length;
    
    return { rows: chats, count };
  }
}
