import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CheckoutVerificationController } from './checkout-verification.controller';
import { CheckoutVerificationService } from './checkout-verification.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TokenModule } from '../token/token.module';
import { EmailModule } from '../email/email.module';
import { CartModule } from '../cart/cart.module';
import { OrderModule } from '../order/order.module';
import { PaymentModule } from '../payment/payment.module';
import { User } from '../db/models/user.model';
import { UserRole as UserRoleModel } from '../db/models/user-role.model';

@Module({
  imports: [
    SequelizeModule.forFeature([User, UserRoleModel]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
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
    TokenModule,
    EmailModule,
    forwardRef(() => CartModule),
    forwardRef(() => OrderModule),
    forwardRef(() => PaymentModule),
  ],
  controllers: [AuthController, CheckoutVerificationController],
  providers: [AuthService, CheckoutVerificationService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard, TokenModule, JwtModule],
})
export class AuthModule {}


