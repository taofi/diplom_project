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
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'src/config/.env',
      load: [databaseConfig, jwtConfig, redisConfig],
    }),
    DatabaseModule,
    CommonModule,
    TokenModule,
    AuthModule,
    ProductModule,
    CategoryModule,
    LicenseTypeModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
