import { Injectable, BadRequestException } from '@nestjs/common';
import { FileService } from '../common/services/file.service';
import { FileUploadResult } from '../types/base';
import type { MulterFile } from '../common/services/file.service';

const MAX_TEMP_MEDIA_SIZE = 400 * 1024 * 1024;

@Injectable()
export class UploadsService {
  constructor(private readonly fileService: FileService) {}

  /**
   * Загрузить медиа файл во временную папку
   * @param userId - ID пользователя
   * @param file - Загруженный файл
   */
  uploadTempMedia(userId: number, file: MulterFile): FileUploadResult {
    const mimeType = file?.mimetype || '';
    const isSupportedMedia =
      mimeType.startsWith('image/') || mimeType.startsWith('video/');
    if (!isSupportedMedia) {
      throw new BadRequestException('Only image and video files are allowed for media');
    }

    if (file.size > MAX_TEMP_MEDIA_SIZE) {
      throw new BadRequestException('Media file size must be less than 400MB');
    }

    return this.fileService.saveTempMedia(file, userId);
  }

  /**
   * Загрузить основной файл продукта во временную папку
   * @param userId - ID пользователя
   * @param file - Загруженный файл
   */
  uploadTempFile(userId: number, file: MulterFile): FileUploadResult {
    // Проверить размер (макс 50MB)
    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 50MB');
    }

    return this.fileService.saveTempFile(file, userId);
  }

  /**
   * Переместить все временные файлы продукта в постоянную папку
   * @param userId - ID пользователя
   * @param productId - ID продукта
   * @param tempFileUrl - Временный URL основного файла (опционально)
   * @param tempMediaUrls - Массив временных URL медиа
   */
  moveProductFiles(
    userId: number,
    productId: number,
    tempFileUrl?: string,
    tempMediaUrls?: string[],
  ): {
    file: FileUploadResult | null;
    media: FileUploadResult[];
  } {
    let fileResult: FileUploadResult | null = null;

    // Переместить основной файл
    if (tempFileUrl) {
      const result = this.fileService.moveTempFileToProduct(
        userId,
        productId,
        tempFileUrl,
      );
      if (result) {
        fileResult = result;
      }
    }

    // Переместить медиа файлы
    const mediaResults: FileUploadResult[] = [];
    if (tempMediaUrls && tempMediaUrls.length > 0) {
      const results = this.fileService.moveTempMediaToProduct(
        userId,
        productId,
        tempMediaUrls,
      );
      mediaResults.push(...results);
    }

    return {
      file: fileResult,
      media: mediaResults,
    };
  }

  /**
   * Очистить временную папку пользователя
   * @param userId - ID пользователя
   */
  clearTempFolder(userId: number): void {
    this.fileService.deleteTempFolder(userId);
  }

  /**
   * Загрузить аватар пользователя
   * @param userId - ID пользователя
   * @param file - Загруженный файл
   */
  uploadAvatar(userId: number, file: MulterFile): FileUploadResult {
    // Проверить тип файла (только изображения)
    if (!file?.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed for avatar');
    }

    // Проверить размер (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Avatar file size must be less than 10MB');
    }

    return this.fileService.saveUserAvatar(file, userId);
  }

  /**
   * Проверить, является ли URL временным
   */
  isTempUrl(url: string): boolean {
    return url.includes('/temp/');
  }

  /**
   * Извлечь userId из временного URL
   */
  getUserIdFromTempUrl(url: string): number | null {
    const match = url.match(/\/temp\/(\d+)\//);
    return match ? parseInt(match[1], 10) : null;
  }
}
