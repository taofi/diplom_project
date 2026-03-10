import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import Redis from 'ioredis';

@Injectable()
export class TokenService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  onModuleInit() {
    this.redisClient = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  /**
   * Генерация access + refresh токенов и сохранение refresh в Redis
   */
  async generateTokens(
    payload: Record<string, unknown>,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn') as StringValue,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>(
        'jwt.refreshExpiresIn',
      ) as StringValue,
    });

    // Сохраняем refresh токен в Redis с TTL 7 дней
    const ttl = 7 * 24 * 60 * 60; // 7 дней в секундах
    const userId = payload['sub'] as string;
    await this.redisClient.set(`refresh:${userId}`, refreshToken, 'EX', ttl);

    return { accessToken, refreshToken };
  }

  /**
   * Проверка refresh токена из Redis
   */
  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const stored = await this.redisClient.get(`refresh:${userId}`);
    return stored === refreshToken;
  }

  /**
   * Удаление refresh токена из Redis (logout)
   */
  async revokeRefreshToken(userId: string): Promise<void> {
    await this.redisClient.del(`refresh:${userId}`);
  }

  /**
   * Добавить access токен в blacklist (при logout)
   */
  async blacklistAccessToken(token: string, expiresIn: number): Promise<void> {
    await this.redisClient.set(`blacklist:${token}`, '1', 'EX', expiresIn);
  }

  /**
   * Проверить, находится ли access токен в blacklist
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const exists = await this.redisClient.exists(`blacklist:${token}`);
    return exists === 1;
  }

  /**
   * Верификация refresh токена (без валидации в Redis)
   */
  async verifyRefreshToken(token: string): Promise<Record<string, unknown>> {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
    });
  }
}
