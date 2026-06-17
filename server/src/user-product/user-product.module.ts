import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserProduct } from '../db/models/user-product.model';
import { ProductLicense } from '../db/models/product-license.model';
import { Product } from '../db/models/product.model';
import { ProductTranslation } from '../db/models/product-translation.model';
import { LicenseType } from '../db/models/license-type.model';
import { LicenseTypeTranslation } from '../db/models/license-type-translation.model';
import { Order } from '../db/models/order.model';
import { UserProductController } from './user-product.controller';
import { UserProductService } from './user-product.service';
import { TranslationModule } from '../translation/translation.module';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      UserProduct,
      ProductLicense,
      Product,
      ProductTranslation,
      LicenseType,
      LicenseTypeTranslation,
      Order,
    ]),
    TranslationModule,
    AuthModule,
    CommonModule,
  ],
  controllers: [UserProductController],
  providers: [UserProductService],
  exports: [UserProductService],
})
export class UserProductModule {}


