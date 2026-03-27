import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
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

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null; // Описание лицензии

  @HasMany(() => LicenseTypeTranslation, 'license_type_id')
  declare translations: LicenseTypeTranslation[];

  @HasMany(() => ProductLicense, 'license_type_id')
  declare product_licenses: ProductLicense[];
}
