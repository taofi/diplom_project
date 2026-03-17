/**
 * Типы для Category (тегов/категорий товаров)
 */

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
// RESPONSE TYPES (camelCase)
// =======================

/**
 * Информация о переводе категории
 */
export interface CategoryTranslationInfo {
  locale: string;
  name: string;
}

/**
 * Category для ответа API (camelCase)
 */
export interface CategoryResponse {
  id: number;
  createdAt: string;
  name?: string;
  translations?: CategoryTranslationInfo[];
}

/**
 * Категория с количеством товаров
 */
export interface CategoryWithCount extends CategoryResponse {
  productsCount?: number;
}

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
