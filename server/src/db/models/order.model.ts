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
  HasOne,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';
import { PromoCode } from './promo-code.model';
import { OrderItem } from './order-item.model';
import { Payment } from './payment.model';
import { UserProduct } from './user-product.model';
import { PromoCodeUsage } from './promo-code-usage.model';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Table({ tableName: 'orders', timestamps: true })
export class Order extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(true)
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  declare user_id: number | null;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare guest_email: string | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare total_amount: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  declare discount_amount: number;

  @Default(OrderStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(OrderStatus)))
  declare status: OrderStatus;

  @AllowNull(true)
  @ForeignKey(() => PromoCode)
  @Column(DataType.INTEGER)
  declare promo_code_id: number | null;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare stripe_session_id: string | null;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  // Associations
  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => PromoCode)
  declare promo_code: PromoCode;

  @HasMany(() => OrderItem, 'order_id')
  declare order_items: OrderItem[];

  @HasOne(() => Payment, 'order_id')
  declare payment: Payment;

  @HasMany(() => UserProduct, 'order_id')
  declare user_products: UserProduct[];

  @HasOne(() => PromoCodeUsage, 'order_id')
  declare promo_code_usage: PromoCodeUsage;
}
