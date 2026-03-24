import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ProductTranslation } from '../db/models/product-translation.model';
import { LicenseTypeTranslation } from '../db/models/license-type-translation.model';
import { ProductMedia } from '../db/models/product-media.model';
import { normalizeLanguage } from './utils/language.utils';

export interface ProductTranslationData {
  name: string;
  description?: string;
  shortDescription?: string;
}

export interface LicenseTypeTranslationData {
  name: string;
  description?: string;
}

@Injectable()
export class TranslationService {
  constructor(
    @InjectModel(ProductTranslation)
    private readonly productTranslationModel: typeof ProductTranslation,
    @InjectModel(LicenseTypeTranslation)
    private readonly licenseTypeTranslationModel: typeof LicenseTypeTranslation,
    @InjectModel(ProductMedia)
    private readonly productMediaModel: typeof ProductMedia,
  ) {}

  /**
   * Получить перевод продукта по ID и языку
   * @param productId - ID продукта
   * @param locale - язык (ru/en)
   * @returns данные перевода или null
   */
  async getProductTranslation(
    productId: number,
    locale?: string,
  ): Promise<ProductTranslationData | null> {
    const normalizedLocale = normalizeLanguage(locale);
    console.log('[DEBUG] getProductTranslation: productId =', productId, ', locale =', locale, ', normalizedLocale =', normalizedLocale);

    // Для product_translations используется поле 'language' (not 'locale')
    const translation = await this.productTranslationModel.findOne({
      where: {
        productId: productId,
        language: normalizedLocale,
      },
    });
    console.log('[DEBUG] getProductTranslation: found =', translation ? 'yes' : 'no');
    
    if (!translation) {
      // Если перевод для указанного языка не найден, пробуем получить любой
      const fallbackTranslation = await this.productTranslationModel.findOne({
        where: {
          productId: productId,
        },
      });

      if (!fallbackTranslation) {
        return null;
      }

      return {
        name: fallbackTranslation.name || '',
        description: fallbackTranslation.description || undefined,
        shortDescription: fallbackTranslation.shortDescription || undefined,
      };
    }

    return {
      name: translation.name || '',
      description: translation.description || undefined,
      shortDescription: translation.shortDescription || undefined,
    };
  }

  /**
   * Получить перевод типа лицензии по ID и языку
   * @param licenseTypeId - ID типа лицензии
   * @param locale - язык (ru/en)
   * @returns данные перевода или null
   */
  async getLicenseTypeTranslation(
    licenseTypeId: number,
    locale?: string,
  ): Promise<LicenseTypeTranslationData | null> {
    const normalizedLocale = normalizeLanguage(locale);

    // Для license_type_translations используется поле 'locale'
    const translation = await this.licenseTypeTranslationModel.findOne({
      where: {
        license_type_id: licenseTypeId,
        locale: normalizedLocale,
      },
    });

    if (!translation) {
      // Если перевод для указанного языка не найден, пробуем получить любой
      const fallbackTranslation = await this.licenseTypeTranslationModel.findOne({
        where: {
          license_type_id: licenseTypeId,
        },
      });

      if (!fallbackTranslation) {
        return null;
      }

      return {
        name: fallbackTranslation.name || '',
        description: fallbackTranslation.description || undefined,
      };
    }

    return {
      name: translation.name || '',
      description: translation.description || undefined,
    };
  }

  /**
   * Получить главное изображение продукта (is_cover = true)
   * @param productId - ID продукта
   * @returns URL изображения или null
   */
  async getProductCoverImage(productId: number): Promise<string | null> {
    const media = await this.productMediaModel.findOne({
      where: {
        product_id: productId,
        is_cover: true,
      },
    });

    return media?.url || null;
  }

  /**
   * Получить все изображения продукта с указанием является ли封面
   * @param productId - ID продукта
   * @returns массив медиа с признаком isCover
   */
  async getProductMedia(productId: number): Promise<Array<{ url: string; isCover: boolean }>> {
    const media = await this.productMediaModel.findAll({
      where: {
        product_id: productId,
      },
      order: [['sort_order', 'ASC']],
    });

    return media.map((m) => ({
      url: m.url,
      isCover: m.is_cover,
    }));
  }

  /**
   * Пакетное получение переводов продуктов
   * @param productIds - массив ID продуктов
   * @param locale - язык
   * @returns Map с ID продукта и переводом
   */
  async getProductTranslationsBatch(
    productIds: number[],
    locale?: string,
  ): Promise<Map<number, ProductTranslationData>> {
    const normalizedLocale = normalizeLanguage(locale);
    const result = new Map<number, ProductTranslationData>();

    if (productIds.length === 0) {
      return result;
    }

    // Получаем все переводы для указанных продуктов
    const translations = await this.productTranslationModel.findAll({
      where: {
        productId: {
          [Op.in]: productIds,
        },
        language: normalizedLocale,
      },
    });

    // Заполняем результат
    for (const translation of translations) {
      result.set(translation.productId, {
        name: translation.name || '',
        description: translation.description || undefined,
        shortDescription: translation.shortDescription || undefined,
      });
    }

    // Для продуктов без перевода на указанный язык - получаем любой доступный
    const foundIds = new Set(translations.map((t) => t.productId));
    const missingIds = productIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      const fallbackTranslations = await this.productTranslationModel.findAll({
        where: {
          productId: {
            [Op.in]: missingIds,
          },
        },
      });

      // Группируем по productId и берем первый попавшийся
      const groupedByProduct = new Map<number, ProductTranslation>();
      for (const translation of fallbackTranslations) {
        if (!groupedByProduct.has(translation.productId)) {
          groupedByProduct.set(translation.productId, translation);
        }
      }

      for (const [id, translation] of groupedByProduct) {
        result.set(id, {
          name: translation.name || '',
          description: translation.description || undefined,
          shortDescription: translation.shortDescription || undefined,
        });
      }
    }

    return result;
  }

  /**
   * Пакетное получение переводов типов лицензий
   * @param licenseTypeIds - массив ID типов лицензий
   * @param locale - язык
   * @returns Map с ID типа лицензии и переводом
   */
  async getLicenseTypeTranslationsBatch(
    licenseTypeIds: number[],
    locale?: string,
  ): Promise<Map<number, LicenseTypeTranslationData>> {
    const normalizedLocale = normalizeLanguage(locale);
    const result = new Map<number, LicenseTypeTranslationData>();

    if (licenseTypeIds.length === 0) {
      return result;
    }

    const translations = await this.licenseTypeTranslationModel.findAll({
      where: {
        license_type_id: {
          [Op.in]: licenseTypeIds,
        },
        locale: normalizedLocale,
      },
    });

    for (const translation of translations) {
      result.set(translation.license_type_id, {
        name: translation.name || '',
        description: translation.description || undefined,
      });
    }

    // Для типов лицензий без перевода - получаем любой доступный
    const foundIds = new Set(translations.map((t) => t.license_type_id));
    const missingIds = licenseTypeIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      const fallbackTranslations = await this.licenseTypeTranslationModel.findAll({
        where: {
          license_type_id: {
            [Op.in]: missingIds,
          },
        },
      });

      const groupedByType = new Map<number, LicenseTypeTranslation>();
      for (const translation of fallbackTranslations) {
        if (!groupedByType.has(translation.license_type_id)) {
          groupedByType.set(translation.license_type_id, translation);
        }
      }

      for (const [id, translation] of groupedByType) {
        result.set(id, {
          name: translation.name || '',
          description: translation.description || undefined,
        });
      }
    }

    return result;
  }
}