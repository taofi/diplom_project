import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
} from 'sequelize-typescript';
import { Product } from './product.model';
import { Language } from '../../common/enums/language.enum';

@Table({
  tableName: 'product_translations',
  timestamps: true,
  paranoid: true,
})
export class ProductTranslation extends Model<ProductTranslation> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  shortDescription: string;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  productId: number;

  @BelongsTo(() => Product)
  product: Product;

  @Column({
    type: DataType.ENUM,
    values: Object.values(Language),
    allowNull: false,
  })
  language: Language;
}
