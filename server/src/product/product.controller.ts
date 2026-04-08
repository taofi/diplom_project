 
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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { AddMediaDto } from './dto/add-media.dto';
import { AddLicenseDto } from './dto/add-license.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRoleType } from '../db/models/user.model';
import { FileService, MediaFolder } from '../common/services/file.service';
import type { MulterFile } from '../common/services/file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { MediaType } from '../db/models/product-media.model';

const MAX_PRODUCT_MEDIA_SIZE = 50 * 1024 * 1024;

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly fileService: FileService,
  ) {}

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
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @Query('language') language?: string,
  ) {
    return this.productService.findById(id, language);
  }

  @Get(':id/translations')
  async findByIdWithAllTranslations(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findByIdWithAllTranslations(id);
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
    @CurrentUserId() userId: number,
    @CurrentUser() user: User,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const userRoles = (user as unknown as { role?: UserRoleType[] }).role ?? [];
    const isAdmin = userRoles.includes('admin');
    return this.productService.update(id, userId, isAdmin, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
    @CurrentUser() user: User,
  ) {
    const userRoles = (user as unknown as { role?: UserRoleType[] }).role ?? [];
    const isAdmin = userRoles.includes('admin');
    return this.productService.delete(id, userId, isAdmin);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard)
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
    @CurrentUser() user: User,
  ) {
    const userRoles = (user as unknown as { role?: UserRoleType[] }).role ?? [];
    const isAdmin = userRoles.includes('admin');
    return this.productService.activate(id, userId, isAdmin);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
    @CurrentUser() user: User,
  ) {
    const userRoles = (user as unknown as { role?: UserRoleType[] }).role ?? [];
    const isAdmin = userRoles.includes('admin');
    return this.productService.deactivate(id, userId, isAdmin);
  }

  @Post(':id/media/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
       
      storage: diskStorage({
        destination: './tmp',
        filename: (
          _req: Request,
          file: MulterFile,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: MAX_PRODUCT_MEDIA_SIZE,
      },
    }),
  )
  async uploadMedia(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() sellerId: number,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check if product exists and belongs to seller
    const product = await this.productService.findById(id);
    if (!product) {
      throw new BadRequestException('Product not found');
    }
    if (product.sellerId !== sellerId) {
      throw new BadRequestException(
        'You can only upload media to your own products',
      );
    }

    // Determine media type
    let mediaType: MediaType = MediaType.IMAGE;
    if (file.mimetype.startsWith('video/')) {
      mediaType = MediaType.VIDEO;
    }

    // Save file to product media folder
    const result = this.fileService.saveMediaFile(
      {
        originalname: file.originalname,
        buffer: file.buffer,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
        filename: file.filename,
      },
      MediaFolder.PRODUCT,
      id,
    );

    // Add media to database
    const media = await this.productService.addMedia(id, sellerId, {
      url: result.url,
      mediaType,
    });

    return media;
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

  @Patch(':id/media/:mediaId/cover')
  @UseGuards(JwtAuthGuard)
  async setMediaAsCover(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @CurrentUserId() sellerId: number,
  ) {
    return this.productService.setMediaAsCover(id, mediaId, sellerId);
  }

  @Patch(':id/file')
  @UseGuards(JwtAuthGuard)
  async updateFile(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() sellerId: number,
    @Body() body: { fileUrl: string },
  ) {
    return this.productService.updateFile(id, sellerId, body.fileUrl);
  }

  @Delete(':id/file')
  @UseGuards(JwtAuthGuard)
  async deleteFile(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() sellerId: number,
  ) {
    return this.productService.deleteFile(id, sellerId);
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

  @Delete(':id/licenses/:licenseId')
  @UseGuards(JwtAuthGuard)
  async deleteLicense(
    @Param('id', ParseIntPipe) id: number,
    @Param('licenseId', ParseIntPipe) licenseId: number,
    @CurrentUserId() sellerId: number,
  ) {
    await this.productService.deleteLicense(id, licenseId, sellerId);
    return { success: true };
  }
}
