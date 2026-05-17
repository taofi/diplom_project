import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { StripeModule } from './stripe/stripe.module';
import { AuthModule } from '../auth/auth.module';
import { Order } from '../db/models/order.model';
import { Payment } from '../db/models/payment.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Order, Payment]),
    StripeModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService, SequelizeModule],
})
export class PaymentModule {}