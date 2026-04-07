/**
 * API функции для загрузки файлов
 * Использует серверные endpoints /uploads/temp/*
 */

import api from './api';

export const MAX_MEDIA_UPLOAD_SIZE_MB = 400;

/**
 * Результат загрузки файла
 */
export interface UploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
}

/**
 * Загрузить временное медиа (изображение)
 * @param file - Файл для загрузки
 * @returns URL загруженного файла
 */
export async function uploadTempMedia(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadResult>('/uploads/temp/media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Загрузить временный файл продукта
 * @param file - Файл для загрузки
 * @returns URL загруженного файла
 */
export async function uploadTempFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadResult>('/uploads/temp/file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Параметры для подтверждения перемещения файлов
 */
export interface ConfirmProductFilesParams {
  productId: number;
  tempFileUrl?: string;
  tempMediaUrls?: string[];
}

/**
 * Подтвердить перемещение файлов при создании продукта
 * Перемещает файлы из temp в папку продукта
 */
export async function confirmProductFiles(
  params: ConfirmProductFilesParams,
): Promise<{ file: UploadResult | null; media: UploadResult[] }> {
  const response = await api.post<{
    file: UploadResult | null;
    media: UploadResult[];
  }>('/uploads/temp/confirm', params);

  return response.data;
}

/**
 * Очистить временную папку пользователя
 * Удаляет все загруженные, но не подтвержденные файлы
 */
export async function clearTempFiles(): Promise<void> {
  await api.delete('/uploads/temp');
}

/**
 * Проверить, является ли URL временным
 */
export function isTempUrl(url: string): boolean {
  return url.includes('/temp/');
}

/**
 * Извлечь имя файла из URL
 */
export function getFileNameFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1] || '';
}

/**
 * Проверить тип файла по MIME
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Проверить тип файла по MIME
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Получить расширение файла
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Проверить допустимые типы файлов для медиа
 */
export function isValidMediaType(file: File): boolean {
  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
  ];
  return validTypes.includes(file.type);
}

/**
 * Проверить допустимые типы файлов для продуктов
 */
export function isValidFileType(file: File): boolean {
  const validMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-photoshop',
    'image/vnd.adobe.photoshop',
    'application/octet-stream',
  ];
  const validExtensions = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'svg',
    'pdf',
    'zip',
    'rar',
    '7z',
    'psd',
    'brush',
    'abr',
  ];

  const extension = getFileExtension(file.name);
  return validMimeTypes.includes(file.type) || validExtensions.includes(extension);
}

/**
 * Форматировать размер файла
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
