import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async findAll(@Query('language') language?: string) {
    return this.categoryService.findAll(language);
  }

  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @Query('language') language?: string,
  ) {
    return this.categoryService.findById(id, language);
  }

  @Get(':id/products')
  async getProducts(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const productIds = await this.categoryService.getProducts(id);
    return { productIds };
  }

  @Get(':id/count')
  async getProductsCount(@Param('id', ParseIntPipe) id: number) {
    const count = await this.categoryService.getProductsCount(id);
    return { count };
  }

Кон

  @Post(':id/products/:productId')
  @UseGuards(JwtAuthGuard)
  async addProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.categoryService.addProduct(id, productId);
  }

  @Delete(':id/products/:productId')
  @UseGuards(JwtAuthGuard)
  async removeProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    await this.categoryService.removeProduct(id, productId);
    return { success: true };
  }
}


