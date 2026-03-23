/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Delete,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { ConfirmProductFilesDto } from './dto/upload-temp.dto';
import type { MulterFile } from '../common/services/file.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Загрузить временное медиа (изображение)
   */
  @Post('temp/media')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      storage: diskStorage({
        destination: './tmp',
        filename: (
          _req: Request,
          file: MulterFile,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadTempMedia(
    @CurrentUserId() userId: number,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new Error('No file provided');
    }
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const result = this.uploadsService.uploadTempMedia(userId, {
      originalname: file.originalname,
      buffer: file.buffer,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
      filename: file.filename,
    });

    return result;
  }

  /**
   * Загрузить временный файл продукта
   */
  @Post('temp/file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      storage: diskStorage({
        destination: './tmp',
        filename: (
          _req: Request,
          file: MulterFile,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadTempFile(
    @CurrentUserId() userId: number,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new Error('No file provided');
    }

    const result = this.uploadsService.uploadTempFile(userId, {
      originalname: file.originalname,
      buffer: file.buffer,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
      filename: file.filename,
    });

    return result;
  }

  /**
   * Подтвердить перемещение файлов продукта
   * (переместить из temp в product/{id})
   */
  @Post('temp/confirm')
  confirmProductFiles(
    @CurrentUserId() userId: number,
    @Body() dto: ConfirmProductFilesDto,
  ) {
    const result = this.uploadsService.moveProductFiles(
      userId,
      dto.productId,
      dto.tempFileUrl,
      dto.tempMediaUrls,
    );

    return result;
  }

  /**
   * Очистить временную папку пользователя
   */
  @Delete('temp')
  clearTempFolder(@CurrentUserId() userId: number) {
    this.uploadsService.clearTempFolder(userId);
    return { success: true };
  }

  /**
   * Загрузить аватар пользователя
   * Сохраняет в public/user/{userId}/avatar.{ext}
   */
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './tmp',
        filename: (
          _req: Request,
          file: MulterFile,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadAvatar(
    @CurrentUserId() userId: number,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new Error('No file provided');
    }

    const result = this.uploadsService.uploadAvatar(userId, {
      originalname: file.originalname,
      buffer: file.buffer,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
      filename: file.filename,
    });

    return result;
  }
}
