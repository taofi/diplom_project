import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @IsString({ message: 'Slug must be a string' })
  @IsOptional()
  slug?: string;

  @IsString({ message: 'Icon must be a string' })
  @IsOptional()
  icon?: string;

  @IsString({ message: 'Color must be a string' })
  @IsOptional()
  color?: string;

  @IsString({ message: 'Image must be a string' })
  @IsOptional()
  image?: string;

  @IsOptional()
  parentId?: number;

  @IsOptional()
  position?: number;
}
