import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Category } from '../db/models/category.model';
import { CategoryTranslation } from '../db/models/category-translation.model';
import { ProductCategory } from '../db/models/product-category.model';
import { DatabaseModule } from '../db/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => DatabaseModule),
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([Category, CategoryTranslation, ProductCategory]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService, SequelizeModule],
})
export class CategoryModule {}


