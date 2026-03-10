import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { CustomOrder } from './custom-order.model';

@Table({ tableName: 'custom_order_revisions', timestamps: false })
export class CustomOrderRevision extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => CustomOrder)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare custom_order_id: number;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare file_url: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare comment: string | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare is_approved: boolean;

  @CreatedAt
  declare created_at: Date;

  @BelongsTo(() => CustomOrder)
  declare custom_order: CustomOrder;
}
