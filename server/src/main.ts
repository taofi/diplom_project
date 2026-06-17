import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { Request, Response, NextFunction } from 'express';

function rawBodyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.originalUrl === '/checkout/webhook' || req.originalUrl === '/payments/webhook') {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      (req as any).rawBody = Buffer.concat(chunks);
      next();
    });
  } else {
    next();
  }
}

async function bootstrap() {
  const loggerInstance = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.colorize(),
          winston.format.printf((info) => {
            const timestamp = (info as { timestamp?: string }).timestamp || '';
            const level = (info as { level?: string }).level || '';
            const message = (info as { message?: string }).message || '';
            return `[${timestamp}] ${level}: ${message}`;
          }),
        ),
      }),
      new winston.transports.DailyRotateFile({
        dirname: 'logs',
        filename: 'server-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  try {
    const app = await NestFactory.create(AppModule, {
      logger: loggerInstance,
      rawBody: true,
    });

    app.use(rawBodyMiddleware);

    app.enableCors({
      origin: ['http:
      credentials: true,
    });

    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.listen(process.env.PORT ?? 3000);
  } catch (err) {
    loggerInstance.error('Остановка сервера из-за критической ошибки', err);
    process.exit(1);
  }
}

void bootstrap();

