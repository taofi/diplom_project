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
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Product } from './product.model';
import { UserProduct } from './user-product.model';
import { ChatMessage } from './chat-message.model';

export enum ChatRoomStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export enum ChatRoomVisibility {
  PENDING = 'pending',
  VISIBLE = 'visible',
}

@Table({ tableName: 'chat_rooms', timestamps: true })
export class ChatRoom extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare buyer_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare seller_id: number;

  @AllowNull(true)
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, onDelete: 'CASCADE' })
  declare product_id: number | null;

  @AllowNull(true)
  @ForeignKey(() => UserProduct)
  @Column({ type: DataType.INTEGER, onDelete: 'CASCADE' })
  declare user_product_id: number | null;

  @Default(ChatRoomStatus.OPEN)
  @Column(DataType.ENUM(...Object.values(ChatRoomStatus)))
  declare status: ChatRoomStatus;

  @Default(ChatRoomVisibility.PENDING)
  @Column(DataType.ENUM(...Object.values(ChatRoomVisibility)))
  declare visibility: ChatRoomVisibility;

  @Column({ type: DataType.DATE, allowNull: true })
  declare last_message_at: Date | null;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  @BelongsTo(() => User, 'buyer_id')
  declare buyer: User;

  @BelongsTo(() => User, 'seller_id')
  declare seller: User;

  @BelongsTo(() => Product, 'product_id')
  declare product: Product;

  @BelongsTo(() => UserProduct, 'user_product_id')
  declare user_product: UserProduct;

  @HasMany(() => ChatMessage, 'chat_room_id')
  declare messages: ChatMessage[];

}


