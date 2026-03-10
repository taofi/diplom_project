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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { AddMediaDto } from './dto/add-media.dto';
import { AddLicenseDto } from './dto/add-license.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async findMyProducts(
    @CurrentUserId() sellerId: number,
    @Query() query: ProductQueryDto,
  ) {
    return this.productService.findMyProducts(sellerId, query);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUserId() sellerId: number,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productService.create(sellerId, createProductDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() sellerId: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, sellerId, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() sellerId: number,
  ) {
    return this.productService.delete(id, sellerId);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard)
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() sellerId: number,
  ) {
    return this.productService.activate(id, sellerId);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() sellerId: number,
  ) {
    return this.productService.deactivate(id, sellerId);
  }

  @Get(':id/media')
  async getMedia(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getMedia(id);
  }

  @Post(':id/media')
  @UseGuards(JwtAuthGuard)
  async addMedia(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() sellerId: number,
    @Body() addMediaDto: AddMediaDto,
  ) {
    return this.productService.addMedia(id, sellerId, addMediaDto);
  }

  @Delete(':id/media/:mediaId')
  @UseGuards(JwtAuthGuard)
  async deleteMedia(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @CurrentUserId() sellerId: number,
  ) {
    return this.productService.deleteMedia(id, mediaId, sellerId);
  }

  @Get(':id/licenses')
  async getLicenses(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getLicenses(id);
  }

  @Post(':id/licenses')
  @UseGuards(JwtAuthGuard)
  async addLicense(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() sellerId: number,
    @Body() addLicenseDto: AddLicenseDto,
  ) {
    return this.productService.addLicense(id, sellerId, addLicenseDto);
  }
}
