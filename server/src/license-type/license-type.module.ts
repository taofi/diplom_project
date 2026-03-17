import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LicenseTypeController } from './license-type.controller';
import { LicenseTypeService } from './license-type.service';
import { LicenseType } from '../db/models/license-type.model';
import { LicenseTypeTranslation } from '../db/models/license-type-translation.model';
import { ProductLicense } from '../db/models/product-license.model';

@Module({
  imports: [
    SequelizeModule.forFeature([LicenseType, LicenseTypeTranslation, ProductLicense]),
  ],
  controllers: [LicenseTypeController],
  providers: [LicenseTypeService],
  exports: [LicenseTypeService],
})
export class LicenseTypeModule {}
