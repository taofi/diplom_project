import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import multer from 'multer';
import { diskStorage } from 'multer';
import { Request } from 'express';

@Injectable()
export class OfferFilesInterceptor implements NestInterceptor {
  private multerInstance: multer.Multer;

  constructor() {
     
    this.multerInstance = multer({
      storage: diskStorage({
        destination: './tmp',
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    // Используем fields() для обработки обоих полей в одном middleware
     
    const upload = this.multerInstance.fields([
      { name: 'preview', maxCount: 1 },
      { name: 'files', maxCount: 10 },
    ]);

    // Вызываем multer как middleware и передаем управление дальше
    return new Observable((observer) => {
       
      upload(request, {} as any, (err: any) => {
        if (err) {
          console.error('[OfferFilesInterceptor] Multer error:', err);
          observer.error(err);
          return;
        }

        console.log('[OfferFilesInterceptor] Multer completed successfully');
        console.log('[OfferFilesInterceptor] Request files:', (request as any).files);
        
        // Извлекаем файлы из request
        const files = (request as any).files as { [fieldname: string]: Express.Multer.File[] };
        
        // Добавляем файлы в request для использования в контроллере
        request.offerFiles = {
          preview: files?.['preview']?.[0],
          files: files?.['files'] || [],
        };

        console.log('[OfferFilesInterceptor] offerFiles added to request:', request.offerFiles);

        // Вызываем следующий handler в цепочке
        next.handle().subscribe({
          next: (value) => {
            console.log('[OfferFilesInterceptor] Handler completed:', value);
            observer.next(value);
            observer.complete();
          },
          error: (err) => {
            console.error('[OfferFilesInterceptor] Handler error:', err);
            observer.error(err);
          },
        });
      });
    });
  }
}