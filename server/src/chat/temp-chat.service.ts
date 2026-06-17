import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { TempChat } from './interfaces/chat.types';

@Injectable()
export class TempChatService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private readonly TTL = 24 * 60 * 60;
  private readonly PREFIX = 'chat:temp:';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.redisClient = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  
  async createTempChat(
    buyerId: number,
    sellerId: number,
    productId?: number,
    userProductId?: number,
  ): Promise<TempChat> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const tempChat: TempChat = {
      id,
      buyerId,
      sellerId,
      productId: productId || null,
      userProductId: userProductId || null,
      createdAt: now,
      updatedAt: now,
    };

    await this.redisClient.set(
      this.PREFIX + id,
      JSON.stringify(tempChat),
      'EX',
      this.TTL,
    );

    return tempChat;
  }

  
  async getTempChat(id: string): Promise<TempChat | null> {
    const data = await this.redisClient.get(this.PREFIX + id);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as TempChat;
  }

  
  async deleteTempChat(id: string): Promise<void> {
    await this.redisClient.del(this.PREFIX + id);
  }

  
  async extendTempChat(id: string): Promise<boolean> {
    return (await this.redisClient.expire(this.PREFIX + id, this.TTL)) === 1;
  }

  
  private generateId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}


