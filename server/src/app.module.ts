import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenModule } from './token/token.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './db/database.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { LicenseTypeModule } from './license-type/license-type.module';
import { CommonModule } from './common/common.module';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
