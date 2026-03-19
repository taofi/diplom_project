/**
 * Product Service
 * Универсальный сервис для работы с товарами
 * Включает: фильтрацию, пагинацию, поиск, CRUD операции
 * Функции добавления/удаления доступны только для author/admin
 */

import api from './api';
import { useAuth } from '@/context/auth/AuthContext';
import { useI18n } from '@/context/i18n/I18nContext';
import type {
  ProductResponse,
  ProductListResponse,
  ProductQueryParams,
  CreateProductDto,
  UpdateProductDto,
  MediaInfo,
  LicenseInfo,
  ProductType,
} from '@/types/product';

// =======================
// Types
// =======================

/** Параметры запроса с языком */
export interface ProductParams extends ProductQueryParams {
  /** Язык для переводов (ru, en) */
  language?: string;
}

/** Параметры для создания товара (доступно author/admin) */
export interface CreateProductParams {
  data: CreateProductDto;
  language?: string;
}

/** Параметры для обновления товара (доступно author/admin) */
export interface UpdateProductParams {
  id: number;
  data: UpdateProductDto;
  language?: string;
}

/** Параметры для удаления товара (доступно author/admin) */
export interface DeleteProductParams {
  id: number;
}

// =======================
// Helpers
// =======================

/**
 * Проверка роли пользователя
 */
function hasAdminOrAuthorRole(): boolean {
  // Функция будет работать только внутри React компонента
  // Для использования вне компонентов нужно передавать роль явно
  return true; // Заглушка - проверка делается на сервере
}

/**
 * Формирование URL с языковым параметром
 */
function buildLanguageParam(language?: string): string | undefined {
  if (language) {
    return language;
  }
  // Если язык не передан, используем текущий из контекста
  // Но так как эта функция не в React компоненте, возвращаем как есть
  return undefined;
}

// =======================
// Публичные функции (доступны всем)
// =======================

/**
 * Получить список товаров с фильтрацией, пагинацией и поиском
 * @param params - Параметры запроса (page, limit, search, categoryId, type, и т.д.)
 * @returns PaginatedResult с массивом товаров
 */
export async function getProducts(params?: ProductParams): Promise<ProductListResponse> {
  const queryParams = { ...params };
  
  // Добавляем язык в запрос если указан
  if (params?.language) {
    queryParams.language = params.language;
  }
  
  const response = await api.get<ProductListResponse>('/products', { params: queryParams });
  return response.data;
}

/**
 * Получить товар по ID с полным контентом (медиа, категории, переводы, лицензии)
 * @param id - ID товара
 * @param language - Язык для переводов (ru, en)
 * @returns Полный объект товара со всеми связанными данными
 */
export async function getProductById(id: number, language?: string): Promise<ProductResponse> {
  const params = language ? { language } : {};
  const response = await api.get<ProductResponse>(`/products/${id}`, { params });
  return response.data;
}

/**
 * Получить рекомендуемые (featured) товары
 * @param limit - Количество товаров
 * @param language - Язык для переводов
 */
export async function getFeaturedProducts(
  limit: number = 10,
  language?: string
): Promise<ProductListResponse> {
  const params: ProductParams = {
    isFeatured: true,
    limit,
    language,
  };
  return getProducts(params);
}

/**
 * Получить товары по категории
 * @param categoryId - ID категории
 * @param params - Дополнительные параметры
 */
export async function getProductsByCategory(
  categoryId: number,
  params?: ProductParams
): Promise<ProductListResponse> {
  return getProducts({ ...params, categoryId });
}

/**
 * Получить товары по типу (brush, illustration)
 * @param type - Тип товара
 * @param params - Дополнительные параметры
 */
export async function getProductsByType(
  type: ProductType,
  params?: ProductParams
): Promise<ProductListResponse> {
  return getProducts({ ...params, type });
}

/**
 * Поиск товаров
 * @param query - Поисковый запрос
 * @param params - Дополнительные параметры
 */
export async function searchProducts(
  query: string,
  params?: ProductParams
): Promise<ProductListResponse> {
  return getProducts({ ...params, search: query });
}

/**
 * Получить медиа товара
 * @param productId - ID товара
 */
export async function getProductMedia(productId: number): Promise<MediaInfo[]> {
  const response = await api.get<MediaInfo[]>(`/products/${productId}/media`);
  return response.data;
}

/**
 * Получить лицензии товара
 * @param productId - ID товара
 */
export async function getProductLicenses(productId: number): Promise<LicenseInfo[]> {
  const response = await api.get<LicenseInfo[]>(`/products/${productId}/licenses`);
  return response.data;
}

// =======================
// Функции для авторизованных пользователей (author/admin)
// =======================

/**
 * Получить мои товары (для продавца)
 * @param params - Параметры запроса
 */
export async function getMyProducts(params?: ProductParams): Promise<ProductListResponse> {
  const response = await api.get<ProductListResponse>('/products/my', { params });
  return response.data;
}

/**
 * Создать новый товар (доступно author/admin)
 * @param data - Данные товара
 * @param language - Язык для переводов
 * @returns Созданный товар
 */
