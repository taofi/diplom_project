import { IsNumber, IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ChatOfferStatus } from '../../db/models/chat-offer.model';

export class CreateOfferDto {
  @IsNumber({}, { message: 'Chat room ID must be a number' })
  chatRoomId: number;

  @IsNumber({}, { message: 'Seller ID must be a number' })
  sellerId: number;

  @IsString({ message: 'Description must be a string' })
  description: string;

  @IsNumber({}, { message: 'Price must be a number' })
  price: number;

  @IsDateString({}, { message: 'Deadline must be a valid date' })
  deadline: string;
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
