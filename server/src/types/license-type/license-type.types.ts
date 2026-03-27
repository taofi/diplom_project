/**
 * Типы для LicenseType
 */

import type { EntityBase } from '../base/entity-base';

// =======================
// DTOs (camelCase - для ввода/вывода API)
// =======================

/**
 * DTO для создания типа лицензии
 */
export interface CreateLicenseTypeDto {
  name: string;
  description?: string;
}

/**
 * DTO для обновления типа лицензии
 */
export type UpdateLicenseTypeDto = Partial<CreateLicenseTypeDto>;

// =======================
// BASE TYPES (snake_case - как в БД)
// =======================

/**
 * Базовые поля LicenseType (snake_case - как в базе данных)
 */
export interface LicenseTypeFields extends EntityBase {
  id: number;
}

/**
 * Базовые поля только для чтения
 */
export type LicenseTypeCreateFields = Omit<LicenseTypeFields, 'id'>;

// =======================
// RELATIONS TYPES
// =======================

/**
 * Информация о переводе типа лицензии
 */
export interface LicenseTypeTranslationInfo {
  locale: string;
  name: string;
  description: string | null;
}

// =======================
// RESPONSE TYPES (camelCase)
// =======================

/**
 * LicenseType для ответа API (camelCase)
 */
export interface LicenseTypeResponse {
  id: number;
  name?: string;
  description?: string | null;
  translations?: LicenseTypeTranslationInfo[];
}

/**
 * Тип лицензии с загруженными отношениями
 */
export type LicenseTypeWithRelations = LicenseTypeFields & {
  translations?: LicenseTypeTranslationFields[];
};

type LicenseTypeTranslationFields = {
  license_type_id: number;
  locale: string;
  name: string;
  description: string | null;
};

// =======================
// QUERY TYPES
// =======================

/**
 * Параметры запроса для типов лицензий
 */
export interface LicenseTypeQueryParams {
  language?: string;
}

// =======================
// FACTORY FUNCTIONS
// =======================

/**
 * Создать LicenseTypeResponse из сущности с отношениями
 */
export function createLicenseTypeResponse(
  licenseType: LicenseTypeWithRelations,
  language?: string,
): LicenseTypeResponse {
  const response: LicenseTypeResponse = {
    id: licenseType.id,
  };

  // Add name and description from translation
  if (licenseType.translations && licenseType.translations.length > 0) {
    const translation = language
      ? licenseType.translations.find((t) => t.locale === language)
      : licenseType.translations[0];

    if (translation) {
      response.name = translation.name;
      response.description = translation.description;
    }
  }

  // Add all translations
  if (licenseType.translations) {
    response.translations = licenseType.translations.map((t) => ({
      locale: t.locale,
      name: t.name,
      description: t.description,
    }));
  }

  return response;
}
