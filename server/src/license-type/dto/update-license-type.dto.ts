import { IsOptional, IsString } from 'class-validator';

export class UpdateLicenseTypeDto {
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;
}


