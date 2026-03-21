import { IsArray, IsOptional } from 'class-validator';

export class UpdateUserRolesDto {
  @IsArray({ message: 'Roles must be an array' })
  @IsOptional()
  roles?: string[];
}
