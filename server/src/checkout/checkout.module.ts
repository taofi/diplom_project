import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { Order } from '../db/models/order.model';
import { OrderItem } from '../db/models/order-item.model';
import { ProductLicense } from '../db/models/product-license.model';
import { UserProduct } from '../db/models/user-product.model';
import { User } from '../db/models/user.model';
 import { CartModule } from '../cart/cart.module';
 import { OrderModule } from '../order/order.module';
 import { AuthModule } from '../auth/auth.module';
 import { EmailModule } from '../email/email.module';
 import { PaymentModule } from '../payment/payment.module';
 import { StripeModule } from '../payment/stripe/stripe.module';

@Module({
   imports: [
     ConfigModule,
     SequelizeModule.forFeature([Order, OrderItem, ProductLicense, UserProduct, User]),
     CartModule,
     OrderModule,
     AuthModule,
     EmailModule,
     PaymentModule,
     StripeModule,
   ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
