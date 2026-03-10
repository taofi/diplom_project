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
  HasMany,
  BelongsToMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';
import { ProductMedia } from './product-media.model';
import { ProductTranslation } from './product-translation.model';
import { ProductLicense } from './product-license.model';
import { Category } from './category.model';
import { ProductCategory } from './product-category.model';
import { ChatRoom } from './chat-room.model';

export enum ProductType {
  BRUSH = 'brush',
  ILLUSTRATION = 'illustration',
}

@Table({ tableName: 'products', timestamps: true })
export class Product extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare seller_id: number;

  @Column(DataType.ENUM(...Object.values(ProductType)))
  declare type: ProductType;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare file_url: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare price: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  declare discount_price: number;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare sku: string;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare stock: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare is_featured: boolean;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare main_image: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare is_active: boolean;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  // Associations
  @BelongsTo(() => User, 'seller_id')
  declare seller: User;

  @HasMany(() => ProductMedia, 'product_id')
  declare media: ProductMedia[];

  @HasMany(() => ProductTranslation, 'product_id')
  declare translations: ProductTranslation[];

  @HasMany(() => ProductLicense, 'product_id')
  declare licenses: ProductLicense[];

  @BelongsToMany(() => Category, () => ProductCategory)
  declare categories: Category[];

  @HasMany(() => ChatRoom, 'product_id')
  declare chat_rooms: ChatRoom[];
}
