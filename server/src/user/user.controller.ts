import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserLocaleDto } from './dto/update-user-locale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../db/models/user.model';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.userService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get(':id/profile')
  @UseGuards(JwtAuthGuard)
  async getPublicProfile(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() viewer: User,
  ) {
    const viewerRoles =
      ((viewer as unknown as { role?: string[] }).role) ??
      [];
    return this.userService.getPublicProfile(id, viewerRoles);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findById(id);
  }

  @Patch(':id/roles')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserRolesDto: UpdateUserRolesDto,
  ) {
    return this.userService.updateRoles(id, updateUserRolesDto.roles || []);
  }

  @Patch(':id/locale')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateLocale(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserLocaleDto: UpdateUserLocaleDto,
  ) {
    return this.userService.updateLocale(id, updateUserLocaleDto.locale);
  }
}