export async function createProduct(
  data: CreateProductDto,
  language?: string
): Promise<ProductResponse> {
  const params = language ? { language } : {};
  const response = await api.post<ProductResponse>('/products', data, { params });
  return response.data;
}

/**
 * Обновить товар (доступно author/admin)
 * @param id - ID товара
 * @param data - Данные для обновления
 * @param language - Язык для переводов
 * @returns Обновленный товар
 */
export async function updateProduct(
  id: number,
  data: UpdateProductDto,
  language?: string
): Promise<ProductResponse> {
  const params = language ? { language } : {};
  const response = await api.patch<ProductResponse>(`/products/${id}`, data, { params });
  return response.data;
}

/**
 * Удалить товар (доступно author/admin)
 * @param id - ID товара
 */
export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}

/**
 * Активировать товар
 * @param id - ID товара
 */
export async function activateProduct(id: number): Promise<ProductResponse> {
  const response = await api.patch<ProductResponse>(`/products/${id}/activate`);
  return response.data;
}

/**
 * Деактивировать товар
 * @param id - ID товара
 */
export async function deactivateProduct(id: number): Promise<ProductResponse> {
  const response = await api.patch<ProductResponse>(`/products/${id}/deactivate`);
  return response.data;
}

/**
 * Добавить медиа к товару
 * @param productId - ID товара
 * @param data - Данные медиа
 */
export async function addProductMedia(
  productId: number,
  data: { url: string; mediaType?: string; isCover?: boolean; sortOrder?: number }
): Promise<MediaInfo> {
  const response = await api.post<MediaInfo>(`/products/${productId}/media`, data);
  return response.data;
}

/**
 * Удалить медиа товара
 * @param productId - ID товара
 * @param mediaId - ID медиа
 */
export async function deleteProductMedia(productId: number, mediaId: number): Promise<void> {
  await api.delete(`/products/${productId}/media/${mediaId}`);
}

/**
 * Добавить лицензию к товару
 * @param productId - ID товара
 * @param data - Данные лицензии
 */
export async function addProductLicense(
  productId: number,
  data: { licenseTypeId: number; price: number }
): Promise<LicenseInfo> {
  const response = await api.post<LicenseInfo>(`/products/${productId}/licenses`, data);
  return response.data;
}

// =======================
// React Hook для удобной работы (опционально)
// =======================

/**
 * Хук для работы с товарами с автоматическим использованием языка из контекста
 * Использовать внутри React компонентов
 * 
 * @example
 * ```tsx
 * const { products, loading, error, fetchProducts } = useProductService();
 * 
 * // Получить товары
 * useEffect(() => {
 *   fetchProducts({ page: 1, limit: 10 });
 * }, []);
 * 
 * // Создать товар (только для author/admin)
 * const handleCreate = async () => {
 *   await createProduct({ name: 'New Product', price: 99, type: 'brush' });
 * };
 * ```
 */
// export function useProductService() {
//   const { user } = useAuth();
//   const { locale } = useI18n();
// 
//   const isAuthorOrAdmin = user?.roles?.includes('author') || user?.roles?.includes('admin');
// 
//   const fetchProducts = async (params?: ProductParams) => {
//     return getProducts({ ...params, language: locale });
//   };
// 
//   const fetchProductById = async (id: number) => {
//     return getProductById(id, locale);
//   };
// 
//   const create = async (data: CreateProductDto) => {
//     if (!isAuthorOrAdmin) {
//       throw new Error('Доступно только для author или admin');
//     }
//     return createProduct(data, locale);
//   };
// 
//   const update = async (id: number, data: UpdateProductDto) => {
//     if (!isAuthorOrAdmin) {
//       throw new Error('Доступно только для author или admin');
//     }
//     return updateProduct(id, data, locale);
//   };
// 
//   const remove = async (id: number) => {
//     if (!isAuthorOrAdmin) {
//       throw new Error('Доступно только для author или admin');
//     }
//     return deleteProduct(id);
//   };
// 
//   return {
//     // Публичные функции
//     fetchProducts,
//     fetchProductById,
//     searchProducts: (query: string, params?: ProductParams) => 
//       searchProducts(query, { ...params, language: locale }),
//     getFeaturedProducts: (limit?: number) => 
//       getFeaturedProducts(limit, locale),
//     getProductsByCategory: (categoryId: number, params?: ProductParams) =>
//       getProductsByCategory(categoryId, { ...params, language: locale }),
//     getProductsByType: (type: 'brush' | 'illustration', params?: ProductParams) =>
//       getProductsByType(type, { ...params, language: locale }),
//     getProductMedia,
//     getProductLicenses,
//     
//     // Функции для author/admin
//     create,
//     update,
//     remove,
//     activate: activateProduct,
//     deactivate: deactivateProduct,
//     addMedia: addProductMedia,
//     removeMedia: deleteProductMedia,
//     addLicense: addProductLicense,
//     
//     // Проверка прав
//     isAuthorOrAdmin,
//   };
// }

// =======================
// Re-export types
// =======================

export type {
  ProductResponse,
  ProductListResponse,
  ProductQueryParams,
  CreateProductDto,
  UpdateProductDto,
  MediaInfo,
  LicenseInfo,
  ProductType,
} from '@/types/product';
