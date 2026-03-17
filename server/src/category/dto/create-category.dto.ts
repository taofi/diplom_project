import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

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

  @IsNumber({}, { message: 'ParentId must be a number' })
  @IsOptional()
  parentId?: number;

  @IsNumber({}, { message: 'Position must be a number' })
  @IsOptional()
  position?: number;
}
