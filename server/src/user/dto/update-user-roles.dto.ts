import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../db/models/user.model';

export class UpdateUserRolesDto {
  @IsArray({ message: 'Roles must be an array' })
  @IsOptional()
  roles?: UserRole[];
}
