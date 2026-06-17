import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { PromoCode } from './promo-code.model';
import { Order } from './order.model';
import { User } from './user.model';

@Table({ tableName: 'promo_code_usages', timestamps: false })
export class PromoCodeUsage extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => PromoCode)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare promo_code_id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare order_id: number;

  @AllowNull(true)
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  declare user_id: number | null;

  @CreatedAt
  declare used_at: Date;

  @BelongsTo(() => PromoCode)
  declare promo_code: PromoCode;

  @BelongsTo(() => Order)
  declare order: Order;

  @BelongsTo(() => User)
  declare user: User;
}


