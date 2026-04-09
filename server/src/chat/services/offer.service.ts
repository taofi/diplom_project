import { Injectable, NotFoundException, ForbiddenException, BadRequestException, StreamableFile } from '@nestjs/common';
import { OfferRepository } from '../repositories/offer.repository';
import { Offer, OfferStatus } from '../../db/models/offer.model';
import { CreateOfferDto, CounterOfferDto, PayOrderDto } from '../dto/offer.dto';
import { ChatNotificationService } from './chat-notification.service';
import { FileService } from '../../common/services/file.service';
import type { MulterFile } from '../../common/services/file.service';
import { createReadStream } from 'fs';

@Injectable()
export class OfferService {
  constructor(
    private offerRepository: OfferRepository,
    private chatNotificationService: ChatNotificationService,
    private fileService: FileService,
  ) {}

  /**
   * Сериализация данных заказа для отправки клиенту
   */
  private serializeOffer(offer: Offer): Record<string, unknown> {
    const isPaidCompleted = offer.status === OfferStatus.COMPLETED && offer.is_paid;
    const sourceFilesUrls = isPaidCompleted
      ? this.parseJsonStringArray(offer.source_files_urls)
      : null;
    const creatorAttachmentsUrls = this.parseJsonStringArray(offer.creator_attachments_urls);
    const authorImagesUrls = this.parseJsonStringArray(offer.author_images_urls);
    
    return {
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
      creator_attachments_urls: creatorAttachmentsUrls,
      author_images_urls: authorImagesUrls,
      author_file_url: isPaidCompleted ? offer.author_file_url : null,
      is_paid: offer.is_paid,
      paid_at: offer.paid_at,
      created_at: offer.created_at,
      updated_at: offer.updated_at,
    };
  }

