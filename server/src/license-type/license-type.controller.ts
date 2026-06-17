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
import { LicenseTypeService } from './license-type.service';
import { CreateLicenseTypeDto } from './dto/create-license-type.dto';
import { UpdateLicenseTypeDto } from './dto/update-license-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('license-types')
export class LicenseTypeController {
  constructor(private readonly licenseTypeService: LicenseTypeService) {}

  @Get()
  async findAll(@Query('language') language?: string) {
    return this.licenseTypeService.findAll(language);
  }
 
  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @Query('language') language?: string,
  ) {
    return this.licenseTypeService.findById(id, language);
  }

  @Get(':id/count')
  async getProductsCount(@Param('id', ParseIntPipe) id: number) {
    const count = await this.licenseTypeService.getProductsCount(id);
    return { count };
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(
    @Body() createDto: CreateLicenseTypeDto,
    @Query('language') language?: string,
  ) {
    return this.licenseTypeService.create(createDto, language);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLicenseTypeDto,
    @Query('language') language?: string,
  ) {
    return this.licenseTypeService.update(id, updateDto, language);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.licenseTypeService.delete(id);
    return { success: true };
  }
}


