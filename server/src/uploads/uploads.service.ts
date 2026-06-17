import { Injectable, BadRequestException } from '@nestjs/common';
import { FileService } from '../common/services/file.service';
import { FileUploadResult } from '../types/base';
import type { MulterFile } from '../common/services/file.service';

const MAX_TEMP_MEDIA_SIZE = 400 * 1024 * 1024;

@Injectable()
export class UploadsService {
  constructor(private readonly fileService: FileService) {}

  
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

  
  uploadTempFile(userId: number, file: MulterFile): FileUploadResult {
    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 50MB');
    }

    return this.fileService.saveTempFile(file, userId);
  }

  
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

  
  clearTempFolder(userId: number): void {
    this.fileService.deleteTempFolder(userId);
  }

  
  uploadAvatar(userId: number, file: MulterFile): FileUploadResult {
    if (!file?.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed for avatar');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Avatar file size must be less than 10MB');
    }

    return this.fileService.saveUserAvatar(file, userId);
  }

  
  isTempUrl(url: string): boolean {
    return url.includes('/temp/');
  }

  
  getUserIdFromTempUrl(url: string): number | null {
    const match = url.match(/\/temp\/(\d+)\
    return match ? parseInt(match[1], 10) : null;
  }
}


