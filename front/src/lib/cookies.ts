import Cookies from 'js-cookie';
import { refreshTokens } from './api-auth';
import { User } from '@/context/auth/types';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const CSRF_KEY = 'csrf_token';
const USER_KEY = 'user_data';

const cookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export const getAccessToken = (): string | undefined => {
  return Cookies.get(TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  // 15 минут (1/96 дня)
  Cookies.set(TOKEN_KEY, token, { ...cookieOptions, expires: 1 / 96 });
};

export const getRefreshToken = (): string | undefined => {
  return Cookies.get(REFRESH_KEY);
};

export const setRefreshToken = (token: string): void => {
  // 7 дней
  Cookies.set(REFRESH_KEY, token, { ...cookieOptions, expires: 7 });
};

export const getCsrfToken = (): string | undefined => {
  return Cookies.get(CSRF_KEY);
};

export const setCsrfToken = (token: string): void => {
  Cookies.set(CSRF_KEY, token, { ...cookieOptions });
};

export const removeTokens = (): void => {
  Cookies.remove(TOKEN_KEY, { path: '/' });
  Cookies.remove(REFRESH_KEY, { path: '/' });
  Cookies.remove(CSRF_KEY, { path: '/' });
};

// Функция для ручного обновления токенов (используется при инициализации)
export const refreshAccessToken = async (): Promise<{ accessToken: string; refreshToken: string } | null> => {
  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) {
    return null;
  }

  return refreshTokens(refreshTokenValue);
};

// Сохранить данные пользователя в куки
export const setUserData = (user: User): void => {
  Cookies.set(USER_KEY, JSON.stringify(user), { ...cookieOptions, expires: 7 });
};

// Получить данные пользователя из куки
export const getUserData = (): User | null => {
  const userData = Cookies.get(USER_KEY);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData) as User;
  } catch {
    return null;
  }
};

// Удалить данные пользователя из куки
export const removeUserData = (): void => {
  Cookies.remove(USER_KEY, { path: '/' });
};
