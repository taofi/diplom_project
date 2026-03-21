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
import { ChatRoom } from './chat-room.model';
import { ChatMessage } from './chat-message.model';
import { ChatOffer } from './chat-offer.model';
import { CustomOrder } from './custom-order.model';
import { UserRole as UserRoleModel } from './user-role.model';

export enum UserRoleEnum {
  ADMIN = 'admin',
  USER = 'user',
  AUTHOR = 'author',
}

// Тип для роли пользователя (строка, не enum в БД)
export type UserRoleType = 'admin' | 'user' | 'author';

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

  @Default('ru')
  @Column({ type: DataType.STRING(5) })
  declare locale: string;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  // Associations
  @HasMany(() => UserRoleModel)
  declare user_roles: UserRoleModel[];
  @HasMany(() => Product, 'seller_id')
  declare products: Product[];

  @HasMany(() => CartItem, 'user_id')
  declare cart_items: CartItem[];

  @HasMany(() => Order, 'user_id')
  declare orders: Order[];

  @HasMany(() => UserProduct, 'user_id')
  declare user_products: UserProduct[];

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

  // Явная сериализация - роли теперь берутся из связанной таблицы user_roles
  toJSON(): Record<string, unknown> {
    const values: Record<string, unknown> = { ...super.toJSON() };
    // Убираем user_roles из вывода, возвращаем роли в виде массива
    const roles = this.user_roles?.map((ur) => ur.role) || ['user'];
    values.role = roles;
    delete (values as Record<string, unknown>).user_roles;
    return values;
  }
}
