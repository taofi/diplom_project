import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
