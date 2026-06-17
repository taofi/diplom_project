import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    console.error('[GlobalExceptionFilter] ===== START ERROR =====');
    console.error('[GlobalExceptionFilter] Exception type:', typeof exception);
    console.error('[GlobalExceptionFilter] Exception:', exception);
    
    if (exception instanceof Error) {
      console.error('[GlobalExceptionFilter] Error name:', exception.name);
      console.error('[GlobalExceptionFilter] Error message:', exception.message);
      console.error('[GlobalExceptionFilter] Error stack:', exception.stack);
      
      if (exception.message && exception.message.includes('Unexpected field')) {
        console.error('[GlobalExceptionFilter] === MULTER ERROR DETECTED ===');
        console.error('[GlobalExceptionFilter] Field name from error:', exception.message);
      }
    }
    
    console.error('[GlobalExceptionFilter] ===== END ERROR =====');

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      return response.status(status).json({
        message: typeof exceptionResponse === 'object' 
          ? (exceptionResponse as any).message || exception.message
          : exceptionResponse,
        error: 'Bad Request',
        statusCode: status,
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
      error: 'Internal Server Error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}

