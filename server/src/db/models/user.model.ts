import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Unique,
  Default,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Product } from './product.model';
import { CartItem } from './cart-item.model';
import { Order } from './order.model';
import { UserProduct } from './user-product.model';
import { BlogPost } from './blog-post.model';
import { ChatRoom } from './chat-room.model';
import { ChatMessage } from './chat-message.model';
import { ChatOffer } from './chat-offer.model';
import { CustomOrder } from './custom-order.model';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Table({ tableName: 'users', timestamps: true })
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Unique
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare password_hash: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare avatar_url: string | null;

  @Default(UserRole.USER)
  @Column(DataType.ENUM(...Object.values(UserRole)))
  declare role: UserRole;

  @Default('ru')
  @Column({ type: DataType.STRING(5) })
  declare locale: string;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  // Associations
  @HasMany(() => Product, 'seller_id')
  declare products: Product[];

  @HasMany(() => CartItem, 'user_id')
  declare cart_items: CartItem[];

  @HasMany(() => Order, 'user_id')
  declare orders: Order[];

  @HasMany(() => UserProduct, 'user_id')
  declare user_products: UserProduct[];

  @HasMany(() => BlogPost, 'author_id')
  declare blog_posts: BlogPost[];

  @HasMany(() => ChatRoom, 'buyer_id')
  declare buyer_chat_rooms: ChatRoom[];

  @HasMany(() => ChatRoom, 'seller_id')
  declare seller_chat_rooms: ChatRoom[];

  @HasMany(() => ChatMessage, 'sender_id')
  declare chat_messages: ChatMessage[];

  @HasMany(() => ChatOffer, 'seller_id')
  declare chat_offers: ChatOffer[];

  @HasMany(() => CustomOrder, 'buyer_id')
  declare buyer_custom_orders: CustomOrder[];

  @HasMany(() => CustomOrder, 'seller_id')
  declare seller_custom_orders: CustomOrder[];
}
