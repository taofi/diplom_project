

import type { OrderItem } from '../base/entity-base';


export interface PaginationParams {
  page?: number;
  limit?: number;
}


export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}


export interface BaseQueryParams extends PaginationParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}


export const DEFAULT_PAGINATION: Required<PaginationParams> = {
  page: 1,
  limit: 10,
};


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


export function calculateOffset(page?: number, limit?: number): number {
  const p = page ?? DEFAULT_PAGINATION.page;
  const l = limit ?? DEFAULT_PAGINATION.limit;
  return (p - 1) * l;
}


export function normalizePaginationParams(
  params?: PaginationParams,
): Required<PaginationParams> {
  return {
    page: params?.page ?? DEFAULT_PAGINATION.page,
    limit: Math.min(params?.limit ?? DEFAULT_PAGINATION.limit, 100),
  };
}


export type SortOrder = 'ASC' | 'DESC' | 'asc' | 'desc';


export function normalizeSortOrder(order?: SortOrder): 'ASC' | 'DESC' {
  if (!order) return 'DESC';
  return order.toUpperCase() as 'ASC' | 'DESC';
}


export function createOrderClause(
  sortBy?: string,
  sortOrder?: SortOrder,
): OrderItem[] {
  if (!sortBy) return [['createdAt', 'DESC']];
  return [[sortBy, normalizeSortOrder(sortOrder)]];
}


