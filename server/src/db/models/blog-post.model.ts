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
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';
import { BlogPostTranslation } from './blog-post-translation.model';
import { BlogPostMedia } from './blog-post-media.model';

@Table({ tableName: 'blog_posts', timestamps: true })
export class BlogPost extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare author_id: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare is_published: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  declare published_at: Date | null;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  // Associations
  @BelongsTo(() => User, 'author_id')
  declare author: User;

  @HasMany(() => BlogPostTranslation, 'blog_post_id')
  declare translations: BlogPostTranslation[];

  @HasMany(() => BlogPostMedia, 'blog_post_id')
  declare media: BlogPostMedia[];
}
