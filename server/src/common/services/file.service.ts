import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  FileUploadResult,
  FileDeleteResult,
  MulterFile,
  FileInfo,
  MediaFolder,
  FileFolder,
} from '../../types/base';

export { MediaFolder, FileFolder };
export type { FileUploadResult, FileDeleteResult, MulterFile, FileInfo };


@Injectable()
export class FileService {
  private readonly publicMediaBasePath = 'public/media';
  private readonly filesBasePath = 'files';

  
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

  
  saveTempMedia(file: MulterFile, userId: number): FileUploadResult {
    if (!userId) {
      throw new Error('User ID is required for saving temp media');
    }
    const targetDir = path.join(this.publicMediaBasePath, MediaFolder.TEMP, userId.toString());
    this.ensureDirectory(targetDir);

    const filename = this.generateUniqueFilename(targetDir, file.originalname);
    const filePath = path.join(targetDir, filename);

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

  
  saveUserAvatar(file: MulterFile, userId: number): FileUploadResult {
    const targetDir = path.join('public', 'user', userId.toString());
    this.ensureDirectory(targetDir);

    const ext = path.extname(file.originalname) || '.png';
    const filename = `avatar${ext}`;
    const filePath = path.join(targetDir, filename);

    const existingFiles = fs.readdirSync(targetDir).filter(f => f.startsWith('avatar'));
    for (const existingFile of existingFiles) {
      if (existingFile !== filename) {
        fs.unlinkSync(path.join(targetDir, existingFile));
      }
    }

    const fileData = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
    if (!fileData) {
      throw new Error('No file data available: both buffer and path are undefined');
    }
    fs.writeFileSync(filePath, fileData);

    return {
      filename,
      originalName: file.originalname,
      path: filePath,
      url: `/user/${userId}/${filename}`,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  
  moveFile(
    fromPath: string,
    toDir: string,
    newFilename?: string,
  ): FileUploadResult | null {
    let fullFromPath = fromPath;



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

    this.ensureDirectory(toDir);

    const originalName = path.basename(fullFromPath);
    const filename = newFilename || originalName;
    const toPath = path.join(toDir, filename);

    fs.renameSync(fullFromPath, toPath);
    
    if (fs.existsSync(fullFromPath)) {
      fs.unlinkSync(fullFromPath);
    }

    const normalizedToDir = toDir.replace(/\\/g, '/');
    let url: string;
    

    
    if (normalizedToDir.includes('public/media') || normalizedToDir.includes('media/product')) {
      const productMatch = normalizedToDir.match(/media\/product\/(\d+)/);
      if (productMatch) {
        url = `media/product/${productMatch[1]}/${filename}`;

      } else {
        const relativePath = toDir.replace(path.join(process.cwd(), 'public'), '');
        url = `media${relativePath}/${filename}`.replace(/\\/g, '/').replace(/^\
      }
    } else if (normalizedToDir.includes('files')) {
      const fileProductMatch = normalizedToDir.match(/files\/product\/(\d+)/);
      if (fileProductMatch) {
        url = `files/product/${fileProductMatch[1]}/${filename}`;

      } else {
        const relativePath = toDir.replace(process.cwd(), '');
        url = `${relativePath}/${filename}`.replace(/\\/g, '/').replace(/^\
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

  
  deleteFile(filePath: string): FileDeleteResult {
    const fullPath = this.getFullPath(filePath);

    if (!fullPath || !fs.existsSync(fullPath)) {
      return { success: false };
    }

    fs.unlinkSync(fullPath);
    return { success: true, deletedPath: fullPath };
  }

  
  deleteMediaFolderFiles(folder: MediaFolder, entityId: number): void {
    const targetDir = path.join(this.publicMediaBasePath, folder, entityId.toString());

    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
  }

  
  deleteFileFolderFiles(folder: FileFolder, entityId: number): void {
    const targetDir = path.join(this.filesBasePath, folder, entityId.toString());

    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
  }

  
  deleteTempFolder(userId: number): void {
    const tempMediaDir = path.join(
      this.publicMediaBasePath,
      MediaFolder.TEMP,
      userId.toString(),
    );
    if (fs.existsSync(tempMediaDir)) {
      fs.rmSync(tempMediaDir, { recursive: true, force: true });
    }

    const tempFilesDir = path.join(
      this.filesBasePath,
      FileFolder.TEMP,
      userId.toString(),
    );
    if (fs.existsSync(tempFilesDir)) {
      fs.rmSync(tempFilesDir, { recursive: true, force: true });
    }
  }

  
  fileExists(filePath: string): boolean {
    const fullPath = this.getFullPath(filePath);
    return fullPath ? fs.existsSync(fullPath) : false;
  }

  
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

  
  getFullPath(filePath: string): string | null {
    let cleanPath = filePath;

    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.slice(1);
    }

    if (cleanPath.startsWith('media/') || cleanPath.startsWith('temp/')) {
      const result = path.join(process.cwd(), 'public', cleanPath);
      return result.split(path.sep).join('/');
    } else if (cleanPath.startsWith('files/')) {
      const result = path.join(process.cwd(), cleanPath);
      return result.split(path.sep).join('/');
    } else {
      const result = path.join(process.cwd(), cleanPath);
      return result.split(path.sep).join('/');
    }
  }

  
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

  
  private ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  
  private generateUniqueFilename(dirPath: string, originalName: string): string {
    const ext = path.extname(originalName);
    const uuid = crypto.randomUUID();
    let filename = `${uuid}${ext}`;
    let counter = 1;

    while (fs.existsSync(path.join(dirPath, filename))) {
      filename = `${uuid}_${counter}${ext}`;
      counter++;
    }

    return filename;
  }

  
  getFileStream(fileUrl: string): { stream: NodeJS.ReadableStream; filename: string; mimeType: string } {
    const fullPath = this.getFullPath(fileUrl);
    
    if (!fullPath || !fs.existsSync(fullPath)) {
      throw new NotFoundException(`File not found: ${fileUrl}`);
    }
    
    const filename = path.basename(fullPath);
    
    const mimeType = this.getMimeType(filename);
    
    const stream = fs.createReadStream(fullPath);
    
    return { stream, filename, mimeType };
  }


  
  moveTempMediaToOffer(tempUrls: string[], offerId: number): FileUploadResult[] {
    const targetDir = path.join(
      this.publicMediaBasePath,
      MediaFolder.OFFERS,
      offerId.toString(),
    );

    const results: FileUploadResult[] = [];
    for (const tempUrl of tempUrls) {
      const result = this.moveFile(tempUrl, targetDir);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  
  moveTempFileToOffer(tempUrl: string, offerId: number): FileUploadResult | null {
    const targetDir = path.join(
      this.filesBasePath,
      FileFolder.OFFERS,
      offerId.toString(),
    );

    return this.moveFile(tempUrl, targetDir);
  }

  
  saveOfferPreview(file: MulterFile, offerId: number): FileUploadResult {
    return this.saveMediaFile(file, MediaFolder.OFFERS, offerId);
  }

  
  saveOfferSourceFile(file: MulterFile, offerId: number): FileUploadResult {
    return this.saveProductFile(file, FileFolder.OFFERS, offerId);
  }

  
  saveCreatorAttachmentFile(file: MulterFile, offerId: number): FileUploadResult {
    return this.saveMediaFile(file, MediaFolder.OFFERS, offerId);
  }

  
  deleteOfferMediaFiles(offerId: number): void {
    this.deleteMediaFolderFiles(MediaFolder.OFFERS, offerId);
  }

  
  deleteOfferFiles(offerId: number): void {
    this.deleteFileFolderFiles(FileFolder.OFFERS, offerId);
  }
}


