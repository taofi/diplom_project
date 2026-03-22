import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Sequelize } from 'sequelize';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from '../db/models/order.model';
import { OrderItem } from '../db/models/order-item.model';
import { ProductLicense } from '../db/models/product-license.model';
import { Product } from '../db/models/product.model';
import { CartModule } from '../cart/cart.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([Order, OrderItem, ProductLicense, Product]),
    CartModule,
    AuthModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    {
      provide: Sequelize,
      useFactory: (configService: ConfigService) => new Sequelize({
        dialect: 'postgres',
        host: configService.get<string>('database.host') || 'localhost',
        port: configService.get<number>('database.port') || 5432,
        username: configService.get<string>('database.user') || 'admin',
        password: configService.get<string>('database.password') || 'p1ssw0rt',
        database: configService.get<string>('database.name') || 'database',
      }),
      inject: [ConfigService],
    },
  ],
  exports: [OrderService, Sequelize],
})
export class OrderModule {}
