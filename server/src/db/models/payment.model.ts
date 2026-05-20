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
  CreatedAt,
  AllowNull,
} from 'sequelize-typescript';
import { Order } from './order.model';
import { Offer } from './offer.model';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Table({ tableName: 'payments', timestamps: false })
export class Payment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  // FK на Order (для checkout) или Offer (для оферов в чате) — хотя бы один из двух
  @AllowNull(true)
  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare order_id: number | null;

  @AllowNull(true)
  @ForeignKey(() => Offer)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare offer_id: number | null;

  @Column({ type: DataType.STRING(50), allowNull: false })
  declare provider: string; // stripe | yookassa

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare provider_payment_id: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare amount: number;

  @Default(PaymentStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(PaymentStatus)))
  declare status: PaymentStatus;

  @CreatedAt
  declare created_at: Date;

  // Ссылки на связанные сущности
  @BelongsTo(() => Order)
  declare order: Order;

  @BelongsTo(() => Offer)
  declare offer: Offer;
}
