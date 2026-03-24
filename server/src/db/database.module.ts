import { Module, Global } from '@nestjs/common';
import { SequelizeModule as NestSequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

// Models
import {
  User,
  UserRoleModel,
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
  ChatRoom,
  ChatMessage,
  ChatOffer,
  CustomOrder,
  CustomOrderRevision,
} from './models';

const models = [
  User,
  UserRoleModel,
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
  ChatRoom,
  ChatMessage,
  ChatOffer,
  CustomOrder,
  CustomOrderRevision,
];

// Токен для внедрения Sequelize
export const SEQUELIZE_TOKEN = 'SEQUELIZE';

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
        alter: true,
        //logging: process.env.NODE_ENV === 'development' ? console.log : false,
        logging: false,
      }),
    }),
  ],
  providers: [
    {
      provide: SEQUELIZE_TOKEN,
      useValue: {}, // Заглушка - реальный инстанс Sequelize нельзя получить напрямую
    },
  ],
  exports: [NestSequelizeModule, SEQUELIZE_TOKEN],
})
export class DatabaseModule {}
