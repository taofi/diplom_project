import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../../db/models/user.model';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email must be valid' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'Address must be a string' })
  @IsOptional()
  address?: string;

  @IsEnum(UserRole, { message: 'Invalid role' })
  @IsOptional()
  role?: UserRole;

  @IsString({ message: 'Company name must be a string' })
  @IsOptional()
  companyName?: string;

  @IsString({ message: 'Company website must be a string' })
  @IsOptional()
  companyWebsite?: string;

  @IsString({ message: 'Company tax ID must be a string' })
  @IsOptional()
  companyTaxId?: string;

  @IsString({ message: 'Company logo must be a string' })
  @IsOptional()
  companyLogo?: string;
}
