import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { Product } from './product.model';
import { Category } from './category.model';

@Table({ tableName: 'product_categories', timestamps: false })
export class ProductCategory extends Model {
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare product_id: number;

  @ForeignKey(() => Category)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare category_id: number;
}
