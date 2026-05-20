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

export enum OfferFileType {
  PREVIEW = 'preview',
  SOURCE = 'source',
}

export interface IOfferFile {
  id: number;
  offer_id: number;
  type: OfferFileType;
  original_name: string;
  filename: string;
  url: string;
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
  @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
  declare chat_room_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare creator_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare author_id: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare description: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare price: number;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(10, 2) })
  declare original_price: number | null;

  @Default(OfferStatus.WAITING_AUTHOR)
  @Column(DataType.ENUM(...Object.values(OfferStatus)))
  declare status: OfferStatus;

  @AllowNull(true)
  @Column({ type: DataType.STRING(500) })
  declare preview_url: string | null;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  declare source_files_urls: string | null;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  declare creator_attachments_urls: string | null;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  declare author_images_urls: string | null;

  @AllowNull(true)
  @Column({ type: DataType.STRING(500) })
  declare author_file_url: string | null;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  declare is_paid: boolean;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  declare paid_at: Date | null;

  @AllowNull(true)
  @Column({ type: DataType.STRING(255) })
  declare stripe_session_id: string | null;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  @BelongsTo(() => ChatRoom)
  declare chat_room: ChatRoom;

  @BelongsTo(() => User, 'creator_id')
  declare creator: User;

  @BelongsTo(() => User, 'author_id')
  declare author: User;
}

@Table({ tableName: 'offer_files', timestamps: true })
export class OfferFile extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Offer)
  @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
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