import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';
import { ChatRoom } from './chat-room.model';
import { ChatMessageAttachment } from './chat-message-attachment.model';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  OFFER = 'offer',
}

@Table({ tableName: 'chat_messages', timestamps: true })
export class ChatMessage extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => ChatRoom)
  @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
  declare chat_room_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare sender_id: number;

  @Default(MessageType.TEXT)
  @Column(DataType.ENUM(...Object.values(MessageType)))
  declare message_type: MessageType;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare message: string | null;

  @AllowNull(true)
  @Column({ type: DataType.STRING(500) })
  declare attachment_url: string | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare is_read: boolean;

  @CreatedAt
  declare created_at: Date;

  // Associations
  @BelongsTo(() => ChatRoom)
  declare chat_room: ChatRoom;

  @BelongsTo(() => User, 'sender_id')
  declare sender: User;

  @HasMany(() => ChatMessageAttachment, 'chat_message_id')
  declare attachments: ChatMessageAttachment[];
}
