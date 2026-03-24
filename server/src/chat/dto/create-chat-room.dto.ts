import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ChatRoomStatus, ChatRoomVisibility } from '../../db/models/chat-room.model';

export class CreateChatRoomDto {
  @IsNumber({}, { message: 'Buyer ID must be a number' })
  @IsNotEmpty({ message: 'Buyer ID is required' })
  buyerId: number;

  @IsNumber({}, { message: 'Seller ID must be a number' })
  @IsNotEmpty({ message: 'Seller ID is required' })
  sellerId: number;

  @IsNumber({}, { message: 'Product ID must be a number' })
  @IsOptional()
  productId?: number;

  @IsNumber({}, { message: 'User Product ID must be a number' })
  @IsOptional()
  userProductId?: number;

  @IsEnum(ChatRoomStatus, { message: 'Invalid chat room status' })
  @IsOptional()
  status?: ChatRoomStatus;

  @IsEnum(ChatRoomVisibility, { message: 'Invalid visibility status' })
  @IsOptional()
  visibility?: ChatRoomVisibility;

  @IsString({ message: 'Subject must be a string' })
  @IsOptional()
  subject?: string;
}
