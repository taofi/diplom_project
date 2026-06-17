import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from '../db/models/user.model';
import { UserRole as UserRoleModel } from '../db/models/user-role.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    SequelizeModule.forFeature([User, UserRoleModel]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}


