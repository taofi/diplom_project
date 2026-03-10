import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BlogPost } from '../../db/models/blog-post.model';
import { FindOptions, FindAndCountOptions } from 'sequelize';
import { Op } from 'sequelize';
import { CreateBlogPostDto } from '../dto/create-blog-post.dto';
import { UpdateBlogPostDto } from '../dto/update-blog-post.dto';

interface BlogPostQuery {
  page?: number;
  limit?: number;
  isPublished?: boolean;
  category?: string;
  tags?: string;
  search?: string;
}

type BlogPostWhereOptions = FindOptions['where'] & {
  is_published?: boolean;
  category?: string;
  tags?: { [Op.iLike]: string };
  [Op.or]?: Array<{
    title?: { [Op.iLike]: string };
    excerpt?: { [Op.iLike]: string };
    content?: { [Op.iLike]: string };
  }>;
};

@Injectable()
export class BlogPostRepository {
  constructor(
    @InjectModel(BlogPost)
    private readonly blogPostModel: typeof BlogPost,
  ) {}

  async findAll(options?: FindOptions): Promise<BlogPost[]> {
    return this.blogPostModel.findAll(options);
  }

  async findById(id: number, options?: FindOptions): Promise<BlogPost | null> {
    return this.blogPostModel.findByPk(id, options);
  }

  async findBySlug(
    slug: string,
    options?: FindOptions,
  ): Promise<BlogPost | null> {
    return this.blogPostModel.findOne({
      where: { slug },
      ...options,
    });
  }

  async findAndCountAll(
    query: BlogPostQuery = {},
  ): Promise<{ rows: BlogPost[]; count: number }> {
    const { page = 1, limit = 10, isPublished, category, tags, search } = query;
    const offset = (page - 1) * limit;

    const where: BlogPostWhereOptions = {};

    if (isPublished !== undefined) {
      where.is_published = isPublished;
    }

    if (category) {
      where.category = category;
    }

    if (tags) {
      where.tags = { [Op.iLike]: `%${tags}%` };
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { excerpt: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const options: FindAndCountOptions = {
      where,
      offset,
      limit,
      order: [
        ['published_at', 'DESC'],
        ['created_at', 'DESC'],
      ],
    };

    return this.blogPostModel.findAndCountAll(options);
  }

  async create(data: CreateBlogPostDto): Promise<BlogPost> {
    return this.blogPostModel.create(data as any);
  }

  async update(id: number, data: UpdateBlogPostDto): Promise<BlogPost> {
    const blogPost = await this.findById(id);
    if (!blogPost) {
      throw new NotFoundException('Blog post not found');
    }

    return blogPost.update(data as any);
  }

  async delete(id: number): Promise<void> {
    const blogPost = await this.findById(id);
    if (!blogPost) {
      throw new NotFoundException('Blog post not found');
    }

    await blogPost.destroy();
  }
}
