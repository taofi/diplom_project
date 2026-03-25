import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

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
      logger: loggerInstance, // Используем Winston сразу
    });

    app.enableCors({
      origin: ['http://localhost:4000', 'http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    });

    // Применяем глобальный фильтр исключений
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.listen(process.env.PORT ?? 3000);
  } catch (err) {
    // Если сервер упал при старте, пишем ошибку ПРЯМО ТУТ
    loggerInstance.error('Остановка сервера из-за критической ошибки', err);
    process.exit(1);
  }
}

bootstrap();