/**
 * Toast утилита для отображения уведомлений
 * Использует библиотеку sonner
 */

import { toast as sonnerToast } from 'sonner';

/** Типы уведомлений */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Показать уведомление
 */
export const showToast = (
  message: string,
  type: ToastType = 'info',
  options?: {
    duration?: number;
    description?: string;
  }
): string | number | undefined => {
  const defaultDuration = 4000;
  
  switch (type) {
    case 'success':
      return sonnerToast.success(message, {
        duration: options?.duration ?? defaultDuration,
        description: options?.description,
      });
    case 'error':
      return sonnerToast.error(message, {
        duration: options?.duration ?? 5000,
        description: options?.description,
      });
    case 'warning':
      return sonnerToast.warning(message, {
        duration: options?.duration ?? defaultDuration,
        description: options?.description,
      });
    case 'info':
    default:
      return sonnerToast.info(message, {
        duration: options?.duration ?? defaultDuration,
        description: options?.description,
      });
  }
};

/**
 * Показать успешное уведомление
 */
export const toastSuccess = (message: string, description?: string): string | number | undefined => {
  return showToast(message, 'success', { description });
};

/**
 * Показать ошибку
 */
export const toastError = (message: string, description?: string): string | number | undefined => {
  return showToast(message, 'error', { description });
};

/**
 * Показать предупреждение
 */
export const toastWarning = (message: string, description?: string): string | number | undefined => {
  return showToast(message, 'warning', { description });
};

/**
 * Показать информационное уведомление
 */
export const toastInfo = (message: string, description?: string): string | number | undefined => {
  return showToast(message, 'info', { description });
};

/**
 * Скрыть все уведомления
 */
export const dismissAllToasts = (): void => {
  sonnerToast.dismiss();
};

/**
 * Функция для извлечения сообщения об ошибке из различных источников
 * Специально для NestJS формата: { message, error, statusCode }
 */
export const getErrorMessage = (error: unknown): string => {
  // Обработка axios ошибки
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as {
      response?: {
        data?: { message?: string; error?: string; msg?: string };
        status?: number;
      };
    };
    
    const data = axiosError.response?.data;
    
    // NestJS формат: { message, error, statusCode }
    if (data && typeof data === 'object') {
      // Сначала пробуем message (основное сообщение)
      if ('message' in data && data.message) {
        return String(data.message);
      }
      // Потом error (тип ошибки, например "Forbidden")
      if ('error' in data && data.error) {
        return String(data.error);
      }
      // Альтернативное поле msg
      if ('msg' in data && data.msg) {
        return String(data.msg);
      }
    }
    
    // Фоллбек на message самого error
    return error.message;
  }
  
  // Обработка прямого объекта ошибки
  if (error && typeof error === 'object') {
    const err = error as { message?: string; error?: string; msg?: string };
    if (err.message) return String(err.message);
    if (err.error) return String(err.error);
    if (err.msg) return String(err.msg);
  }
  
  // Обработка строки
  if (typeof error === 'string') {
    return error;
  }
  
  // Стандартная ошибка
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Произошла неизвестная ошибка';
};

export default showToast;
