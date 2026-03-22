import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartItemRepository } from './repositories/cart-item.repository';
import { CartItem } from '../db/models/cart-item.model';
import { ProductLicense } from '../db/models/product-license.model';
import { Product } from '../db/models/product.model';
import { AuthModule } from '../auth/auth.module';
import { TranslationModule } from '../translation/translation.module';

@Module({
  imports: [
    SequelizeModule.forFeature([CartItem, ProductLicense, Product]),
    AuthModule,
    TranslationModule,
  ],
  controllers: [CartController],
  providers: [CartService, CartItemRepository],
  exports: [CartService],
})
export class CartModule {}
