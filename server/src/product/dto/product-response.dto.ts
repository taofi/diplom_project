/**
 * Product Response DTO
 * Использует централизованные типы из types/
 */

import type {
  ProductResponse,
  ProductWithRelations,
  ProductListResponse,
  createProductResponse,
  createProductListResponse,
} from '../../types/product';

// Ре-экспорт типов для удобства
export type { ProductResponse, ProductWithRelations, ProductListResponse };

// Функции для конвертации
export { createProductResponse, createProductListResponse };
