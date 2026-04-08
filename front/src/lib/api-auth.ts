import api from './api';
import { User } from '@/context/auth/types';
import { toastSuccess } from './toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * API функции для аутентификации
 * Вынесены в отдельный файл для лучшей организации кода
 */

/**
 * Получить данные текущего пользователя
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

/**
 * Вход пользователя
 */
export const loginUser = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  toastSuccess('Успешно', 'Вход выполнен');
  return response.data;
};

/**
 * Регистрация пользователя
 */
export const registerUser = async (email: string, password: string, name: string) => {
  const response = await api.post('/auth/register', { email, password, name });
  toastSuccess('Успешно', 'Регистрация выполнена');
  return response.data;
};

/**
 * Выход пользователя
 */
export const logoutUser = async (): Promise<void> => {
  await api.post('/auth/logout');
  toastSuccess('Успешно', 'Вы вышли из системы');
};

/**
 * Обновить профиль пользователя
 * @param data - данные для обновления (name, avatar_url, description)
 */
export const updateProfile = async (data: {
  name?: string;
  avatar_url?: string;
  description?: string;
}): Promise<User> => {
  const response = await api.patch<User>('/auth/profile', data);
  return response.data;
};

/**
 * Загрузить аватар пользователя
 * @param file - файл изображения
 */
export const uploadAvatar = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<{ url: string }>('/uploads/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Обновить токены через refresh token
 * Использует прямой fetch для избежания циклических зависимостей
 */
export const refreshTokens = async (refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> => {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch {
    return null;
  }
};
