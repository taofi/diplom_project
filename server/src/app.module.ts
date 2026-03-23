import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenModule } from './token/token.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './db/database.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { LicenseTypeModule } from './license-type/license-type.module';
import { CommonModule } from './common/common.module';
import { UploadsModule } from './uploads/uploads.module';
import { UserModule } from './user/user.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { CheckoutModule } from './checkout/checkout.module';
import { EmailModule } from './email/email.module';
import { TranslationModule } from './translation/translation.module';
import { UserProductModule } from './user-product/user-product.module';
import { ChatModule } from './chat/chat.module';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import emailConfig from './config/email.config';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),
    // Serve static files from server/files for product downloads
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'files'),
      serveRoot: '/files',
      serveStaticOptions: {
        fallthrough: true,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'src/config/.env',
      load: [databaseConfig, jwtConfig, redisConfig, emailConfig],
    }),
    DatabaseModule,
    CommonModule,
    TokenModule,
    AuthModule,
    EmailModule,
    CartModule,
    OrderModule,
    CheckoutModule,
    ProductModule,
    CategoryModule,
    LicenseTypeModule,
    UploadsModule,
    UserModule,
    TranslationModule,
    UserProductModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