  private parseJsonStringArray(value: string | null): string[] | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    try {
      return JSON.parse(value) as string[];
    } catch {
      return null;
    }
  }

  /**
   * Создать заказ (Заказчик)
   */
  async createOffer(userId: number, dto: CreateOfferDto): Promise<Offer> {
    console.log(`[OfferService] createOffer: userId=${userId}, chatRoomId=${dto.chatRoomId}, authorId=${dto.authorId}`);
    
    const offer = await this.offerRepository.create({
      chat_room_id: dto.chatRoomId,
      creator_id: userId,
      author_id: dto.authorId,
      description: dto.description,
      price: dto.price,
      status: OfferStatus.WAITING_AUTHOR,
    });

    console.log(`[OfferService] Offer created: id=${offer.id}, chat_room_id=${offer.chat_room_id}`);

    const serialized = this.serializeOffer(offer);
    console.log(`[OfferService] Serialized offer:`, JSON.stringify(serialized));
    
    // WebSocket: уведомить создателя (заказчика)
    console.log(`[OfferService] Sending offer:created to creator userId=${userId}`);
    await this.chatNotificationService.notifyUser(userId, 'offer:created', { offer: serialized });
    
    // WebSocket: уведомить автора (продавца)
    console.log(`[OfferService] Sending offer:created to author userId=${dto.authorId}`);
    await this.chatNotificationService.notifyUser(dto.authorId, 'offer:created', { offer: serialized });

    console.log(`[OfferService] createOffer completed for offer ${offer.id}`);
    return offer;
  }

  /**
   * Принять заказ (Автор)
   * Если original_price существует - устанавливаем price = original_price
   */
  async acceptOffer(offerId: number, userId: number): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    if (offer.author_id !== userId) {
      throw new ForbiddenException('Not your offer');
    }

    // Если есть original_price (автор предложил свою цену) - используем её
    if (offer.original_price !== null && typeof offer.original_price === 'number') {
      await this.offerRepository.updatePriceOnly(offerId, offer.original_price);
    }

    const updated = await this.offerRepository.updateStatus(
      offerId,
      OfferStatus.IN_PROGRESS,
    );

    const serialized = this.serializeOffer(updated);
    
    // WebSocket: уведомить создателя
    await this.chatNotificationService.notifyUser(offer.creator_id, 'offer:statusChanged', { offer: serialized });
    // WebSocket: уведомить автора
    await this.chatNotificationService.notifyUser(offer.author_id, 'offer:statusChanged', { offer: serialized });
    
    return updated;
  }

  /**
   * Отклонить заказ (Любой участник)
   */
  async rejectOffer(offerId: number, userId: number): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    if (offer.creator_id !== userId && offer.author_id !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const updated = await this.offerRepository.updateStatus(
      offerId,
      OfferStatus.REJECTED,
    );

    const serialized = this.serializeOffer(updated);
    
    // WebSocket: уведомить создателя
    await this.chatNotificationService.notifyUser(offer.creator_id, 'offer:statusChanged', { offer: serialized });
    // WebSocket: уведомить автора
    await this.chatNotificationService.notifyUser(offer.author_id, 'offer:statusChanged', { offer: serialized });
    
    return updated;
  }

  /**
   * Отклонить предложение (с дополнительной логикой сброса цены)
   * Защита: только участники сделки могут отклонить
   * Поддерживает: WAITING_AUTHOR, WAITING_USER
   */
  async declineOffer(offerId: number, userId: number): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Защита: только автор (продавец) или создатель (покупатель) может отклонить
    if (offer.author_id !== userId && offer.creator_id !== userId) {
      throw new ForbiddenException('Only offer participants can decline the offer');
    }

    // Поддержка WAITING_AUTHOR и WAITING_USER
    if (offer.status !== OfferStatus.WAITING_AUTHOR && offer.status !== OfferStatus.WAITING_USER) {
      throw new BadRequestException('Offer cannot be declined at this status');
    }

    // Если отклоняем после изменения цены - сбрасываем original_price
    if (offer.status === OfferStatus.WAITING_USER && offer.original_price) {
      await this.offerRepository.updatePriceOnly(offerId, offer.original_price);
    }

    const updated = await this.offerRepository.updateStatus(
      offerId,
      OfferStatus.REJECTED,
    );

    const serialized = this.serializeOffer(updated);
    
    // WebSocket: уведомить создателя
    await this.chatNotificationService.notifyUser(offer.creator_id, 'offer:statusChanged', { offer: serialized });
    // WebSocket: уведомить автора
    await this.chatNotificationService.notifyUser(offer.author_id, 'offer:statusChanged', { offer: serialized });
    
    return updated;
  }

  /**
   * Изменить цену (Автор)
   */
  async counterOffer(offerId: number, userId: number, dto: CounterOfferDto): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    if (offer.author_id !== userId) {
      throw new ForbiddenException('Not your offer');
    }
    if (offer.status !== OfferStatus.WAITING_AUTHOR) {
      throw new ForbiddenException('Cannot change price at this status');
    }

    // Сохраняем старую цену как original_price
    const updated = await this.offerRepository.updatePrice(
      offerId,
      dto.newPrice,
      offer.price,
    );

    // Меняем статус на waiting_user
    await this.offerRepository.updateStatus(offerId, OfferStatus.WAITING_USER);
    updated.status = OfferStatus.WAITING_USER;

    const serialized = this.serializeOffer(updated);
    
    // WebSocket: уведомить создателя
    await this.chatNotificationService.notifyUser(offer.creator_id, 'offer:priceChanged', { offer: serialized });
    // WebSocket: уведомить автора
    await this.chatNotificationService.notifyUser(offer.author_id, 'offer:priceChanged', { offer: serialized });
    
    return updated;
  }

  /**
   * Изменить цену (Заказчик)
   * Работает для статуса WAITING_USER - заказчик предлагает свою цену
   */
  async counterOfferFromCreator(offerId: number, userId: number, dto: CounterOfferDto): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    if (offer.creator_id !== userId) {
      throw new ForbiddenException('Not your offer');
    }
    if (offer.status !== OfferStatus.WAITING_USER) {
      throw new ForbiddenException('Cannot change price at this status');
    }

    // Сохраняем текущую цену как original_price (это цена автора)
    const updated = await this.offerRepository.updatePrice(
      offerId,
      dto.newPrice,
      offer.price,
    );

    // Меняем статус обратно на waiting_author
    await this.offerRepository.updateStatus(offerId, OfferStatus.WAITING_AUTHOR);
    updated.status = OfferStatus.WAITING_AUTHOR;

    const serialized = this.serializeOffer(updated);
    
    // WebSocket: уведомить создателя
    await this.chatNotificationService.notifyUser(offer.creator_id, 'offer:priceChanged', { offer: serialized });
    // WebSocket: уведомить автора
    await this.chatNotificationService.notifyUser(offer.author_id, 'offer:priceChanged', { offer: serialized });
    
    return updated;
  }

  /**
   * Подтвердить цену (Заказчик)
   */
  async confirmPrice(offerId: number, userId: number): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    if (offer.creator_id !== userId) {
      throw new ForbiddenException('Not your offer');
    }
    if (offer.status !== OfferStatus.WAITING_USER) {
      throw new ForbiddenException('Cannot confirm at this status');
    }

    const updated = await this.offerRepository.updateStatus(
      offerId,
      OfferStatus.IN_PROGRESS,
    );

    const serialized = this.serializeOffer(updated);
    
    // WebSocket: уведомить создателя
    await this.chatNotificationService.notifyUser(offer.creator_id, 'offer:statusChanged', { offer: serialized });
    // WebSocket: уведомить автора
    await this.chatNotificationService.notifyUser(offer.author_id, 'offer:statusChanged', { offer: serialized });
    
    return updated;
  }

  /**
   * Загрузить файлы (Автор)
   */
  async uploadFiles(
    offerId: number,
    userId: number,
    images: MulterFile[],
    file: MulterFile | undefined,
  ): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    if (offer.author_id !== userId) {
      throw new ForbiddenException('Not your offer');
    }
    if (offer.status !== OfferStatus.IN_PROGRESS) {
      throw new ForbiddenException('Cannot upload at this status');
    }

    if (images.length > 10) {
      throw new BadRequestException('Maximum 10 images are allowed');
    }
    if (file && file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Field "file" must be a non-image document');
    }
    if (!images.length && !file) {
      throw new BadRequestException('At least one image or one file must be uploaded');
    }

    const authorImageUrls: string[] = [];
    for (const image of images) {
      const result = this.fileService.saveOfferPreview(image, offerId);
      authorImageUrls.push(result.url);
    }

    let authorFileUrl: string | null = null;
    if (file) {
      const result = this.fileService.saveOfferSourceFile(file, offerId);
      authorFileUrl = result.url;
    }

    const updated = await this.offerRepository.setFiles(
      offerId,
      authorImageUrls,
      authorFileUrl,
    );

    // Меняем статус на awaiting_payment
    await this.offerRepository.updateStatus(offerId, OfferStatus.AWAITING_PAYMENT);
    updated.status = OfferStatus.AWAITING_PAYMENT;

    const serialized = this.serializeOffer(updated);
    
    // WebSocket: уведомить создателя
    await this.chatNotificationService.notifyUser(offer.creator_id, 'offer:filesUploaded', { offer: serialized });
    // WebSocket: уведомить автора
    await this.chatNotificationService.notifyUser(offer.author_id, 'offer:filesUploaded', { offer: serialized });
    
    return updated;
  }

  /**
   * Загрузить вложения заказчика после создания заказа
   */
  async uploadCreatorFiles(
    offerId: number,
    userId: number,
    images: MulterFile[],
    files: MulterFile[],
  ): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    if (offer.creator_id !== userId) {
      throw new ForbiddenException('Not your offer');
    }
    if (
      offer.status !== OfferStatus.WAITING_AUTHOR &&
      offer.status !== OfferStatus.WAITING_USER
    ) {
      throw new ForbiddenException('Cannot upload creator attachments at this status');
    }

    const totalFiles = images.length + files.length;
    if (totalFiles === 0) {
      throw new BadRequestException('At least one attachment is required');
    }
    if (totalFiles > 10) {
      throw new BadRequestException('Maximum 10 attachments are allowed');
    }
    if (images.length > 10 || files.length > 10) {
      throw new BadRequestException('Maximum 10 files per field are allowed');
    }

    for (const image of images) {
      if (!image.mimetype.startsWith('image/')) {
        throw new BadRequestException('Field "images" accepts image files only');
      }
    }
    for (const file of files) {
      if (file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Field "files" accepts non-image files only');
      }
    }

    const attachmentUrls: string[] = [];
    for (const image of images) {
      const result = this.fileService.saveOfferPreview(image, offerId);
      attachmentUrls.push(result.url);
    }
    for (const file of files) {
      const result = this.fileService.saveCreatorAttachmentFile(file, offerId);
      attachmentUrls.push(result.url);
    }

    const updated = await this.offerRepository.setCreatorAttachments(offerId, attachmentUrls);
    const serialized = this.serializeOffer(updated);

    await this.chatNotificationService.notifyUser(offer.creator_id, 'offer:filesUploaded', { offer: serialized });
    await this.chatNotificationService.notifyUser(offer.author_id, 'offer:filesUploaded', { offer: serialized });

    return updated;
  }

  /**
   * Оплатить заказ (Заказчик)
   */
  async payOrder(offerId: number, userId: number, dto: PayOrderDto): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    if (offer.creator_id !== userId) {
      throw new ForbiddenException('Not your order');
    }
    if (offer.status !== OfferStatus.AWAITING_PAYMENT) {
      throw new ForbiddenException('Cannot pay at this status');
    }

    // Имитация оплаты (в реальности - вызов платёжного провайдера)
    if (dto.simulateSuccess !== false) {
      const updated = await this.offerRepository.markAsPaid(offerId);
      
      const serialized = this.serializeOffer(updated);
      
      // WebSocket: уведомить создателя
      await this.chatNotificationService.notifyUser(offer.creator_id, 'offer:paid', { offer: serialized });
      // WebSocket: уведомить автора
      await this.chatNotificationService.notifyUser(offer.author_id, 'offer:paid', { offer: serialized });
      
      return updated;
    }

    // Если оплата не прошла - возвращаем как есть
    throw new ForbiddenException('Payment failed');
  }

  /**
   * Получить заказ с файлами (с проверкой доступа)
   */
  async getOfferFiles(offerId: number, userId: number): Promise<{
    preview_url: string | null;
    source_files_urls: string[] | null;
    creator_attachments_urls: string[] | null;
    author_images_urls: string[] | null;
    author_file_url: string | null;
  }> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Проверка: пользователь - участник заказа
    if (offer.creator_id !== userId && offer.author_id !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const result: {
      preview_url: string | null;
      source_files_urls: string[] | null;
      creator_attachments_urls: string[] | null;
      author_images_urls: string[] | null;
      author_file_url: string | null;
    } = {
      preview_url: null,
      source_files_urls: null,
      creator_attachments_urls: this.parseJsonStringArray(offer.creator_attachments_urls),
      author_images_urls: this.parseJsonStringArray(offer.author_images_urls),
      author_file_url: null,
    };

    // Превью доступно если awaiting_payment или completed
    if (offer.status === OfferStatus.AWAITING_PAYMENT || offer.status === OfferStatus.COMPLETED) {
      result.preview_url = offer.preview_url;
    }

    // Исходники доступны ТОЛЬКО если completed И is_paid
    if (offer.status === OfferStatus.COMPLETED && offer.is_paid) {
      result.author_file_url = offer.author_file_url;
      const sourceUrls = offer.source_files_urls;
      if (typeof sourceUrls === 'string' && sourceUrls.length > 0) {
        try {
          result.source_files_urls = JSON.parse(sourceUrls) as string[];
        } catch {
          result.source_files_urls = null;
        }
      } else {
        result.source_files_urls = null;
      }
    }

    return result;
  }

  /**
   * Получить все заказы в чате
   */
  async getRoomOffers(roomId: number): Promise<Offer[]> {
    return this.offerRepository.findByChatRoom(roomId);
  }

  /**
   * Получить заказ по ID
   */
  async getOfferById(offerId: number): Promise<Offer> {
    return this.offerRepository.findByIdOrFail(offerId);
  }

  /**
   * Скачать файл заказа (исходники)
   * GET /chat/offers/:id/download/:fileIndex
   */
  async downloadSourceFile(
    offerId: number,
    fileIndex: number,
    userId: number,
  ): Promise<{ stream: NodeJS.ReadableStream; filename: string; mimeType: string }> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Проверка: только участники заказа
    if (offer.creator_id !== userId && offer.author_id !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    // Файлы доступны только если заказ оплачен
    if (offer.status !== OfferStatus.COMPLETED || !offer.is_paid) {
      throw new ForbiddenException('Files are not available. Order must be paid.');
    }

    // Получаем массив URL файлов
    let sourceFilesUrls: string[] = [];
    if (typeof offer.source_files_urls === 'string' && offer.source_files_urls.length > 0) {
      try {
        sourceFilesUrls = JSON.parse(offer.source_files_urls) as string[];
      } catch {
        sourceFilesUrls = [];
      }
    }

    if (!sourceFilesUrls || sourceFilesUrls.length === 0) {
      throw new NotFoundException('No source files available');
    }

    if (fileIndex < 0 || fileIndex >= sourceFilesUrls.length) {
      throw new NotFoundException('File not found');
    }

    const fileUrl = sourceFilesUrls[fileIndex];
    console.log(`[OfferService] Downloading file: ${fileUrl}`);

    // Используем FileService для получения потока
    return this.fileService.getFileStream(fileUrl);
  }

  /**
   * Скачать файл заказа как StreamableFile
   * Используется для прямого скачивания с правильными заголовками
   */
  async downloadSourceFileAsStream(
    offerId: number,
    fileIndex: number,
    userId: number,
  ): Promise<{ streamableFile: StreamableFile; filename: string; mimeType: string }> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Проверка: только участники заказа
    if (offer.creator_id !== userId && offer.author_id !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    // Файлы доступны только если заказ оплачен
    if (offer.status !== OfferStatus.COMPLETED || !offer.is_paid) {
      throw new ForbiddenException('Files are not available. Order must be paid.');
    }

    // Получаем массив URL файлов
    let sourceFilesUrls: string[] = [];
    if (typeof offer.source_files_urls === 'string' && offer.source_files_urls.length > 0) {
      try {
        sourceFilesUrls = JSON.parse(offer.source_files_urls) as string[];
      } catch {
        sourceFilesUrls = [];
      }
    }

    if (!sourceFilesUrls || sourceFilesUrls.length === 0) {
      throw new NotFoundException('No source files available');
    }

    if (fileIndex < 0 || fileIndex >= sourceFilesUrls.length) {
      throw new NotFoundException('File not found');
    }

    const fileUrl = sourceFilesUrls[fileIndex];
    console.log(`[OfferService] Downloading file as stream: ${fileUrl}`);

    // Проверяем что файл существует
    if (!this.fileService.fileExists(fileUrl)) {
      throw new NotFoundException(`File not found: ${fileUrl}`);
    }

    const fullPath = this.fileService.getFullPath(fileUrl);
    if (!fullPath) {
      throw new NotFoundException(`File not found: ${fileUrl}`);
    }

    // Используем getFileStream для получения информации о файле
    const { filename, mimeType } = this.fileService.getFileStream(fileUrl);

    // Создаём новый read stream и оборачиваем в StreamableFile
    const readStream = createReadStream(fullPath);
    const streamableFile = new StreamableFile(readStream);

    return {
      streamableFile,
      filename,
      mimeType,
    };
  }
}