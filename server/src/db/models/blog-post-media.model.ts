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
} from 'sequelize-typescript';
import { BlogPost } from './blog-post.model';

export enum BlogMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  YOUTUBE = 'youtube',
}

@Table({ tableName: 'blog_post_media', timestamps: false })
export class BlogPostMedia extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => BlogPost)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare blog_post_id: number;

  @Column(DataType.ENUM(...Object.values(BlogMediaType)))
  declare media_type: BlogMediaType;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare url: string; // Для image/video - ссылка на файл, для youtube - video ID

  @Default(0)
  @Column(DataType.INTEGER)
  declare sort_order: number;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare caption: string | null;

  @BelongsTo(() => BlogPost)
  declare blog_post: BlogPost;
}
