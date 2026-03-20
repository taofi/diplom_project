import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import {
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  removeTokens,
} from './cookies';
import { toastError, getErrorMessage } from './toast';
import { translateError } from './i18n-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void): void => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string): void => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Request interceptor - добавляем токены
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    const csrfToken = Cookies.get('csrf_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Добавляем CSRF токен для мутаций
    if (
      csrfToken &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
        config.method?.toUpperCase() || '',
      )
    ) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Коды ошибок, для которых НЕ показываем toast (они обрабатываются автоматически)
const IGNORED_ERROR_CODES = [401];

// Response interceptor - обрабатываем 401 и refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get('refresh_token');

      if (!refreshToken) {
        removeTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        setAccessToken(accessToken);
        setRefreshToken(newRefreshToken);

        onTokenRefreshed(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        removeTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Показываем toast для остальных ошибок
    const status = error.response?.status;
    if (status && !IGNORED_ERROR_CODES.includes(status)) {
      const rawMessage = getErrorMessage(error);
      const translatedMessage = translateError(rawMessage);
      toastError('Ошибка', translatedMessage);
    }

    return Promise.reject(error);
  }
);

// Product API functions
import * as productApi from './api-product';

export { productApi };

export default api;
