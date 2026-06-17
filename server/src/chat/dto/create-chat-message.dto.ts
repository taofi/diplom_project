import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '../../db/models/chat-message.model';
import { ChatAttachmentKind } from '../../db/models/chat-message-attachment.model';

export class ChatMessageAttachmentDto {
  @IsEnum(ChatAttachmentKind, { message: 'Invalid attachment type' })
  kind: ChatAttachmentKind;

  @IsString({ message: 'Attachment URL must be a string' })
  @IsNotEmpty({ message: 'Attachment URL is required' })
  url: string;

  @IsString({ message: 'Attachment original name must be a string' })
  @IsNotEmpty({ message: 'Attachment original name is required' })
  originalName: string;

  @IsString({ message: 'Attachment MIME type must be a string' })
  @IsNotEmpty({ message: 'Attachment MIME type is required' })
  mimeType: string;

  @IsNumber({}, { message: 'Attachment size must be a number' })
  size: number;
}

export class CreateChatMessageDto {
  @IsNumber({}, { message: 'Chat room ID must be a number' })
  @IsNotEmpty({ message: 'Chat room ID is required' })
  chatRoomId: number;

  @IsString({ message: 'Content must be a string' })
  @IsOptional()
  content?: string;

  @IsEnum(MessageType, { message: 'Invalid message type' })
  @IsOptional()
  type?: MessageType;

  @IsArray({ message: 'Attachments must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ChatMessageAttachmentDto)
  @IsOptional()
  attachments?: ChatMessageAttachmentDto[];
}


