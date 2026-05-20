import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';

// Models
import {
  ChatRoom,
  ChatMessage,
  ChatMessageAttachment,
  UserProduct,
  Product,
  ProductLicense,
  Offer,
  OfferFile,
} from '../db/models';

// Auth module for JwtAuthGuard
import { AuthModule } from '../auth/auth.module';

// Repositories
import { ChatRoomRepository } from './repositories/chat-room.repository';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import { OfferRepository } from './repositories/offer.repository';

// Services
import { ChatService } from './chat.service';
import { TempChatService } from './temp-chat.service';
import { ChatStateService } from './services/chat-state.service';
import { ChatMessageService } from './services/chat-message.service';
import { ChatNotificationService } from './services/chat-notification.service';
import { ChatCacheService } from './services/chat-cache.service';
import { OfferService } from './services/offer.service';

// Controllers
import { ChatController } from './chat.controller';
import { ChatOffersController } from './chat-offers.controller';

// Gateway
import { ChatGateway } from './chat.gateway';

// Translation
import { TranslationModule } from '../translation/translation.module';

// Redis
import { RedisModule } from '../redis/redis.module';
import { CommonModule } from '../common/common.module';
import { StripeModule } from '../payment/stripe/stripe.module';

@Module({
  imports: [
    AuthModule,
    TranslationModule,
    RedisModule,
    CommonModule,
    StripeModule,
    SequelizeModule.forFeature([
      ChatRoom,
      ChatMessage,
      ChatMessageAttachment,
      UserProduct,
      Product,
      ProductLicense,
      Offer,
      OfferFile,
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
  controllers: [ChatController, ChatOffersController],
  providers: [
    ChatService,
    TempChatService,
    ChatStateService,
    ChatMessageService,
    ChatNotificationService,
    ChatCacheService,
    ChatRoomRepository,
    ChatMessageRepository,
    OfferRepository,
    OfferService,
    ChatGateway,
  ],
  exports: [
    ChatService,
    TempChatService,
    ChatStateService,
    ChatCacheService,
    OfferService,
    OfferRepository,
    ChatNotificationService,
  ],
})
export class ChatModule {}
