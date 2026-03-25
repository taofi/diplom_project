import { IsNumber, IsString, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { OfferStatus } from '../../db/models/offer.model';

export class CreateOfferDto {
  @IsNumber({}, { message: 'Chat room ID must be a number' })
  chatRoomId: number;

  @IsNumber({}, { message: 'Author ID must be a number' })
  authorId: number;

  @IsString({ message: 'Description must be a string' })
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

export class AcceptOfferDto {
  @IsNumber({}, { message: 'Offer ID must be a number' })
  offerId: number;
}

export class DeclineOfferDto {
  @IsNumber({}, { message: 'Offer ID must be a number' })
  offerId: number;
}

export class CreateRevisionDto {
  @IsString({ message: 'File URL must be a string' })
  fileUrl: string;

  @IsString({ message: 'Comment must be a string' })
  @IsOptional()
  comment?: string;
}

export class ApproveOrderDto {
  @IsNumber({}, { message: 'Order ID must be a number' })
  orderId: number;
}

export class RequestRevisionDto {
  @IsNumber({}, { message: 'Order ID must be a number' })
  orderId: number;

  @IsString({ message: 'Comment must be a string' })
  @IsOptional()
  comment?: string;
}
