import { IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GuestCartItemDto {
  @IsNumber({}, { message: 'Product license ID must be a number' })
  productLicenseId: number;
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
  quantity?: number;
}
