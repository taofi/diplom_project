import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  HasMany,
  BelongsToMany,
  CreatedAt,
} from 'sequelize-typescript';
import { CategoryTranslation } from './category-translation.model';
import { Product } from './product.model';
import { ProductCategory } from './product-category.model';

@Table({ tableName: 'categories', timestamps: false })
export class Category extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @CreatedAt
  declare created_at: Date;

  @HasMany(() => CategoryTranslation, 'category_id')
  declare translations: CategoryTranslation[];

  @BelongsToMany(() => Product, () => ProductCategory)
  declare products: Product[];
}


