/**
 * Типы для работы с файлами
 * Содержит интерфейсы и enum для файловых операций
 */

/**
 * Интерфейс результата загрузки файла
 */
export interface FileUploadResult {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

/**
 * Интерфейс результата удаления файла
 */
export interface FileDeleteResult {
  success: boolean;
  deletedPath?: string;
}

/**
 * Интерфейс для загруженного файла из Multer
 */
export interface MulterFile {
  originalname: string;
  buffer?: Buffer;
  size: number;
  mimetype: string;
  /**
   * Путь к файлу на диске (доступен при использовании diskStorage)
   */
  path?: string;
  /**
   * Имя файла (доступно при использовании diskStorage)
   */
  filename?: string;
}

/**
 * Интерфейс информации о файле
 */
export interface FileInfo {
  size: number;
  createdAt: Date;
}

/**
 * Папки для медиа (изображения, видео) - хранятся в public/
 */
export enum MediaFolder {
  PRODUCT = 'product',
  TEMP = 'temp',
  OFFERS = 'offers', // Для превью заказов
  CHAT = 'chat',
}

/**
 * Папки для файлов (основные файлы продуктов) - хранятся в files/
 */
export enum FileFolder {
  PRODUCT = 'product',
  TEMP = 'temp',
  OFFERS = 'offers', // Для исходников заказов
}

/**
 * Тип файла
 * MEDIA - изображения/видео → public/
 * FILE - основные файлы → files/
 */
export enum FileType {
  MEDIA = 'media',
  FILE = 'file',
}

/**
 * Параметры для сохранения файла
 */
export interface SavePathOptions {
  type: FileType;
  folder: MediaFolder | FileFolder;
  entityId?: number; // Необязательно для temp
  userId: number; // Для temp папки
}

/**
 * Интерфейс для результата перемещения файлов продукта
 */
export interface MoveProductFilesResult {
  media: FileUploadResult[];
  file: FileUploadResult | null;
}

/**
 * Интерфейс временного файла
 */
export interface TempFile {
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
}
