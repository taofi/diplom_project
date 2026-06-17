import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TranslationService } from './translation.service';
import { ProductTranslation } from '../db/models/product-translation.model';
import { LicenseTypeTranslation } from '../db/models/license-type-translation.model';
import { ProductMedia } from '../db/models/product-media.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ProductTranslation,
      LicenseTypeTranslation,
      ProductMedia,
    ]),
  ],
  providers: [TranslationService],
  exports: [TranslationService],
})
export class TranslationModule {}

