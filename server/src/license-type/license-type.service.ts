import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { LicenseType } from '../db/models/license-type.model';
import { LicenseTypeTranslation } from '../db/models/license-type-translation.model';
import { ProductLicense } from '../db/models/product-license.model';
import { CreateLicenseTypeDto } from './dto/create-license-type.dto';
import { UpdateLicenseTypeDto } from './dto/update-license-type.dto';
import type { LicenseTypeResponse } from '../types/license-type';
import { SEQUELIZE_TOKEN } from '../db/database.module';

interface LicenseTypeTranslationRaw {
  license_type_id: number;
  locale: string;
  name: string;
  description: string | null;
}

@Injectable()
export class LicenseTypeService {
  constructor(
    @InjectModel(LicenseType)
    private readonly licenseTypeModel: typeof LicenseType,
    @InjectModel(LicenseTypeTranslation)
    private readonly translationModel: typeof LicenseTypeTranslation,
    @InjectModel(ProductLicense)
    private readonly productLicenseModel: typeof ProductLicense,
    @Inject(SEQUELIZE_TOKEN)
    private readonly sequelize: Sequelize,
  ) {}

  async findAll(language?: string): Promise<LicenseTypeResponse[]> {
    const licenseTypes = await this.licenseTypeModel.findAll({
      include: [
        {
          model: LicenseTypeTranslation,
          where: language ? { locale: language } : undefined,
          required: false,
        },
      ],
    });

    return licenseTypes.map((lt) => this.formatLicenseType(lt, language));
  }

  async findById(id: number, language?: string): Promise<LicenseTypeResponse> {
    const licenseType = await this.licenseTypeModel.findByPk(id, {
      include: [
        {
          model: LicenseTypeTranslation,
          where: language ? { locale: language } : undefined,
          required: false,
        },
      ],
    });

    if (!licenseType) {
      throw new NotFoundException(`LicenseType with ID ${id} not found`);
    }

    return this.formatLicenseType(licenseType, language);
  }

  async findBySlug(slug: string, language?: string): Promise<LicenseTypeResponse> {
    const licenseType = await this.licenseTypeModel.findOne({
      where: { slug },
      include: [
        {
          model: LicenseTypeTranslation,
          where: language ? { locale: language } : undefined,
          required: false,
        },
      ],
    });

    if (!licenseType) {
      throw new NotFoundException(`LicenseType with slug ${slug} not found`);
    }

    return this.formatLicenseType(licenseType, language);
  }

  async create(createDto: CreateLicenseTypeDto, language: string = 'ru'): Promise<LicenseTypeResponse> {
    // Check if slug already exists
    const existing = await this.licenseTypeModel.findOne({
      where: { slug: createDto.slug },
    });

    if (existing) {
      throw new ForbiddenException('LicenseType with this slug already exists');
    }

    const licenseType = await this.licenseTypeModel.create({
      slug: createDto.slug,
    });

    // Create translation
    await this.translationModel.create({
      license_type_id: licenseType.id,
      locale: language,
      name: createDto.name,
      description: createDto.description || null,
    });

    return this.findById(licenseType.id, language);
  }

  async update(
    id: number,
    updateDto: UpdateLicenseTypeDto,
    language: string = 'ru',
  ): Promise<LicenseTypeResponse> {
    const licenseType = await this.licenseTypeModel.findByPk(id);
    if (!licenseType) {
      throw new NotFoundException(`LicenseType with ID ${id} not found`);
    }

    // Update slug if provided
    if (updateDto.slug && updateDto.slug !== licenseType.slug) {
      const existing = await this.licenseTypeModel.findOne({
        where: { slug: updateDto.slug },
      });

      if (existing && existing.id !== id) {
        throw new ForbiddenException('LicenseType with this slug already exists');
      }

      await licenseType.update({ slug: updateDto.slug });
    }

    // Update or create translation
    const existingTranslation = await this.translationModel.findOne({
      where: { license_type_id: id, locale: language },
    });

    if (existingTranslation) {
      const updateData: Partial<LicenseTypeTranslationRaw> = {};
      if (updateDto.name) updateData.name = updateDto.name;
      if (updateDto.description !== undefined) updateData.description = updateDto.description;

      await existingTranslation.update(updateData);
    } else if (updateDto.name) {
      await this.translationModel.create({
        license_type_id: id,
        locale: language,
        name: updateDto.name,
        description: updateDto.description || null,
      });
    }

    return this.findById(id, language);
  }

  async delete(id: number): Promise<void> {
    const licenseType = await this.licenseTypeModel.findByPk(id);
    if (!licenseType) {
      throw new NotFoundException(`LicenseType with ID ${id} not found`);
    }

    // Check if any products use this license type
    const usageCount = await this.productLicenseModel.count({
      where: { license_type_id: id },
    });

    if (usageCount > 0) {
      throw new ForbiddenException(
        `Cannot delete license type: ${usageCount} products are using it`,
      );
    }

    await this.sequelize.transaction(async (t) => {
      // Delete all translations
      await this.translationModel.destroy({ where: { license_type_id: id }, transaction: t });

      // Delete license type
      await licenseType.destroy({ transaction: t });
    });
  }

  async getProductsCount(id: number): Promise<number> {
    const count = await this.productLicenseModel.count({
      where: { license_type_id: id },
    });
    return count;
  }

  private formatLicenseType(licenseType: LicenseType, language?: string): LicenseTypeResponse {
    const result: LicenseTypeResponse = {
      id: licenseType.id,
      slug: licenseType.slug,
    };

    const translations = licenseType.translations as LicenseTypeTranslationRaw[] | undefined;

    if (translations && translations.length > 0) {
      const translation = language
        ? translations.find((t) => t.locale === language)
        : translations[0];

      if (translation) {
        result.name = translation.name;
        result.description = translation.description;
      }
    }

    // Include all translations
    result.translations = translations?.map((t) => ({
      locale: t.locale,
      name: t.name,
      description: t.description,
    }));

    return result;
  }
}
