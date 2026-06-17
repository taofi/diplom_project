import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Product } from './product.model';
import { LicenseType } from './license-type.model';
import { CartItem } from './cart-item.model';
import { OrderItem } from './order-item.model';
import { UserProduct } from './user-product.model';

@Table({ tableName: 'product_licenses', timestamps: false })
export class ProductLicense extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
  declare product_id: number;

  @ForeignKey(() => LicenseType)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare license_type_id: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare price: number;

  @BelongsTo(() => Product)
  declare product: Product;

  @BelongsTo(() => LicenseType)
  declare license_type: LicenseType;

  @HasMany(() => CartItem, 'product_license_id')
  declare cart_items: CartItem[];

  @HasMany(() => OrderItem, 'product_license_id')
  declare order_items: OrderItem[];

  @HasMany(() => UserProduct, 'product_license_id')
  declare user_products: UserProduct[];
}


