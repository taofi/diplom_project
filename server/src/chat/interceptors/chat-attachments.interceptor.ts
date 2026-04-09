import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import multer from 'multer';
import { diskStorage } from 'multer';
import { Request } from 'express';

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void {
  if (!file.mimetype) {
    callback(new Error('Invalid file type'));
    return;
  }

  callback(null, true);
}

@Injectable()
export class ChatAttachmentsInterceptor implements NestInterceptor {
  private readonly multerInstance: multer.Multer;

  constructor() {
    this.multerInstance = multer({
      storage: diskStorage({
        destination: './tmp',
      }),
      limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
      },
      fileFilter,
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    const upload = this.multerInstance.array('files', MAX_FILES);

    return new Observable((observer) => {
      upload(request, {} as any, (err: any) => {
        if (err) {
          observer.error(err);
          return;
        }

        request.chatFiles = ((request as any).files || []) as Express.Multer.File[];

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
