import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class MulterErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        console.error('[MulterErrorInterceptor] Error:', error);
        
        if (error.message && error.message.includes('Unexpected field')) {
          console.error('[MulterErrorInterceptor] Multer unexpected field error detected');
          console.error('[MulterErrorInterceptor] Full error:', JSON.stringify(error));
        }
        
        return throwError(() => error);
      }),
    );
  }
}

