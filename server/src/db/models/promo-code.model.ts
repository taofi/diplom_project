import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Unique,
  Default,
  AllowNull,
  HasMany,
} from 'sequelize-typescript';
import { Order } from './order.model';
import { PromoCodeUsage } from './promo-code-usage.model';

export enum DiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

@Table({ tableName: 'promo_codes', timestamps: false })
export class PromoCode extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Unique
  @Column({ type: DataType.STRING(50), allowNull: false })
  declare code: string;

  @Column(DataType.ENUM(...Object.values(DiscountType)))
  declare discount_type: DiscountType;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare discount_value: number;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare max_uses: number | null; // NULL = безлимитный

  @Default(0)
  @Column(DataType.INTEGER)
  declare current_uses: number;

  @Column({ type: DataType.DATE, allowNull: false })
  declare valid_from: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare valid_until: Date;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare is_active: boolean;

  @HasMany(() => Order, 'promo_code_id')
  declare orders: Order[];

  @HasMany(() => PromoCodeUsage, 'promo_code_id')
  declare usages: PromoCodeUsage[];
}
