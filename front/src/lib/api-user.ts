/**
 * User Service
 * API для работы с пользователями (админ-функции)
 */

import api from './api';

// =======================
// Типы
// =======================

export type UserRole = 'admin' | 'author' | 'user';

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: UserRole[];
  locale: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsersResponse {
  data: UserResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateUserRolesDto {
  roles: UserRole[];
}

export interface UpdateUserLocaleDto {
  locale: string;
}

// =======================
// Admin функции (требуют авторизации и роли admin)
// =======================

/**
 * Получить всех пользователей с пагинацией и поиском
 */
export async function getUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<UsersResponse> {
  const response = await api.get<UsersResponse>('/users', { params });
  return response.data;
}

/**
 * Получить пользователя по ID
 */
export async function getUserById(id: number): Promise<UserResponse> {
  const response = await api.get<UserResponse>(`/users/${id}`);
  return response.data;
}

/**
 * Обновить роли пользователя
 */
export async function updateUserRoles(
  id: number,
  roles: UserRole[]
): Promise<UserResponse> {
  const response = await api.patch<UserResponse>(`/users/${id}/roles`, {
    roles,
  });
  return response.data;
}

/**
 * Обновить язык пользователя
 */
export async function updateUserLocale(
  id: number,
  locale: string
): Promise<UserResponse> {
  const response = await api.patch<UserResponse>(`/users/${id}/locale`, {
    locale,
  });
  return response.data;
}
