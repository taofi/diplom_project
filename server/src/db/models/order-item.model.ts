import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Order } from './order.model';
import { ProductLicense } from './product-license.model';

@Table({ tableName: 'order_items', timestamps: false })
export class OrderItem extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare order_id: number;

  @ForeignKey(() => ProductLicense)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare product_license_id: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare price_at_purchase: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare quantity: number;

  @BelongsTo(() => Order)
  declare order: Order;

  @BelongsTo(() => ProductLicense)
  declare product_license: ProductLicense;
}
