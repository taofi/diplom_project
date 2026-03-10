import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';
import { ChatRoom } from './chat-room.model';
import { ChatOffer } from './chat-offer.model';
import { CustomOrderRevision } from './custom-order-revision.model';

export enum CustomOrderStatus {
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  REVISION = 'revision',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Table({ tableName: 'custom_orders', timestamps: true })
export class CustomOrder extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => ChatOffer)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare chat_offer_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare buyer_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare seller_id: number;

  @ForeignKey(() => ChatRoom)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare chat_room_id: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare description: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare price: number;

  @Default(CustomOrderStatus.IN_PROGRESS)
  @Column(DataType.ENUM(...Object.values(CustomOrderStatus)))
  declare status: CustomOrderStatus;

  @Column({ type: DataType.DATE, allowNull: false })
  declare deadline: Date;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  // Associations
  @BelongsTo(() => ChatOffer, 'chat_offer_id')
  declare chat_offer: ChatOffer;

  @BelongsTo(() => User, 'buyer_id')
  declare buyer: User;

  @BelongsTo(() => User, 'seller_id')
  declare seller: User;

  @BelongsTo(() => ChatRoom, 'chat_room_id')
  declare chat_room: ChatRoom;

  @HasMany(() => CustomOrderRevision, 'custom_order_id')
  declare revisions: CustomOrderRevision[];
}
