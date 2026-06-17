import { IsInt, Min, IsString, MinLength, IsNumber, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CreateOfferDto {
  @IsInt({ message: 'Chat room ID must be a number' })
  @Min(1, { message: 'Chat room ID must be at least 1' })
  chatRoomId: number;

  @IsInt({ message: 'Author ID must be a number' })
  @Min(1, { message: 'Author ID must be at least 1' })
  authorId: number;

  @IsString({ message: 'Description must be a string' })
  @MinLength(1, { message: 'Description is required' })
  description: string;

  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be at least 0' })
  price: number;
}

export class CounterOfferDto {
  @IsNumber({}, { message: 'New price must be a number' })
  @Min(0, { message: 'New price must be at least 0' })
  newPrice: number;
}

export class UploadFilesDto {
  @IsArray({ message: 'Author image URLs must be an array' })
  @IsString({ each: true, message: 'Each author image URL must be a string' })
  authorImagesUrls: string[];

  @IsString({ message: 'Author file URL must be a string' })
  @IsOptional()
  authorFileUrl?: string;
}

export class UploadCreatorFilesDto {
  @IsArray({ message: 'Creator attachment URLs must be an array' })
  @IsString({ each: true, message: 'Each creator attachment URL must be a string' })
  creatorAttachmentsUrls: string[];
}

export class PayOrderDto {
  @IsBoolean({ message: 'Simulate success must be a boolean' })
  @IsOptional()
  simulateSuccess?: boolean = true;
}

export interface PayOrderResponse {
  sessionUrl: string;
  offerId: number;
}

