import { IsNumber, IsString, IsArray, ValidateNested, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GuestCartItemDto {
  @IsNumber({}, { message: 'Product license ID must be a number' })
  productLicenseId: number;

  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}

export class GuestCartDto {
  @IsString()
  guestId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItemDto)
  items: GuestCartItemDto[];
}

export class SyncCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItemDto)
  items: GuestCartItemDto[];
}

export class UpdateGuestCartItemDto {
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(0, { message: 'Quantity must be at least 0' })
  @IsOptional()
  quantity?: number;
}
