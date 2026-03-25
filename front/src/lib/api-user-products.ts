/**
 * API для работы с купленными товарами пользователя
 */

import api from './api';

export interface UserProductResponse {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  licenseTypeId: number;
  licenseTypeName: string;
  price: number;
  purchasedAt: string;
  fileUrl: string;
  sellerId: number; // ID автора товара для создания чата
  count: number; // Количество единиц товара
}

/**
 * Получить список купленных товаров текущего пользователя
 */
export async function getUserProducts(): Promise<UserProductResponse[]> {
  const response = await api.get<UserProductResponse[]>('/user/products');
  return response.data;
}

/**
 * Скачать файл купленного товара
 */
export async function downloadProduct(productId: number): Promise<Blob> {
  const response = await api.get(`/user/products/${productId}/download`, {
    responseType: 'blob',
  });
  return response.data;
}
