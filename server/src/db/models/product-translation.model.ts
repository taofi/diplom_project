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
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare shortDescription: string;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'product_id',
    onDelete: 'CASCADE',
  })
  declare productId: number;

  @BelongsTo(() => Product)
  declare product: Product;

  @Column({
    type: DataType.ENUM,
    values: Object.values(Language),
    allowNull: false,
  })
  declare language: Language;
}


