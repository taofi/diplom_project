import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Unique,
  HasMany,
} from 'sequelize-typescript';
import { LicenseTypeTranslation } from './license-type-translation.model';
import { ProductLicense } from './product-license.model';

@Table({ tableName: 'license_types', timestamps: false })
export class LicenseType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Unique
  @Column({ type: DataType.STRING(50), allowNull: false })
  declare slug: string; // individual | commercial | extended

  @HasMany(() => LicenseTypeTranslation, 'license_type_id')
  declare translations: LicenseTypeTranslation[];

  @HasMany(() => ProductLicense, 'license_type_id')
  declare product_licenses: ProductLicense[];
}
