import { IsEmail, IsString, IsOptional, IsArray, ValidateNested, IsNumber, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class SendVerificationCodeDto {
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @IsOptional()
  @IsString()
  locale?: string = 'ru';
}

export class CartItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  licenseTypeId: number;
}

export class VerifyCodeDto {
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  code: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  cart?: CartItemDto[];
}

export class CheckoutVerificationResponseDto {
  success: boolean;
  message?: string;
  expiresIn?: number;
}

export class CheckoutVerifyResponseDto {
  success: boolean;
  message?: string;
  error?: string;
  user?: {
    id: number;
    email: string;
    name: string;
    roles: string[];
    locale: string;
    avatar_url: string | null;
  };
  accessToken?: string;
  refreshToken?: string;
  guestId?: string;
}

