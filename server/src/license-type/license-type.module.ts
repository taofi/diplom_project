import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LicenseTypeController } from './license-type.controller';
import { LicenseTypeService } from './license-type.service';
import { LicenseType } from '../db/models/license-type.model';
import { LicenseTypeTranslation } from '../db/models/license-type-translation.model';
import { ProductLicense } from '../db/models/product-license.model';
import { DatabaseModule } from '../db/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => DatabaseModule),
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([LicenseType, LicenseTypeTranslation, ProductLicense]),
  ],
  controllers: [LicenseTypeController],
  providers: [LicenseTypeService],
  exports: [LicenseTypeService, SequelizeModule],
})
export class LicenseTypeModule {}


