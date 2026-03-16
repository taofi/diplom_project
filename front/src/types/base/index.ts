/**
 * Базовые типы для всех сущностей
 */

/**
 * Базовый интерфейс для всех сущностей с ID
 */
export interface EntityBase {
  id: number;
}

/**
 * Интерфейс с timestamps
 */
export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Базовые поля для пагинации
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Мета-информация о пагинации
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Результат с пагинацией
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Базовые параметры запроса
 */
export interface BaseQueryParams extends PaginationParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
