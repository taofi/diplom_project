import { IsEmail, IsString, MinLength, IsOptional, IsArray } from 'class-validator';
import { UserRoleType } from '../../db/models/user.model';

export class RegisterDto {
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString()
  @MinLength(1, { message: 'Name is required' })
  name: string;

  @IsOptional()
  @IsArray()
  roles?: UserRoleType[] = ['user'];

  @IsOptional()
  @IsString()
  locale?: string = 'ru';
}
