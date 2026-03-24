# Серверная архитектура: Система заказов на редактирование

## Обзор

Серверная часть построена на NestJS с использованием Sequelize ORM. Новая система заказов заменит существующие модели `ChatOffer` и `CustomOrder`.

---

## 1. Новая модель данных (Offer Model)

### 1.1 Добавление типов файлов в enum

В файле `server/src/types/base/file.types.ts`:

```typescript
export enum MediaFolder {
  PRODUCT = 'product',
  TEMP = 'temp',
  OFFERS = 'offers', // НОВЫЙ - для превью заказов
}

export enum FileFolder {
  PRODUCT = 'product',
  TEMP = 'temp',
  OFFERS = 'offers', // НОВЫЙ - для исходников заказов
}
```

### 1.2 Структура хранения файлов

```
server/
├── public/
│   └── media/
│       └── offers/
│           └── {offer_id}/
│               ├── preview.jpg      # Превью (водяной знак)
│               └── preview.webp     # Превью в webp
│
└── files/
    └── offers/
        └── {offer_id}/
            ├── source1.psd         # Исходные файлы
            ├── source2.ai
            └── archive.zip
```

### 1.3 Модель Offer

### Файл: `server/src/db/models/offer.model.ts`

```typescript
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  IsJson,
} from 'sequelize-typescript';
import { User } from './user.model';
import { ChatRoom } from './chat-room.model';

export enum OfferStatus {
  WAITING_AUTHOR = 'waiting_author',
  WAITING_USER = 'waiting_user',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  AWAITING_PAYMENT = 'awaiting_payment',
  COMPLETED = 'completed',
}

// НОВЫЕ enum для типов файлов
export enum OfferFileType {
  PREVIEW = 'preview',
  SOURCE = 'source',
}

// НОВАЯ таблица для связывания файлов с заказами
export interface OfferFile {
  id: number;
  offer_id: number;
  type: OfferFileType;
  original_name: string;
  filename: string;
  url: string; // Публичный URL (public/...) для preview или private для source
  size: number;
  mime_type: string;
  created_at: Date;
}

@Table({ tableName: 'offers', timestamps: true })
export class Offer extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => ChatRoom)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare chat_room_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare creator_id: number; // Заказчик (тот, кто создал заказ)

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare author_id: number; // Автор (исполнитель)

  @Column({ type: DataType.TEXT, allowNull: false })
  declare description: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare price: number;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(10, 2) })
  declare original_price: number | null; // Если автор изменил цену

  @Default(OfferStatus.WAITING_AUTHOR)
  @Column(DataType.ENUM(...Object.values(OfferStatus)))
  declare status: OfferStatus;

  @AllowNull(true)
  @Column({ type: DataType.STRING(500) })
  declare preview_url: string | null; // Превью работы (водяной знак)

  @AllowNull(true)
  @IsJson
  @Column({ type: DataType.TEXT })
  declare source_files_urls: string | null; // JSON массив защищённых ссылок

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  declare is_paid: boolean;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  declare paid_at: Date | null;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  // Associations
  @BelongsTo(() => ChatRoom)
  declare chat_room: ChatRoom;

  @BelongsTo(() => User, 'creator_id')
  declare creator: User;

  @BelongsTo(() => User, 'author_id')
  declare author: User;
}

// НОВАЯ: Таблица для хранения информации о файлах заказа
export class OfferFile extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Offer)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare offer_id: number;

  @Column({
    type: DataType.ENUM(OfferFileType.PREVIEW, OfferFileType.SOURCE),
    allowNull: false,
  })
  declare type: OfferFileType;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare original_name: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare filename: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare url: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare size: number;

  @Column({ type: DataType.STRING(100) })
  declare mime_type: string;

  @CreatedAt
  declare created_at: Date;

  @BelongsTo(() => Offer)
  declare offer: Offer;
}

### 1.4 Расширение FileService

В файле `server/src/common/services/file.service.ts` добавить методы:

```typescript
// Сохранение превью заказа
async saveOfferPreview(
  file: Express.Multer.File,
  offerId: number,
): Promise<{ url: string; filename: string }> {
  return this.moveTempMediaToOffer(file, offerId);
}

// Сохранение исходного файла заказа
async saveOfferSourceFile(
  file: Express.Multer.File,
  offerId: number,
): Promise<{ url: string; filename: string }> {
  return this.moveTempFileToOffer(file, offerId);
}

