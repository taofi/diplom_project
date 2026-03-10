import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';
import { ProductLicense } from './product-license.model';
import { Order } from './order.model';

@Table({ tableName: 'user_products', timestamps: false })
export class UserProduct extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare user_id: number;

  @ForeignKey(() => ProductLicense)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare product_license_id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare order_id: number;

  @CreatedAt
  declare purchased_at: Date;

  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => ProductLicense)
  declare product_license: ProductLicense;

  @BelongsTo(() => Order)
  declare order: Order;
}
