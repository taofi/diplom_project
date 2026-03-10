import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateBlogPostDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsString({ message: 'Slug must be a string' })
  @IsOptional()
  slug?: string;

  @IsString({ message: 'Excerpt must be a string' })
  @IsOptional()
  excerpt?: string;

  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  content: string;

  @IsString({ message: 'Cover image must be a string' })
  @IsOptional()
  coverImage?: string;

  @IsString({ message: 'Meta title must be a string' })
  @IsOptional()
  metaTitle?: string;

  @IsString({ message: 'Meta description must be a string' })
  @IsOptional()
  metaDescription?: string;

  @IsBoolean({ message: 'Is published must be a boolean' })
  @IsOptional()
  isPublished?: boolean;

  @IsOptional()
  publishedAt?: Date;

  @IsString({ message: 'Author must be a string' })
  @IsOptional()
  author?: string;

  @IsString({ message: 'Category must be a string' })
  @IsOptional()
  category?: string;

  @IsString({ message: 'Tags must be a string' })
  @IsOptional()
  tags?: string;
}