// Перемещение временного файла в папку оффера (media - public)
private async moveTempMediaToOffer(
  file: Express.Multer.File,
  offerId: number,
): Promise<{ url: string; filename: string }> {
  const targetDir = this.getMediaPath(MediaFolder.OFFERS, offerId);
  const filename = `${Date.now()}-${file.originalname}`;
  const targetPath = path.join(targetDir, filename);
  
  await fs.mkdir(targetDir, { recursive: true });
  await fs.rename(file.path, targetPath);
  
  const url = `/media/offers/${offerId}/${filename}`;
  return { url, filename };
}

// Перемещение временного файла в папку оффера (files - private)
private async moveTempFileToOffer(
  file: Express.Multer.File,
  offerId: number,
): Promise<{ url: string; filename: string }> {
  const targetDir = this.getFilePath(FileFolder.OFFERS, offerId);
  const filename = `${Date.now()}-${file.originalname}`;
  const targetPath = path.join(targetDir, filename);
  
  await fs.mkdir(targetDir, { recursive: true });
  await fs.rename(file.path, targetPath);
  
  // Для исходников - приватный URL
  const url = `/files/offers/${offerId}/${filename}`;
  return { url, filename };
}

// Получение пути для медиа (public)
private getMediaPath(folder: MediaFolder, offerId: number): string {
  return path.join(
    this.configService.get<string>('PUBLIC_DIR') || './public',
    'media',
    folder === MediaFolder.OFFERS ? 'offers' : folder,
    folder === MediaFolder.OFFERS ? String(offerId) : '',
  );
}

// Получение пути для файлов (private)
private getFilePath(folder: FileFolder, offerId: number): string {
  return path.join(
    this.configService.get<string>('UPLOAD_DIR') || './files',
    folder === FileFolder.OFFERS ? 'offers' : folder,
    folder === FileFolder.OFFERS ? String(offerId) : '',
  );
}
```

---

## 2. DTO (Data Transfer Objects)

### Файл: `server/src/chat/dto/offer.dto.ts`

```typescript
// Создание заказа
export class CreateOfferDto {
  @IsInt()
  @Min(1)
  chatRoomId: number;

  @IsInt()
  @Min(1)
  authorId: number; // ID автора (исполнителя)

  @IsString()
  @MinLength(1)
  description: string;

  @IsNumber()
  @Min(0)
  price: number;
}

// Изменение цены (от автора)
export class CounterOfferDto {
  @IsNumber()
  @Min(0)
  newPrice: number;
}

// Загрузка файлов (от автора)
export class UploadFilesDto {
  @IsString()
  previewUrl: string; // URL превью

  @IsArray()
  @IsString({ each: true })
  sourceFilesUrls: string[]; // Массив URL исходников
}

// Оплата заказа
export class PayOrderDto {
  // Для реального эквайринга:
  // paymentMethodId?: string;
  
