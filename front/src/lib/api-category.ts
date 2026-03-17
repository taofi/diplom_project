/**
 * Category Service
 * API для работы с категориями (тегами)
 */

import api from './api';
import type {
  CategoryResponse,
  CategoryWithCount,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryParams,
} from '@/types/category';

// =======================
// Публичные функции
// =======================

/**
 * Получить все категории
 */
export async function getCategories(params?: CategoryQueryParams): Promise<CategoryResponse[]> {
  const response = await api.get<CategoryResponse[]>('/categories', {
    params,
  });
  return response.data;
}

/**
 * Получить категорию по ID
 */
export async function getCategoryById(
  id: number,
  language?: string
): Promise<CategoryResponse> {
  const response = await api.get<CategoryResponse>(`/categories/${id}`, {
    params: { language },
  });
  return response.data;
}

/**
 * Получить количество товаров в категории
 */
export async function getCategoryProductsCount(id: number): Promise<number> {
  const response = await api.get<{ count: number }>(`/categories/${id}/count`);
  return response.data.count;
}

/**
 * Получить ID товаров категории
 */
export async function getCategoryProducts(id: number): Promise<number[]> {
  const response = await api.get<{ productIds: number[] }>(`/categories/${id}/products`);
  return response.data.productIds;
}

// =======================
// Admin функции (требуют авторизации)
// =======================

/**
 * Создать категорию (только админ)
 */
export async function createCategory(
  data: CreateCategoryDto,
  language?: string
): Promise<CategoryResponse> {
  const response = await api.post<CategoryResponse>('/categories', data, {
    params: { language },
  });
  return response.data;
}

/**
 * Обновить категорию (только админ)
 */
export async function updateCategory(
  id: number,
  data: UpdateCategoryDto,
  language?: string
): Promise<CategoryResponse> {
  const response = await api.patch<CategoryResponse>(`/categories/${id}`, data, {
    params: { language },
  });
  return response.data;
}

/**
 * Удалить категорию (только админ)
 */
export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}

/**
 * Добавить товар в категорию (только админ)
 */
export async function addProductToCategory(
  categoryId: number,
  productId: number
): Promise<void> {
  await api.post(`/categories/${categoryId}/products/${productId}`);
}

/**
 * Удалить товар из категории (только админ)
 */
export async function removeProductFromCategory(
  categoryId: number,
  productId: number
): Promise<void> {
  await api.delete(`/categories/${categoryId}/products/${productId}`);
}
