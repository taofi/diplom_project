/**
 * LicenseType Service
 * API для работы с типами лицензий
 */

import api from './api';
import type {
  LicenseTypeResponse,
  CreateLicenseTypeDto,
  UpdateLicenseTypeDto,
  LicenseTypeQueryParams,
} from '@/types/license-type';

// =======================
// Публичные функции
// =======================

/**
 * Получить все типы лицензий
 */
export async function getLicenseTypes(
  params?: LicenseTypeQueryParams
): Promise<LicenseTypeResponse[]> {
  const response = await api.get<LicenseTypeResponse[]>('/license-types', {
    params,
  });
  return response.data;
}

/**
 * Получить тип лицензии по ID
 */
export async function getLicenseTypeById(
  id: number,
  language?: string
): Promise<LicenseTypeResponse> {
  const response = await api.get<LicenseTypeResponse>(`/license-types/${id}`, {
    params: { language },
  });
  return response.data;
}

/**
 * Получить количество товаров с типом лицензии
 */
export async function getLicenseTypeProductsCount(id: number): Promise<number> {
  const response = await api.get<{ count: number }>(`/license-types/${id}/count`);
  return response.data.count;
}

// =======================
// Admin функции (требуют авторизации)
// =======================

/**
 * Создать тип лицензии (только админ)
 */
export async function createLicenseType(
  data: CreateLicenseTypeDto,
  language?: string
): Promise<LicenseTypeResponse> {
  const response = await api.post<LicenseTypeResponse>('/license-types', data, {
    params: { language },
  });
  return response.data;
}

/**
 * Обновить тип лицензии (только админ)
 */
export async function updateLicenseType(
  id: number,
  data: UpdateLicenseTypeDto,
  language?: string
): Promise<LicenseTypeResponse> {
  const response = await api.patch<LicenseTypeResponse>(`/license-types/${id}`, data, {
    params: { language },
  });
  return response.data;
}

/**
 * Удалить тип лицензии (только админ)
 */
export async function deleteLicenseType(id: number): Promise<void> {
  await api.delete(`/license-types/${id}`);
}