  // Для имитации:
  @IsBoolean()
  @IsOptional()
  simulateSuccess?: boolean = true;
}
```

---

## 3. Repository

### Файл: `server/src/chat/repositories/offer.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
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
    if (!offer) throw new NotFoundException('Offer not found');
    
    offer.status = status;
    await offer.save();
    return offer;
  }

  async updatePrice(id: number, newPrice: number, originalPrice: number): Promise<Offer> {
    const offer = await this.findById(id);
    if (!offer) throw new NotFoundException('Offer not found');
    
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
    if (!offer) throw new NotFoundException('Offer not found');
    
    offer.preview_url = previewUrl;
    offer.source_files_urls = JSON.stringify(sourceFilesUrls);
    await offer.save();
    return offer;
  }

  async markAsPaid(id: number): Promise<Offer> {
    const offer = await this.findById(id);
    if (!offer) throw new NotFoundException('Offer not found');
    
    offer.is_paid = true;
    offer.paid_at = new Date();
    offer.status = OfferStatus.COMPLETED;
    await offer.save();
    return offer;
  }
}
```

---

## 4. Сервис (Business Logic)

### Файл: `server/src/chat/services/offer.service.ts`

```typescript
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

  // 1. Создать заказ (Заказчик)
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

  // 2. Принять заказ (Автор)
  async acceptOffer(offerId: number, userId: number): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.author_id !== userId) throw new ForbiddenException('Not your offer');

    const updated = await this.offerRepository.updateStatus(
      offerId, 
      OfferStatus.IN_PROGRESS,
    );

    this.chatGateway.notifyStatusChanged(updated);
    return updated;
  }

  // 3. Отклонить заказ (Любой)
  async rejectOffer(offerId: number, userId: number): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) throw new NotFoundException('Offer not found');
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

  // 4. Изменить цену (Автор)
  async counterOffer(offerId: number, userId: number, dto: CounterOfferDto): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.author_id !== userId) throw new ForbiddenException('Not your offer');
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

  // 5. Подтвердить цену (Заказчик)
  async confirmPrice(offerId: number, userId: number): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.creator_id !== userId) throw new ForbiddenException('Not your offer');
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

  // 6. Загрузить файлы (Автор)
  async uploadFiles(offerId: number, userId: number, dto: UploadFilesDto): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.author_id !== userId) throw new ForbiddenException('Not your offer');
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

  // 7. Оплатить заказ (Заказчик)
  async payOrder(offerId: number, userId: number, dto: PayOrderDto): Promise<Offer> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.creator_id !== userId) throw new ForbiddenException('Not your order');
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

  // 8. Получить заказ с файлами (с проверкой доступа)
  async getOfferFiles(offerId: number, userId: number): Promise<{
    preview_url: string | null;
    source_files_urls: string[] | null;
  }> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) throw new NotFoundException('Offer not found');

    // Проверка: пользователь - участник заказа
    if (offer.creator_id !== userId && offer.author_id !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const result: { preview_url: string | null; source_files_urls: string[] | null } = {
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
```

---

## 5. Контроллер (API Endpoints)

### Файл: `server/src/chat/chat-offers.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OfferService } from './services/offer.service';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOfferDto, CounterOfferDto, UploadFilesDto, PayOrderDto } from './dto/offer.dto';

@Controller('chat/offers')
@UseGuards(JwtAuthGuard)
export class ChatOffersController {
  constructor(private readonly offerService: OfferService) {}

  /**
   * POST /chat/offers
   * Создать заказ (Заказчик)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOffer(
    @CurrentUserId() userId: number,
    @Body() dto: CreateOfferDto,
  ) {
    return this.offerService.createOffer(userId, dto);
  }

  /**
   * GET /chat/offers/:id
   * Получить заказ
   */
  @Get(':id')
  async getOffer(@Param('id') id: string) {
    return this.offerService.getOfferFiles(parseInt(id, 10), 0); // Без проверки user для публичного просмотра
  }

  /**
   * POST /chat/offers/:id/accept
   * Принять заказ (Автор)
   */
  @Post(':id/accept')
  @HttpCode(HttpStatus.CREATED)
  async acceptOffer(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ) {
    return this.offerService.acceptOffer(parseInt(id, 10), userId);
  }

  /**
   * POST /chat/offers/:id/reject
   * Отклонить заказ (Любой участник)
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectOffer(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ) {
    return this.offerService.rejectOffer(parseInt(id, 10), userId);
  }

  /**
   * POST /chat/offers/:id/counter
   * Изменить цену (Автор)
   */
  @Post(':id/counter')
  @HttpCode(HttpStatus.OK)
  async counterOffer(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Body() dto: CounterOfferDto,
  ) {
    return this.offerService.counterOffer(parseInt(id, 10), userId, dto);
  }

  /**
   * POST /chat/offers/:id/confirm-price
   * Подтвердить цену (Заказчик)
   */
  @Post(':id/confirm-price')
  @HttpCode(HttpStatus.OK)
  async confirmPrice(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ) {
    return this.offerService.confirmPrice(parseInt(id, 10), userId);
  }

  /**
   * POST /chat/offers/:id/files
   * Загрузить файлы (Автор)
   */
  @Post(':id/files')
  @HttpCode(HttpStatus.CREATED)
  async uploadFiles(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Body() dto: UploadFilesDto,
  ) {
    return this.offerService.uploadFiles(parseInt(id, 10), userId, dto);
  }

  /**
   * POST /chat/offers/:id/pay
   * Оплатить заказ (Заказчик)
   */
  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  async payOrder(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Body() dto: PayOrderDto,
  ) {
    return this.offerService.payOrder(parseInt(id, 10), userId, dto);
  }

  /**
   * GET /chat/offers/:id/files
   * Получить ссылки на файлы (с проверкой доступа)
   */
  @Get(':id/files')
  async getFiles(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ) {
    return this.offerService.getOfferFiles(parseInt(id, 10), userId);
  }

