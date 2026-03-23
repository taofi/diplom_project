import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StreamableFile } from '@nestjs/common';
import {
  FileUploadResult,
  FileDeleteResult,
  MulterFile,
  FileInfo,
  MediaFolder,
  FileFolder,
} from '../../types/base';

// Экспорт для обратной совместимости
export { MediaFolder, FileFolder };
export type { FileUploadResult, FileDeleteResult, MulterFile, FileInfo };

/**
 * FileService - низкоуровневые операции с файлами
 * Используется UploadsModule для более высокоуровневых операций
 */
@Injectable()
export class FileService {
  // Базовые пути
  private readonly publicMediaBasePath = 'public/media';
  private readonly filesBasePath = 'files';

  /**
   * Сохранить файл в public/media
   * @param file - Загруженный файл
   * @param folder - Папка (product, temp)
   * @param entityId - ID сущности
   */
  saveMediaFile(
    file: MulterFile,
    folder: MediaFolder,
    entityId: number,
  ): FileUploadResult {
    const targetDir = path.join(
      this.publicMediaBasePath,
      folder,
      entityId.toString(),
    );
    this.ensureDirectory(targetDir);

    const filename = this.generateUniqueFilename(targetDir, file.originalname);
    const filePath = path.join(targetDir, filename);

    // Поддержка как memory storage (file.buffer), так и disk storage (file.path)
    const fileData = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
    if (!fileData) {
      throw new Error('No file data available: both buffer and path are undefined');
    }
    fs.writeFileSync(filePath, fileData);

    return {
      filename,
      originalName: file.originalname,
      path: filePath,
      url: `/media/${folder}/${entityId}/${filename}`,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Сохранить файл в files/
   * @param file - Загруженный файл
   * @param folder - Папка (product, temp)
   * @param entityId - ID сущности
   */
  saveProductFile(
    file: MulterFile,
    folder: FileFolder,
    entityId: number,
  ): FileUploadResult {
    const targetDir = path.join(
      this.filesBasePath,
      folder,
      entityId.toString(),
    );
    this.ensureDirectory(targetDir);

    const filename = this.generateUniqueFilename(targetDir, file.originalname);
    const filePath = path.join(targetDir, filename);

    // Поддержка как memory storage (file.buffer), так и disk storage (file.path)
    const fileData = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
    if (!fileData) {
      throw new Error('No file data available: both buffer and path are undefined');
    }
    fs.writeFileSync(filePath, fileData);

    return {
      filename,
      originalName: file.originalname,
      path: filePath,
      url: `/files/${folder}/${entityId}/${filename}`,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Сохранить временный файл (media) в public/temp/{userId}/
   */
  saveTempMedia(file: MulterFile, userId: number): FileUploadResult {
    if (!userId) {
      throw new Error('User ID is required for saving temp media');
    }
    const targetDir = path.join(this.publicMediaBasePath, MediaFolder.TEMP, userId.toString());
    this.ensureDirectory(targetDir);

    const filename = this.generateUniqueFilename(targetDir, file.originalname);
    const filePath = path.join(targetDir, filename);

    // Поддержка как memory storage (file.buffer), так и disk storage (file.path)
    const fileData = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
    if (!fileData) {
      throw new Error('No file data available: both buffer and path are undefined');
    }
    fs.writeFileSync(filePath, fileData);

    return {
      filename,
      originalName: file.originalname,
      path: filePath,
      url: `media/temp/${userId}/${filename}`,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Сохранить временный файл (product file) в files/temp/{userId}/
   */
  saveTempFile(file: MulterFile, userId: number): FileUploadResult {
    if (!userId) {
      throw new Error('User ID is required for saving temp file');
    }
    const targetDir = path.join(
      this.filesBasePath,
      FileFolder.TEMP,
      userId.toString(),
    );
    this.ensureDirectory(targetDir);

    const filename = this.generateUniqueFilename(targetDir, file.originalname);
    const filePath = path.join(targetDir, filename);

    // Поддержка как memory storage (file.buffer), так и disk storage (file.path)
    const fileData = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
    if (!fileData) {
      throw new Error('No file data available: both buffer and path are undefined');
    }
    fs.writeFileSync(filePath, fileData);

    return {
      filename,
      originalName: file.originalname,
      path: filePath,
      url: `/files/temp/${userId}/${filename}`,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Переместить файл из одной папки в другую
   * @param fromPath - Текущий путь к файлу (относительный или абсолютный)
   * @param toDir - Целевая директория
   * @param newFilename - Новое имя файла (опционально)
   */
  moveFile(
    fromPath: string,
    toDir: string,
    newFilename?: string,
  ): FileUploadResult | null {
    // Определить полный путь
    let fullFromPath = fromPath;



    // Если путь относительный, определить базовую директорию
    // Убираем ведующий слеш если есть
    const cleanFromPath = fromPath.startsWith('/') ? fromPath.slice(1) : fromPath;
    
    if (!path.isAbsolute(cleanFromPath)) {
      if (cleanFromPath.startsWith('media/')) {
        fullFromPath = path.join(process.cwd(), 'public', cleanFromPath);

      } else if (cleanFromPath.startsWith('files/')) {
        fullFromPath = path.join(process.cwd(), cleanFromPath);

      } else {
        fullFromPath = path.join(process.cwd(), cleanFromPath);

      }
    }



    if (!fs.existsSync(fullFromPath)) {

      return null;
    }

    // Создать целевую директорию
    this.ensureDirectory(toDir);

    // Определить новое имя
    const originalName = path.basename(fullFromPath);
    const filename = newFilename || originalName;
    const toPath = path.join(toDir, filename);

    // Переместить файл (rename = move, исходный файл удаляется)
    fs.renameSync(fullFromPath, toPath);
    
    // Проверяем что файл перемещен (исходный должен быть удален)
    if (fs.existsSync(fullFromPath)) {
      fs.unlinkSync(fullFromPath);
    }

    // Определить URL (без ведущего слеша)
    // Нормализуем путь для кроссплатформенной совместимости
    const normalizedToDir = toDir.replace(/\\/g, '/');
    let url: string;
    

    
    if (normalizedToDir.includes('public/media') || normalizedToDir.includes('media/product')) {
      // Для media файлов - формируем путь media/product/{id}/filename
      const productMatch = normalizedToDir.match(/media\/product\/(\d+)/);
      if (productMatch) {
        url = `media/product/${productMatch[1]}/${filename}`;

      } else {
        // Fallback для других случаев
        const relativePath = toDir.replace(path.join(process.cwd(), 'public'), '');
        url = `media${relativePath}/${filename}`.replace(/\\/g, '/').replace(/^\//, '');
      }
    } else if (normalizedToDir.includes('files')) {
      // Для файлов - формируем путь files/product/{id}/filename
      const fileProductMatch = normalizedToDir.match(/files\/product\/(\d+)/);
      if (fileProductMatch) {
        url = `files/product/${fileProductMatch[1]}/${filename}`;

      } else {
        const relativePath = toDir.replace(process.cwd(), '');
        url = `${relativePath}/${filename}`.replace(/\\/g, '/').replace(/^\//, '');
      }
    } else {
      url = filename;

    }

    const stats = fs.statSync(toPath);

    return {
      filename,
      originalName,
      path: toPath,
      url,
      size: stats.size,
      mimeType: this.getMimeType(filename),
    };
  }

  /**
   * Переместить временные media файлы в папку продукта
   * @param userId - ID пользователя
   * @param productId - ID продукта
   * @param tempUrls - Массив временных URL медиа
   */
  moveTempMediaToProduct(
    userId: number,
    productId: number,
    tempUrls: string[],
  ): FileUploadResult[] {
    const results: FileUploadResult[] = [];
    const targetDir = path.join(
      this.publicMediaBasePath,
      MediaFolder.PRODUCT,
      productId.toString(),
    );

    for (const tempUrl of tempUrls) {
      const result = this.moveFile(tempUrl, targetDir);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Переместить временный файл продукта в папку продукта
   * @param userId - ID пользователя
   * @param productId - ID продукта
   * @param tempUrl - Временный URL файла
   */
  moveTempFileToProduct(
    userId: number,
    productId: number,
    tempUrl: string,
  ): FileUploadResult | null {
    const targetDir = path.join(
      this.filesBasePath,
      FileFolder.PRODUCT,
      productId.toString(),
    );

    return this.moveFile(tempUrl, targetDir);
  }

  /**
   * Удалить файл
   * @param filePath - Путь к файлу (URL или относительный путь)
   */
  deleteFile(filePath: string): FileDeleteResult {
    const fullPath = this.getFullPath(filePath);

    if (!fullPath || !fs.existsSync(fullPath)) {
      return { success: false };
    }

    fs.unlinkSync(fullPath);
    return { success: true, deletedPath: fullPath };
  }

  /**
   * Удалить все файлы в папке сущности (media)
   */
  deleteMediaFolderFiles(folder: MediaFolder, entityId: number): void {
    const targetDir = path.join(this.publicMediaBasePath, folder, entityId.toString());

    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
  }

  /**
   * Удалить все файлы в папке сущности (files)
   */
  deleteFileFolderFiles(folder: FileFolder, entityId: number): void {
    const targetDir = path.join(this.filesBasePath, folder, entityId.toString());

    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
  }

  /**
   * Удалить временную папку пользователя (и media, и files)
   */
  deleteTempFolder(userId: number): void {
    // Удалить temp media
    const tempMediaDir = path.join(
      this.publicMediaBasePath,
      MediaFolder.TEMP,
      userId.toString(),
    );
    if (fs.existsSync(tempMediaDir)) {
      fs.rmSync(tempMediaDir, { recursive: true, force: true });
    }

    // Удалить temp files
    const tempFilesDir = path.join(
      this.filesBasePath,
      FileFolder.TEMP,
      userId.toString(),
    );
    if (fs.existsSync(tempFilesDir)) {
      fs.rmSync(tempFilesDir, { recursive: true, force: true });
    }
  }

  /**
   * Проверить существование файла
   */
  fileExists(filePath: string): boolean {
    const fullPath = this.getFullPath(filePath);
    return fullPath ? fs.existsSync(fullPath) : false;
  }

  /**
   * Получить информацию о файле
   */
  getFileInfo(filePath: string): FileInfo | null {
    const fullPath = this.getFullPath(filePath);

    if (!fullPath || !fs.existsSync(fullPath)) {
      return null;
    }

    const stats = fs.statSync(fullPath);
    return {
      size: stats.size,
      createdAt: stats.birthtime,
    };
  }

  /**
   * Получить полный путь к файлу из URL
   */
  getFullPath(filePath: string): string | null {
    let cleanPath = filePath;

    // Убрать leading slash
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.slice(1);
    }

    // Определить базовую директорию
    if (cleanPath.startsWith('media/') || cleanPath.startsWith('temp/')) {
      return path.join(process.cwd(), 'public', cleanPath);
    } else if (cleanPath.startsWith('files/')) {
      return path.join(process.cwd(), cleanPath);
    } else {
      // Попробовать как относительный путь
      return path.join(process.cwd(), cleanPath);
    }
  }

  /**
   * Получить MIME тип по расширению файла
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.pdf': 'application/pdf',
      '.psd': 'image/vnd.adobe.photoshop',
      '.ai': 'application/postscript',
      '.eps': 'application/eps',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Создать директорию
   */
  private ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Сгенерировать уникальное имя файла
   */
  private generateUniqueFilename(dirPath: string, originalName: string): string {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    let filename = originalName;
    let counter = 1;

    while (fs.existsSync(path.join(dirPath, filename))) {
      filename = `${baseName}_${counter}${ext}`;
      counter++;
    }

    return filename;
  }

  /**
   * Получить поток файла для скачивания
   * @param fileUrl - URL файла (например, "files/product/26/IMG_20250414_200355.jpg")
   */
  getFileStream(fileUrl: string): { stream: NodeJS.ReadableStream; filename: string; mimeType: string } {
    const fullPath = this.getFullPath(fileUrl);
    
    if (!fullPath || !fs.existsSync(fullPath)) {
      throw new NotFoundException(`File not found: ${fileUrl}`);
    }
    
    // Извлекаем имя файла
    const filename = path.basename(fullPath);
    
    // Определяем MIME тип
    const mimeType = this.getMimeType(filename);
    
    // Создаём ReadStream (Node.js stream)
    const stream = fs.createReadStream(fullPath);
    
    return { stream, filename, mimeType };
  }
}
