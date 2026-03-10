import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { MessageType } from '../../db/models/chat-message.model';

export class CreateChatMessageDto {
  @IsNumber({}, { message: 'Chat room ID must be a number' })
  @IsNotEmpty({ message: 'Chat room ID is required' })
  chatRoomId: number;

  @IsNumber({}, { message: 'Sender ID must be a number' })
  @IsNotEmpty({ message: 'Sender ID is required' })
  senderId: number;

  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  content: string;

  @IsEnum(MessageType, { message: 'Invalid message type' })
  @IsOptional()
  type?: MessageType;

  @IsString({ message: 'Media URL must be a string' })
  @IsOptional()
  mediaUrl?: string;

  @IsString({ message: 'Media type must be a string' })
  @IsOptional()
  mediaType?: string;
}
