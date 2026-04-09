import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { ChatMessage } from './chat-message.model';
import { ChatRoom } from './chat-room.model';

export enum ChatAttachmentKind {
  IMAGE = 'image',
  FILE = 'file',
}

@Table({ tableName: 'chat_message_attachments', timestamps: false })
export class ChatMessageAttachment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => ChatMessage)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare chat_message_id: number;

  @ForeignKey(() => ChatRoom)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare chat_room_id: number;

  @Default(ChatAttachmentKind.FILE)
  @Column(DataType.ENUM(...Object.values(ChatAttachmentKind)))
  declare kind: ChatAttachmentKind;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare url: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare original_name: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare mime_type: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare size: number;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare created_at: Date;

  @BelongsTo(() => ChatMessage, 'chat_message_id')
  declare message: ChatMessage;

  @BelongsTo(() => ChatRoom, 'chat_room_id')
  declare room: ChatRoom;
}
