import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ChatRoomStatus } from '../../db/models/chat-room.model';

export class CreateChatRoomDto {
  @IsNumber({}, { message: 'Buyer ID must be a number' })
  @IsNotEmpty({ message: 'Buyer ID is required' })
  buyerId: number;

  @IsNumber({}, { message: 'Seller ID must be a number' })
  @IsOptional()
  sellerId?: number;

  @IsNumber({}, { message: 'Product ID must be a number' })
  @IsOptional()
  productId?: number;

  @IsEnum(ChatRoomStatus, { message: 'Invalid chat room status' })
  @IsOptional()
  status?: ChatRoomStatus;

  @IsString({ message: 'Subject must be a string' })
  @IsOptional()
  subject?: string;
}
