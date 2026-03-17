/**
 * Типы для LicenseType (типов лицензий)
 */

// =======================
// DTOs (camelCase - для ввода/вывода API)
// =======================

/**
 * DTO для создания типа лицензии
 */
export interface CreateLicenseTypeDto {
  slug: string;
  name: string;
  description?: string;
}

/**
 * DTO для обновления типа лицензии
 */
export type UpdateLicenseTypeDto = Partial<CreateLicenseTypeDto>;

// =======================
// RESPONSE TYPES (camelCase)
// =======================

/**
 * Информация о переводе типа лицензии
 */
export interface LicenseTypeTranslationInfo {
  locale: string;
  name: string;
  description: string | null;
}

/**
 * LicenseType для ответа API (camelCase)
 */
export interface LicenseTypeResponse {
  id: number;
  slug: string;
  name?: string;
  description?: string | null;
  translations?: LicenseTypeTranslationInfo[];
}

/**
 * Тип лицензии с количеством товаров
 */
export interface LicenseTypeWithCount extends LicenseTypeResponse {
  productsCount?: number;
}

// =======================
// QUERY TYPES
// =======================

/**
 * Параметры запроса для типов лицензий
 */
export interface LicenseTypeQueryParams {
  language?: string;
}
