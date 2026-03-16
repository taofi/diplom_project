/**
 * Общие типы для пагинации и запросов
 */

import type { OrderItem } from '../base/entity-base';

/**
 * Параметры пагинации
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
 * Базовые параметры запроса с фильтрами
 */
export interface BaseQueryParams extends PaginationParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Дефолтные значения пагинации
 */
export const DEFAULT_PAGINATION: Required<PaginationParams> = {
  page: 1,
  limit: 10,
};

/**
 * Создать мета-информацию для пагинации
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Вычислить offset для запроса
 */
export function calculateOffset(page?: number, limit?: number): number {
  const p = page ?? DEFAULT_PAGINATION.page;
  const l = limit ?? DEFAULT_PAGINATION.limit;
  return (p - 1) * l;
}

/**
 * Нормализовать параметры пагинации
 */
export function normalizePaginationParams(
  params?: PaginationParams,
): Required<PaginationParams> {
  return {
    page: params?.page ?? DEFAULT_PAGINATION.page,
    limit: Math.min(params?.limit ?? DEFAULT_PAGINATION.limit, 100), // Максимум 100 записей
  };
}

/**
 * Тип для sort order
 */
export type SortOrder = 'ASC' | 'DESC' | 'asc' | 'desc';

/**
 * Нормализовать sort order
 */
export function normalizeSortOrder(order?: SortOrder): 'ASC' | 'DESC' {
  if (!order) return 'DESC';
  return order.toUpperCase() as 'ASC' | 'DESC';
}

/**
 * Создать order clause для Sequelize
 */
export function createOrderClause(
  sortBy?: string,
  sortOrder?: SortOrder,
): OrderItem[] {
  if (!sortBy) return [['createdAt', 'DESC']];
  return [[sortBy, normalizeSortOrder(sortOrder)]];
}
