import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { LicenseType } from './license-type.model';

@Table({ tableName: 'license_type_translations', timestamps: false })
export class LicenseTypeTranslation extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => LicenseType)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare license_type_id: number;

  @Column({ type: DataType.STRING(5), allowNull: false })
  declare locale: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @BelongsTo(() => LicenseType)
  declare license_type: LicenseType;
}
