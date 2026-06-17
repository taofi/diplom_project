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

    const ttl = 7 * 24 * 60 * 60;
    const userId = payload['sub'] as string;
    await this.redisClient.set(`refresh:${userId}`, refreshToken, 'EX', ttl);

    return { accessToken, refreshToken };
  }

  
  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const stored = await this.redisClient.get(`refresh:${userId}`);
    return stored === refreshToken;
  }

  
  async revokeRefreshToken(userId: string): Promise<void> {
    await this.redisClient.del(`refresh:${userId}`);
  }

  
  async blacklistAccessToken(token: string, expiresIn: number): Promise<void> {
    await this.redisClient.set(`blacklist:${token}`, '1', 'EX', expiresIn);
  }

  
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const exists = await this.redisClient.exists(`blacklist:${token}`);
    return exists === 1;
  }

  
  async verifyRefreshToken(token: string): Promise<Record<string, unknown>> {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
    });
  }


  
  async setVerificationCode(email: string, code: string, ttlSeconds: number = 900): Promise<void> {
    await this.redisClient.set(`verification:${email}`, code, 'EX', ttlSeconds);
  }

  
  async getVerificationCode(email: string): Promise<string | null> {
    return this.redisClient.get(`verification:${email}`);
  }

  
  async deleteVerificationCode(email: string): Promise<void> {
    await this.redisClient.del(`verification:${email}`);
  }

  
  async verifyCode(email: string, code: string): Promise<boolean> {
    const storedCode = await this.getVerificationCode(email);
    return storedCode === code;
  }


  
  async setPasswordResetToken(email: string, token: string, ttlSeconds: number = 3600): Promise<void> {
    await this.redisClient.set(`password_reset:${email}`, token, 'EX', ttlSeconds);
  }

  
  async getPasswordResetToken(email: string): Promise<string | null> {
    return this.redisClient.get(`password_reset:${email}`);
  }

  
  async deletePasswordResetToken(email: string): Promise<void> {
    await this.redisClient.del(`password_reset:${email}`);
  }

  
  async verifyPasswordResetToken(email: string, token: string): Promise<boolean> {
    const storedToken = await this.getPasswordResetToken(email);
    return storedToken === token;
  }
}


