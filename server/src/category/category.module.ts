import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Category } from '../db/models/category.model';
import { CategoryTranslation } from '../db/models/category-translation.model';
import { ProductCategory } from '../db/models/product-category.model';

@Module({
  imports: [SequelizeModule.forFeature([Category, CategoryTranslation, ProductCategory])],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
