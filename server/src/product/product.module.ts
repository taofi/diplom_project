import { Module, forwardRef } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './repositories/product.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from '../db/models/product.model';
import { ProductMedia } from '../db/models/product-media.model';
import { ProductTranslation } from '../db/models/product-translation.model';
import { ProductLicense } from '../db/models/product-license.model';
import { ProductCategory } from '../db/models/product-category.model';
import { Category } from '../db/models/category.model';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../db/database.module';

@Module({
  imports: [
    forwardRef(() => DatabaseModule),
    SequelizeModule.forFeature([
      Product,
      ProductMedia,
      ProductTranslation,
      ProductLicense,
      ProductCategory,
      Category,
    ]),
    AuthModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  exports: [ProductService, ProductRepository, SequelizeModule],
})
export class ProductModule {}
