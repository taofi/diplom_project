import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {
  private readonly logger = new Logger(RedisModule.name);

  constructor() {
    this.logger.log('RedisModule initialized (global)');
  }
}

