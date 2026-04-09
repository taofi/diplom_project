import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import multer from 'multer';
import { diskStorage } from 'multer';
import { Request } from 'express';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const imageOnlyFields = new Set(['preview', 'images']);

function fileFilter(
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void {
  const { fieldname, mimetype } = file;
  const isImage = mimetype.startsWith('image/');

  if (imageOnlyFields.has(fieldname) && !isImage) {
    callback(new Error(`Field "${fieldname}" accepts images only`));
    return;
  }

  if ((fieldname === 'file' || fieldname === 'files') && isImage) {
    callback(new Error(`Field "${fieldname}" accepts non-image files only`));
    return;
  }

  callback(null, true);
}

function createMulterInstance(): multer.Multer {
  return multer({
    storage: diskStorage({
      destination: './tmp',
    }),
    limits: {
      fileSize: MAX_FILE_SIZE_BYTES,
    },
    fileFilter,
  });
}

@Injectable()
export class OfferFilesInterceptor implements NestInterceptor {
  private multerInstance: multer.Multer;

  constructor() {
    this.multerInstance = createMulterInstance();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    const upload = this.multerInstance.fields([
      { name: 'images', maxCount: 10 },
      { name: 'file', maxCount: 1 },
    ]);

    return new Observable((observer) => {
      upload(request, {} as any, (err: any) => {
        if (err) {
          observer.error(err);
          return;
        }
        const files = (request as any).files as { [fieldname: string]: Express.Multer.File[] };

        request.offerFiles = {
          images: files?.['images'] || [],
          file: files?.['file']?.[0],
        };
        next.handle().subscribe({
          next: (value) => {
            observer.next(value);
            observer.complete();
          },
          error: (err) => {
            observer.error(err);
          },
        });
      });
    });
  }
}

@Injectable()
export class OfferCreatorFilesInterceptor implements NestInterceptor {
  private multerInstance: multer.Multer;

  constructor() {
    this.multerInstance = createMulterInstance();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    const upload = this.multerInstance.fields([
      { name: 'images', maxCount: 10 },
      { name: 'files', maxCount: 10 },
    ]);

    return new Observable((observer) => {
      upload(request, {} as any, (err: any) => {
        if (err) {
          observer.error(err);
          return;
        }

        const files = (request as any).files as { [fieldname: string]: Express.Multer.File[] };
        request.offerFiles = {
          images: files?.['images'] || [],
          files: files?.['files'] || [],
        };

        next.handle().subscribe({
          next: (value) => {
            observer.next(value);
            observer.complete();
          },
          error: (handlerErr) => {
            observer.error(handlerErr);
          },
        });
      });
    });
  }
}