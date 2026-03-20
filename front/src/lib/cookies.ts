import Cookies from 'js-cookie';
import { refreshTokens } from './api-auth';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const CSRF_KEY = 'csrf_token';

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
