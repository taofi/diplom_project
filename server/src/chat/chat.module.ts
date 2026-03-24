import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';

// Models
import {
  ChatRoom,
  ChatMessage,
  ChatOffer,
  CustomOrder,
  CustomOrderRevision,
  UserProduct,
  Product,
  ProductLicense,
} from '../db/models';

// Auth module for JwtAuthGuard
import { AuthModule } from '../auth/auth.module';

// Repositories
import { ChatRoomRepository } from './repositories/chat-room.repository';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import { ChatOfferRepository } from './repositories/chat-offer.repository';

// Services
import { ChatService } from './chat.service';
import { TempChatService } from './temp-chat.service';
import { ChatStateService } from './services/chat-state.service';
import { ChatMessageService } from './services/chat-message.service';
import { ChatNotificationService } from './services/chat-notification.service';
import { ChatCacheService } from './services/chat-cache.service';

// Controllers
import { ChatController } from './chat.controller';

// Gateway
import { ChatGateway } from './chat.gateway';

// Translation
import { TranslationModule } from '../translation/translation.module';

// Redis
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    AuthModule,
    TranslationModule,
    RedisModule,
    SequelizeModule.forFeature([
      ChatRoom,
      ChatMessage,
      ChatOffer,
      CustomOrder,
      CustomOrderRevision,
      UserProduct,
      Product,
      ProductLicense,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') as StringValue,
        },
      }),
    }),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    TempChatService,
    ChatStateService,
    ChatMessageService,
    ChatNotificationService,
    ChatCacheService,
    ChatRoomRepository,
    ChatMessageRepository,
    ChatOfferRepository,
    ChatGateway,
  ],
  exports: [ChatService, TempChatService, ChatStateService, ChatCacheService],
})
export class ChatModule {}
