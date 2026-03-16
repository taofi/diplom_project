import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export enum MediaFolder {
  PRODUCT = 'product',
  BLOG = 'blog',
}

export interface FileUploadResult {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface FileDeleteResult {
  success: boolean;
  deletedPath?: string;
}

/**
 * Интерфейс для загруженного файла из Multer
 */
export interface MulterFile {
  originalname: string;
  buffer: Buffer;
  size: number;
  mimetype: string;
}

@Injectable()
export class FileService {
  private readonly basePath = 'public/media';

  /**
   * Сохранить файл
   * @param file - Загруженный файл
   * @param folder - Папка (product, blog)
   * @param entityId - ID сущности
   */
  saveFile(
    file: MulterFile,
    folder: MediaFolder,
    entityId: number,
  ): FileUploadResult {
    // Создать директорию если не существует
    const targetDir = path.join(this.basePath, folder, entityId.toString());
    this.ensureDirectory(targetDir);

    // Генерировать уникальное имя файла
    const filename = this.generateUniqueFilename(targetDir, file.originalname);

    // Полный путь к файлу
    const filePath = path.join(targetDir, filename);

    // Сохранить файл
    fs.writeFileSync(filePath, file.buffer);

    // Вернуть результат
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
   * Удалить файл
   */
  deleteFile(filePath: string): FileDeleteResult {
    // Убрать public/ из пути если есть
    const cleanPath = filePath.startsWith('public/')
      ? filePath.slice(7)
      : filePath;

    const fullPath = path.join(process.cwd(), cleanPath);

    if (!fs.existsSync(fullPath)) {
      return { success: false };
    }

    fs.unlinkSync(fullPath);
    return { success: true, deletedPath: fullPath };
  }

  /**
   * Удалить все файлы в папке сущности
   */
  deleteFolderFiles(folder: MediaFolder, entityId: number): void {
    const targetDir = path.join(this.basePath, folder, entityId.toString());

    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
  }

  /**
   * Проверить существование файла
   */
  fileExists(filePath: string): boolean {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    return fs.existsSync(fullPath);
  }

  /**
   * Получить информацию о файле
   */
  getFileInfo(filePath: string): { size: number; createdAt: Date } | null {
    const fullPath = path.join(process.cwd(), 'public', filePath);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const stats = fs.statSync(fullPath);
    return {
      size: stats.size,
      createdAt: stats.birthtime,
    };
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
   * Если файл уже существует, добавить суффикс
   */
  private generateUniqueFilename(
    dirPath: string,
    originalName: string,
  ): string {
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
}
