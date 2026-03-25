import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatRoom, ChatRoomStatus, ChatRoomVisibility } from '../db/models/chat-room.model';
import { ChatMessage, MessageType } from '../db/models/chat-message.model';
import { Offer, OfferStatus } from '../db/models/offer.model';
import { User } from '../db/models/user.model';
import { Product } from '../db/models/product.model';
import { ProductMedia } from '../db/models/product-media.model';
import { ChatRoomRepository } from './repositories/chat-room.repository';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import { OfferRepository } from './repositories/offer.repository';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { TranslationService } from '../translation/translation.service';
import { normalizeLanguage } from '../translation/utils/language.utils';
import { Op, WhereOptions } from 'sequelize';
import { UserProduct } from '../db/models/user-product.model';
import { ProductLicense } from '../db/models/product-license.model';
import { LicenseType } from '../db/models/license-type.model';

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
    private readonly offerRepository: OfferRepository,
    private readonly translationService: TranslationService,
    @InjectModel(ChatRoom)
    private readonly chatRoomModel: typeof ChatRoom,
    @InjectModel(ChatMessage)
    private readonly chatMessageModel: typeof ChatMessage,
    @InjectModel(Offer)
    private readonly offerModel: typeof Offer,
    @InjectModel(UserProduct)
    private readonly userProductModel: typeof UserProduct,
    @InjectModel(Product)
    private readonly productModel: typeof Product,
  ) { }

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
  async getUserChatRooms(userId: number, page = 1, limit = 20, locale?: string) {
    // Используем findVisibleByUserId чтобы получить только видимые чаты
    const chats = await this.chatRoomRepository.findVisibleByUserId(userId, {
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    const count = chats.length;

    // Нормализуем язык (по умолчанию используем 'en' если не передан)
    const normalizedLang = normalizeLanguage(locale) || 'en';

    // Создаем новый массив с преобразованными данными (чистый объект без Sequelize)
    const transformedChats = await Promise.all(chats.map(async (chat) => {
      // Начинаем с базовых данных
      const chatResponse: Record<string, unknown> = {
        id: chat.id,
        buyer_id: chat.buyer_id,
        seller_id: chat.seller_id,
        product_id: chat.product_id,
        user_product_id: chat.user_product_id,
        status: chat.status,
        visibility: chat.visibility,
        last_message_at: chat.last_message_at,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
      };

      // Добавляем buyer и seller
      if (chat.buyer) {
        chatResponse.buyer = {
          id: chat.buyer.id,
          name: chat.buyer.name,
          avatar_url: chat.buyer.avatar_url,
        };
      }
      if (chat.seller) {
        chatResponse.seller = {
          id: chat.seller.id,
          name: chat.seller.name,
          avatar_url: chat.seller.avatar_url,
        };
      }

      // Обрабатываем product
      if (chat.product_id && chat.product) {
        const product = chat.product as Product & { media?: Array<{ url: string; is_cover: boolean }> };

        // Получаем перевод продукта
        const translation = await this.translationService.getProductTranslation(
          chat.product_id,
          normalizedLang,
        );

        if (translation) {
          chatResponse.translatedProductName = translation.name;
          chatResponse.translatedProductDescription = translation.shortDescription;
        }

        // Получаем main_image из media
        if (product.media && product.media.length > 0) {
          chatResponse.mainImage = product.media[0].url;
        }

        // Добавляем данные о продукте (только id)
        chatResponse.product = {
          id: product.id,
        };
      }

      // Получаем данные о лицензии из user_product
      const userProduct = chat.user_product as UserProduct & { product_license: ProductLicense & { license_type: LicenseType } } | null;
      if (userProduct?.product_license) {
        const productLicense = userProduct.product_license;
        const licenseType = productLicense.license_type;

        // Получаем цену покупки
        if (productLicense.price !== undefined) {
          chatResponse.price = Number(productLicense.price);
        }

        // Получаем перевод типа лицензии
        if (licenseType?.id) {
          const licenseTypeTranslation =
            await this.translationService.getLicenseTypeTranslation(
              licenseType.id,
              normalizedLang,
            );
          if (licenseTypeTranslation) {
            chatResponse.licenseTypeName = licenseTypeTranslation.name;
          }
        }
      }

      // Добавляем количество непрочитанных сообщений
      const unreadCount = await this.getUnreadCountForRoom(chat.id, userId);
      chatResponse.unreadCount = unreadCount;

      return chatResponse;
    }));

    return { rows: transformedChats, count };
  }

  /**
   * Получить чат с сообщениями
   */
  async getChatRoomWithMessages(chatRoomId: number, page = 1, limit = 50, locale?: string) {
    // Проверяем, что комната существует
    const existingChatRoom = await this.chatRoomRepository.findById(chatRoomId);
    if (!existingChatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    // Нормализуем язык (по умолчанию используем 'en' если не передан)
    const normalizedLang = normalizeLanguage(locale) || 'en';

    // Получаем данные о чате без сообщений (они загружаются отдельно с пагинацией)
    const chatRoom = await this.chatRoomRepository.findById(chatRoomId, {
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'seller', attributes: ['id', 'name', 'avatar_url'] },
        {
          model: Product,
          as: 'product',
          include: [
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
    });

    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    // Формируем чистый объект ответа
    const chatRoomResponse: Record<string, unknown> = {
      id: chatRoom.id,
      buyer_id: chatRoom.buyer_id,
      seller_id: chatRoom.seller_id,
      product_id: chatRoom.product_id,
      user_product_id: chatRoom.user_product_id,
      status: chatRoom.status,
      visibility: chatRoom.visibility,
      last_message_at: chatRoom.last_message_at,
      created_at: chatRoom.created_at,
      updated_at: chatRoom.updated_at,
    };

    // Добавляем buyer и seller
    if (chatRoom.buyer) {
      chatRoomResponse.buyer = {
        id: chatRoom.buyer.id,
        name: chatRoom.buyer.name,
        avatar_url: chatRoom.buyer.avatar_url,
      };
    }
    if (chatRoom.seller) {
      chatRoomResponse.seller = {
        id: chatRoom.seller.id,
        name: chatRoom.seller.name,
        avatar_url: chatRoom.seller.avatar_url,
      };
    }

    // Обрабатываем product
    if (chatRoom.product_id && chatRoom.product) {
      const product = chatRoom.product as Product & { media?: Array<{ url: string; is_cover: boolean }> };

      // Получаем перевод продукта
      console.log('[DEBUG] getChatRoomWithMessages: product_id =', chatRoom.product_id, ', normalizedLang =', normalizedLang);
      const translation = await this.translationService.getProductTranslation(
        chatRoom.product_id,
        normalizedLang,
      );
      console.log('[DEBUG] getChatRoomWithMessages: translation =', translation);

      if (translation) {
        chatRoomResponse.translatedProductName = translation.name;
        chatRoomResponse.translatedProductDescription = translation.shortDescription;
      }

      // Получаем main_image из media
      if (product.media && product.media.length > 0) {
        chatRoomResponse.mainImage = product.media[0].url;
      }

      // Добавляем данные о продукте (только id)
      chatRoomResponse.product = {
        id: product.id,
      };
    }

    // Получаем данные о лицензии из user_product
    const userProduct = chatRoom.user_product as UserProduct & { product_license: ProductLicense & { license_type: LicenseType } } | null;
    if (userProduct?.product_license) {
      const productLicense = userProduct.product_license;
      const licenseType = productLicense.license_type;

      // Получаем цену покупки
      if (productLicense.price !== undefined) {
        chatRoomResponse.price = Number(productLicense.price);
      }

      // Получаем перевод типа лицензии
      if (licenseType?.id) {
        const licenseTypeTranslation = await this.translationService.getLicenseTypeTranslation(
          licenseType.id,
          normalizedLang,
        );
        if (licenseTypeTranslation) {
          chatRoomResponse.licenseTypeName = licenseTypeTranslation.name;
        }
      }
    }

    // Получаем сообщения с пагинацией
    const messages = await this.chatMessageRepository.findAndCountAll({
      page,
      limit,
      chatRoomId,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] },
      ],
    });

    return {
      chatRoom: chatRoomResponse,
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
    // Маппим поля в snake_case для Sequelize
    const messageData = {
      chat_room_id: roomId,
      sender_id: senderId,
      message: content,
      message_type: type,
      attachment_url: attachmentUrl,
    };

    const message = await this.chatMessageRepository.create(messageData);

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

  /**
   * Получить количество непрочитанных сообщений в конкретном чате
   */
  async getUnreadCountForRoom(chatRoomId: number, userId: number): Promise<number> {
    return this.chatMessageModel.count({
      where: {
        chat_room_id: chatRoomId,
        sender_id: { [Op.ne]: userId },
        is_read: false,
      },
    });
  }

  /**
   * Получить все непрочитанные сообщения для пользователя (по всем чатам)
   * Возвращает Map<roomId, count>
   */
  async getAllUnreadCounts(userId: number): Promise<Map<number, number>> {
    // 1. Получаем все видимые чаты пользователя
    const chats = await this.chatRoomRepository.findVisibleByUserId(userId, {
      attributes: ['id'],
    });

    // 2. Для каждого чата считаем непрочитанные
    const result = new Map<number, number>();

    for (const chat of chats) {
      const count = await this.getUnreadCountForRoom(chat.id, userId);
      if (count > 0) {
        result.set(chat.id, count);
      }
    }

    return result;
  }

  /**
   * Пометить конкретный чат как прочитанный
   */
  async markRoomAsRead(chatRoomId: number, userId: number): Promise<void> {
    return this.markMessagesAsRead(chatRoomId, userId);
  }

  // ==================== Offers ====================

  /**
   * Создать предложение
   * Защита: только участник чата (покупатель) может создать предложение
  async createOffer(
    chatRoomId: number,
    messageId: number,
    buyerId: number,
    authorId: number,
    description: string,
    price: number,
  ): Promise<Offer> {
    // Проверяем, что пользователь является участником чата
    const chatRoom = await this.chatRoomRepository.findById(chatRoomId);
    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    // Защита: только покупатель (buyer в чате) может создать предложение
    if (chatRoom.buyer_id !== buyerId) {
      throw new ForbiddenException('Only chat participant (buyer) can create offers');
    }

    const offer = await this.offerRepository.create({
      chat_room_id: chatRoomId,
      creator_id: buyerId,
      author_id: authorId,
      description,
      price,
      status: OfferStatus.WAITING_AUTHOR,
    });
    return offer;
  }
   */

  async getChatOffers(chatRoomId: number): Promise<Offer[]> {
    return this.offerRepository.findByChatRoom(chatRoomId);
  }

  // ==================== Orders ====================

  /**
   * Получить активные заказы пользователя
   */
  async getUserOrders(userId: number) {
    const offers = await this.offerRepository.findActiveByUser(userId);
    return {
      rows: offers,
      count: offers.length,
    };
  }

  /**
   * Получить все заказы пользователя (включая завершённые)
   * Используется для страницы заказов
   */
  async getAllUserOrders(userId: number) {
    const offers = await this.offerRepository.findAllByUser(userId);
    
    // Map Offer to CustomOrder format for frontend compatibility
    const customOrders = offers.map(offer => this.serializeOfferAsCustomOrder(offer));
    
    return {
      rows: customOrders,
      count: customOrders.length,
    };
  }

  /**
   * Преобразовать Offer в формат CustomOrder для фронтенда
   */
  private serializeOfferAsCustomOrder(offer: Offer): Record<string, unknown> {
    // Parse source_files_urls from JSON string
    let sourceFilesUrls: string[] | null = null;
    if (offer.source_files_urls && typeof offer.source_files_urls === 'string') {
      try {
        sourceFilesUrls = JSON.parse(offer.source_files_urls) as string[];
      } catch {
        sourceFilesUrls = null;
      }
    }

    // Map OfferStatus to CustomOrder status
    const statusMap: Record<string, string> = {
      [OfferStatus.WAITING_AUTHOR]: 'in_progress',
      [OfferStatus.WAITING_USER]: 'in_progress',
      [OfferStatus.REJECTED]: 'cancelled',
      [OfferStatus.IN_PROGRESS]: 'in_progress',
      [OfferStatus.AWAITING_PAYMENT]: 'review',
      [OfferStatus.COMPLETED]: 'completed',
    };

    // Determine if current user is buyer or seller (for reference)
    // const isBuyer = offer.creator_id === currentUserId;
    // const isSeller = offer.author_id === currentUserId;

    return {
      id: offer.id,
      chat_offer_id: offer.id,
      buyer_id: offer.creator_id,
      seller_id: offer.author_id,
      chat_room_id: offer.chat_room_id,
      description: offer.description,
      price: Number(offer.price),
      status: statusMap[offer.status] || 'in_progress',
      deadline: offer.created_at ? new Date(new Date(offer.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : new Date().toISOString(), // Default 7 days from creation
      created_at: offer.created_at,
      updated_at: offer.updated_at,
      is_paid: offer.is_paid,
      preview_url: offer.preview_url,
      source_files_urls: sourceFilesUrls,
      // Include offer for backward compatibility
      offer: {
        id: offer.id,
        chat_room_id: offer.chat_room_id,
        creator_id: offer.creator_id,
        author_id: offer.author_id,
        description: offer.description,
        price: Number(offer.price),
        original_price: offer.original_price ? Number(offer.original_price) : null,
        status: offer.status,
        preview_url: offer.preview_url,
        source_files_urls: sourceFilesUrls,
        is_paid: offer.is_paid,
        paid_at: offer.paid_at,
        created_at: offer.created_at,
        updated_at: offer.updated_at,
      },
    };
  }

  /**
   * Получить заказ с файлами
   */
  async getOrderWithRevisions(orderId: number) {
    const offer = await this.offerRepository.findById(orderId);

    if (!offer) {
      throw new NotFoundException('Order not found');
    }

    return { order: offer, revisions: [] };
  }

  /**
   * Добавить ревизию (загрузить файлы)
   * Теперь это делается через OfferService
   */
  //async addRevision(_orderId: number, _fileUrl: string, _comment?: string) {
    //throw new BadRequestException('Use OfferService for file uploads');
  //}

  /**
   * Одобрить заказ
   */
  async approveOrder(orderId: number) {
    const offer = await this.offerRepository.findById(orderId);
    if (!offer) {
      throw new NotFoundException('Order not found');
    }

    return this.offerRepository.updateStatus(orderId, OfferStatus.COMPLETED);
  }

  /**
   * Запросить доработку
   */
  async requestRevision(orderId: number) {
    const offer = await this.offerRepository.findById(orderId);
    if (!offer) {
      throw new NotFoundException('Order not found');
    }

    // В Offer нет статуса revision, возвращаем ошибку
    throw new BadRequestException('Use Offer workflow for revisions');
  }

  // ==================== Seller Chats ====================

  /**
   * Получить чаты продавца
   */
  async getSellerChats(sellerId: number, page = 1, limit = 20) {
    const chats = await this.chatRoomRepository.findVisibleByUserId(sellerId, {
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    return { rows: chats, count: chats.length };
  }
}
