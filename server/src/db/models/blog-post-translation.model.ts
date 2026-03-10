import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Unique,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BlogPost } from './blog-post.model';

@Table({ tableName: 'blog_post_translations', timestamps: false })
export class BlogPostTranslation extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => BlogPost)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare blog_post_id: number;

  @Column({ type: DataType.STRING(5), allowNull: false })
  declare locale: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare content: string;

  @Unique
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare slug: string;

  @BelongsTo(() => BlogPost)
  declare blog_post: BlogPost;
}
