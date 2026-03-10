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
  HasOne,
  CreatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';
import { ChatRoom } from './chat-room.model';
import { ChatMessage } from './chat-message.model';
import { CustomOrder } from './custom-order.model';

export enum ChatOfferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
}

@Table({ tableName: 'chat_offers', timestamps: false })
export class ChatOffer extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => ChatRoom)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare chat_room_id: number;

  @ForeignKey(() => ChatMessage)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare message_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare seller_id: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare description: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare price: number;

  @Column({ type: DataType.DATE, allowNull: false })
  declare deadline: Date;

  @Default(ChatOfferStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(ChatOfferStatus)))
  declare status: ChatOfferStatus;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  declare responded_at: Date | null;

  @CreatedAt
  declare created_at: Date;

  // Associations
  @BelongsTo(() => ChatRoom)
  declare chat_room: ChatRoom;

  @BelongsTo(() => ChatMessage)
  declare message: ChatMessage;

  @BelongsTo(() => User, 'seller_id')
  declare seller: User;

  @HasOne(() => CustomOrder, 'chat_offer_id')
  declare custom_order: CustomOrder;
}
