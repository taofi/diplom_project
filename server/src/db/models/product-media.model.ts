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
} from 'sequelize-typescript';
import { Product } from './product.model';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Table({ tableName: 'product_media', timestamps: false })
export class ProductMedia extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare product_id: number;

  @Column(DataType.ENUM(...Object.values(MediaType)))
  declare media_type: MediaType;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare url: string;

  @Default(0)
  @Column(DataType.INTEGER)
  declare sort_order: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare is_cover: boolean;

  @BelongsTo(() => Product)
  declare product: Product;
}
