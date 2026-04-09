import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductModule } from '../product/product.module';
import { User } from '../db/models/user.model';
import { UserRole } from '../db/models/user-role.model';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';

@Module({
  imports: [SequelizeModule.forFeature([User, UserRole]), ProductModule],
  controllers: [AuthorsController],
  providers: [AuthorsService],
  exports: [AuthorsService],
})
export class AuthorsModule {}