  /**
   * GET /chat/rooms/:roomId/offers
   * Получить все заказы в чате
   */
  @Get('rooms/:roomId/offers')
  async getRoomOffers(@Param('roomId') roomId: string) {
    // TODO: Реализовать получение заказов комнаты
    return [];
  }
}
```

---

## 6. Модуль

### Файл: `server/src/chat/chat.module.ts` (изменения)

```typescript
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChatController } from './chat.controller';
import { ChatOffersController } from './chat-offers.controller'; // НОВЫЙ
import { ChatService } from './chat.service';
import { OfferService } from './services/offer.service'; // НОВЫЙ
import { ChatGateway } from './chat.gateway';
import { ChatRoom, ChatMessage, ChatOffer, CustomOrder, Offer } from '../db/models'; // Добавить Offer
import { OfferRepository } from './repositories/offer.repository'; // НОВЫЙ

@Module({
  imports: [
    SequelizeModule.forFeature([
      ChatRoom,
      ChatMessage,
      ChatOffer,
      CustomOrder,
      Offer, // НОВЫЙ
    ]),
  ],
  controllers: [ChatController, ChatOffersController],
  providers: [
    ChatService,
    OfferService, // НОВЫЙ
    ChatGateway,
    OfferRepository, // НОВЫЙ
  ],
  exports: [OfferService],
})
export class ChatModule {}
```

---

## 7. WebSocket События (Gateway)

### Дополнить `server/src/chat/chat.gateway.ts`

```typescript
// Добавить методы для уведомлений

notifyOfferCreated(offer: Offer) {
  this.server.to(`room-${offer.chat_room_id}`).emit('offer:created', {
    offer: this.serializeOffer(offer),
  });
}

notifyStatusChanged(offer: Offer) {
  this.server.to(`room-${offer.chat_room_id}`).emit('offer:statusChanged', {
    offer: this.serializeOffer(offer),
  });
}

notifyPriceChanged(offer: Offer) {
  this.server.to(`room-${offer.chat_room_id}`).emit('offer:priceChanged', {
    offer: this.serializeOffer(offer),
  });
}

notifyFilesUploaded(offer: Offer) {
  this.server.to(`room-${offer.chat_room_id}`).emit('offer:filesUploaded', {
    offer: this.serializeOffer(offer),
  });
}

notifyPaymentCompleted(offer: Offer) {
  this.server.to(`room-${offer.chat_room_id}`).emit('offer:paid', {
    offer: this.serializeOffer(offer),
  });
}

private serializeOffer(offer: Offer) {
  return {
    id: offer.id,
    chat_room_id: offer.chat_room_id,
    creator_id: offer.creator_id,
    author_id: offer.author_id,
    description: offer.description,
    price: offer.price,
    original_price: offer.original_price,
    status: offer.status,
    preview_url: offer.preview_url,
    source_files_urls: offer.source_files_urls ? JSON.parse(offer.source_files_urls) : null,
    is_paid: offer.is_paid,
    paid_at: offer.paid_at,
    created_at: offer.created_at,
    updated_at: offer.updated_at,
  };
}
```

---

## 8. Миграция БД

### Файл: `server/src/db/migrations/XXXXXXXXXXXXXX-create-offers-table.js`

```javascript
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Создать новую таблицу offers
    await queryInterface.createTable('offers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      chat_room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_rooms',
          key: 'id',
        },
      },
      creator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      author_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      original_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(
          'waiting_author',
          'waiting_user', 
          'rejected',
          'in_progress',
          'awaiting_payment',
          'completed'
        ),
        defaultValue: 'waiting_author',
      },
      preview_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      source_files_urls: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_paid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 2. Удалить старые таблицы (после тестирования)
    // await queryInterface.dropTable('custom_order_revisions');
    // await queryInterface.dropTable('custom_orders');
    // await queryInterface.dropTable('chat_offers');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('offers');
  },
};
```

---

## 9. Интеграция с чатом

### Создание заказа из чата

Когда заказчик нажимает "Создать заказ" в чате:

1. **Frontend** отправляет POST на `/chat/offers` с данными
2. **OfferService** создаёт запись в таблице `offers`
3. **ChatGateway** отправляет WebSocket событие `offer:created` в комнату
4. **Frontend** обновляет UI, показывая новый заказ

### Отображение в сообщениях

Заказ отображается как специальное сообщение в чате:
- Тип сообщения: `ORDER`
- В body: ID заказа
- Рендерится как компонент `OrderCard`