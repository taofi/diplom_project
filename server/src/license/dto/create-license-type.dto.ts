import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateLicenseTypeDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: 'Price multiplier must be a number' })
  @IsOptional()
  priceMultiplier?: number;

  @IsString({ message: 'Duration must be a string' })
  @IsOptional()
  duration?: string;

  @IsString({ message: 'Icon must be a string' })
  @IsOptional()
  icon?: string;

  @IsString({ message: 'Color must be a string' })
  @IsOptional()
  color?: string;

  @IsOptional()
  position?: number;
}
