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
} from 'sequelize-typescript';
import { Order } from './order.model';

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

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare order_id: number;

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

  @BelongsTo(() => Order)
  declare order: Order;
}
