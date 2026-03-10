import { Module, Global } from '@nestjs/common';
import { SequelizeModule as NestSequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

// Models
import {
  User,
  Product,
  ProductMedia,
  ProductTranslation,
  LicenseType,
  LicenseTypeTranslation,
  ProductLicense,
  Category,
  CategoryTranslation,
  ProductCategory,
  CartItem,
  PromoCode,
  PromoCodeUsage,
  Order,
  OrderItem,
  Payment,
  UserProduct,
  BlogPost,
  BlogPostTranslation,
  BlogPostMedia,
  ChatRoom,
  ChatMessage,
  ChatOffer,
  CustomOrder,
  CustomOrderRevision,
} from './models';

const models = [
  User,
  Product,
  ProductMedia,
  ProductTranslation,
  LicenseType,
  LicenseTypeTranslation,
  ProductLicense,
  Category,
  CategoryTranslation,
  ProductCategory,
  CartItem,
  PromoCode,
  PromoCodeUsage,
  Order,
  OrderItem,
  Payment,
  UserProduct,
  BlogPost,
  BlogPostTranslation,
  BlogPostMedia,
  ChatRoom,
  ChatMessage,
  ChatOffer,
  CustomOrder,
  CustomOrderRevision,
];

@Global()
@Module({
  imports: [
    NestSequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.user'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        models,
        autoLoadModels: true,
        synchronize: true,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
      }),
    }),
  ],
  exports: [NestSequelizeModule],
})
export class DatabaseModule {}
