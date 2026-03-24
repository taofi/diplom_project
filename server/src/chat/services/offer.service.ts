import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OfferRepository } from '../repositories/offer.repository';
import { Offer, OfferStatus } from '../../db/models/offer.model';
import { CreateOfferDto, CounterOfferDto, UploadFilesDto, PayOrderDto } from '../dto/offer.dto';
import { ChatGateway } from '../chat.gateway';

@Injectable()
export class OfferService {
  constructor(
    private offerRepository: OfferRepository,
    private chatGateway: ChatGateway,
  ) {}

  /**
   * Создать заказ (Заказчик)
   */
  async createOffer(userId: number, dto: CreateOfferDto): Promise<Offer> {
    const offer = await this.offerRepository.create({
      chat_room_id: dto.chatRoomId,
      creator_id: userId,
      author_id: dto.authorId,
      description: dto.description,
      price: dto.price,
      status: OfferStatus.WAITING_AUTHOR,
    });

    // WebSocket: уведомить автора
    this.chatGateway.notifyOfferCreated(offer);

    return offer;
  }

  /**
   * Принять заказ (Автор)
   */
  async acceptOffer(offerId: number, userId: number): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    if (offer.author_id !== userId) {
      throw new ForbiddenException('Not your offer');
    }

    const updated = await this.offerRepository.updateStatus(
      offerId,
      OfferStatus.IN_PROGRESS,
    );

    this.chatGateway.notifyStatusChanged(updated);
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

    this.chatGateway.notifyStatusChanged(updated);
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

    this.chatGateway.notifyPriceChanged(updated);
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

    this.chatGateway.notifyStatusChanged(updated);
    return updated;
  }

  /**
   * Загрузить файлы (Автор)
   */
  async uploadFiles(offerId: number, userId: number, dto: UploadFilesDto): Promise<Offer> {
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

    const updated = await this.offerRepository.setFiles(
      offerId,
      dto.previewUrl,
      dto.sourceFilesUrls,
    );

    // Меняем статус на awaiting_payment
    await this.offerRepository.updateStatus(offerId, OfferStatus.AWAITING_PAYMENT);
    updated.status = OfferStatus.AWAITING_PAYMENT;

    this.chatGateway.notifyFilesUploaded(updated);
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
      this.chatGateway.notifyPaymentCompleted(updated);
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
    } = {
      preview_url: null,
      source_files_urls: null,
    };

    // Превью доступно если awaiting_payment или completed
    if (offer.status === OfferStatus.AWAITING_PAYMENT || offer.status === OfferStatus.COMPLETED) {
      result.preview_url = offer.preview_url;
    }

    // Исходники доступны ТОЛЬКО если completed И is_paid
    if (offer.status === OfferStatus.COMPLETED && offer.is_paid) {
      result.source_files_urls = offer.source_files_urls
        ? JSON.parse(offer.source_files_urls)
        : null;
    }

    return result;
  }
}