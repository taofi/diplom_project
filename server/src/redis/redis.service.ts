import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('redis.host') || 'localhost';
    const port = this.configService.get<number>('redis.port') || 6379;

    this.client = new Redis({
      host,
      port,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log(`Connected to Redis at ${host}:${port}`);
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error:', err.message);
    });
  }

  
  getClient(): Redis {
    return this.client;
  }

  
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  
  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  
  async hSet(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  
  async hGet(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  
  async hGetAll(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  
  async hDel(key: string, ...fields: string[]): Promise<number> {
    return this.client.hdel(key, ...fields);
  }

  
  async hKeys(key: string): Promise<string[]> {
    return this.client.hkeys(key);
  }

  
  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  
  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  
  async lPush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values);
  }

  
  async rPush(key: string, ...values: string[]): Promise<number> {
    return this.client.rpush(key, ...values);
  }

  
  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  
  async lLen(key: string): Promise<number> {
    return this.client.llen(key);
  }

  
  async publish(channel: string, message: string): Promise<number> {
    return this.client.publish(channel, message);
  }

  
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    const subscriber = this.client.duplicate();
    await subscriber.subscribe(channel);
    subscriber.on('message', (_, message) => {
      callback(message);
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
    this.logger.log('Redis connection closed');
  }
}

