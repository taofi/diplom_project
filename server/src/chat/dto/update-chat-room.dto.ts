import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { ChatRoomStatus } from '../../db/models/chat-room.model';

export class UpdateChatRoomDto {
  @IsNumber({}, { message: 'Buyer ID must be a number' })
  @IsOptional()
  buyerId?: number;

  @IsNumber({}, { message: 'Seller ID must be a number' })
  @IsOptional()
  sellerId?: number;

  @IsNumber({}, { message: 'Product ID must be a number' })
  @IsOptional()
  productId?: number;

  @IsString({ message: 'Subject must be a string' })
  @IsOptional()
  subject?: string;

  @IsEnum(ChatRoomStatus, { message: 'Invalid chat room status' })
  @IsOptional()
  status?: ChatRoomStatus;
}
