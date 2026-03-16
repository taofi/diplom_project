/**
 * Product Query Types - Типы для запросов продуктов
 */

import type { BaseQueryParams, PaginatedResult } from '../base';
import { ProductType } from './enums';
import type { ProductResponse } from './product-relations.types';

/**
 * Параметры запроса продуктов
 */
export interface ProductQueryParams extends BaseQueryParams {
  /** ID категории */
  categoryId?: number;
  /** Активен ли товар */
  isActive?: boolean;
  /** Тип товара */
  type?: ProductType;
  /** ID продавца */
  sellerId?: number;
  /** Избранный товар */
  isFeatured?: boolean;
  /** Минимальная цена */
  minPrice?: number;
  /** Максимальная цена */
  maxPrice?: number;
  /** Язык для переводов */
  language?: string;
}

/**
 * Ответ со списком продуктов
 */
export type ProductListResponse = PaginatedResult<ProductResponse>;
