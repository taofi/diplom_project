/**
 * Типы для Category (тегов)
 */

import type { EntityBase } from '../base/entity-base';

// =======================
// DTOs (camelCase - для ввода/вывода API)
// =======================

/**
 * DTO для создания категории
 */
export interface CreateCategoryDto {
  name: string;
  description?: string;
  slug?: string;
  icon?: string;
  color?: string;
  image?: string;
  parentId?: number;
  position?: number;
}

/**
 * DTO для обновления категории
 */
export type UpdateCategoryDto = Partial<CreateCategoryDto>;

// =======================
// BASE TYPES (snake_case - как в БД)
// =======================

/**
 * Базовые поля Category (snake_case - как в базе данных)
 */
export interface CategoryFields extends EntityBase {
  id: number;
  created_at: Date;
}

/**
 * Базовые поля только для чтения
 */
export type CategoryCreateFields = Omit<CategoryFields, 'id' | 'created_at' | 'updated_at'>;

// =======================
// RELATIONS TYPES
// =======================

/**
 * Информация о переводе категории
 */
export interface CategoryTranslationInfo {
  locale: string;
  name: string;
}

// =======================
// RESPONSE TYPES (camelCase)
// =======================

/**
 * Category для ответа API (camelCase)
 */
export interface CategoryResponse {
  id: number;
  createdAt: Date;
  name?: string;
  translations?: CategoryTranslationInfo[];
}

/**
 * Категория с загруженными отношениями
 */
export type CategoryWithRelations = CategoryFields & {
  translations?: CategoryTranslationFields[];
};

type CategoryTranslationFields = {
  category_id: number;
  locale: string;
  name: string;
};

// =======================
// QUERY TYPES
// =======================

/**
 * Параметры запроса для категорий
 */
export interface CategoryQueryParams {
  language?: string;
  parentId?: number;
}

// =======================
// FACTORY FUNCTIONS
// =======================

/**
 * Создать CategoryResponse из сущности с отношениями
 */
export function createCategoryResponse(
  category: CategoryWithRelations,
  language?: string,
): CategoryResponse {
  const response: CategoryResponse = {
    id: category.id,
    createdAt: category.created_at,
  };

  // Add name from translation
  if (category.translations && category.translations.length > 0) {
    const translation = language
      ? category.translations.find((t) => t.locale === language)
      : category.translations[0];

    if (translation) {
      response.name = translation.name;
    }
  }

  // Add all translations
  if (category.translations) {
    response.translations = category.translations.map((t) => ({
      locale: t.locale,
      name: t.name,
    }));
  }

  return response;
}
