import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { ChatRoomRepository } from '../repositories/chat-room.repository';

const ROOM_MEMBERS_CACHE_TTL = 1800;

@Injectable()
export class ChatCacheService {
  private readonly logger = new Logger(ChatCacheService.name);
  private readonly ROOM_MEMBERS_KEY_PREFIX = 'chat:room:members';

  constructor(
    private readonly redisService: RedisService,
    private readonly chatRoomRepository: ChatRoomRepository,
  ) {}

  
  private getRoomMembersKey(roomId: number): string {
    return `${this.ROOM_MEMBERS_KEY_PREFIX}:${roomId}`;
  }

  
  async getChatRoomMembers(roomId: number): Promise<number[]> {
    const cacheKey = this.getRoomMembersKey(roomId);

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for room ${roomId} members: ${cached}`);
        const members = JSON.parse(cached) as number[];
        return members;
      }

      this.logger.log(`Cache miss for room ${roomId} members, fetching from DB`);
      const chatRoom = await this.chatRoomRepository.findById(roomId);
      
      if (!chatRoom) {
        this.logger.warn(`Chat room ${roomId} not found`);
        return [];
      }

      const members = [chatRoom.buyer_id, chatRoom.seller_id];
      this.logger.log(`Found members for room ${roomId}: ${members.join(', ')}`);

      await this.redisService.set(cacheKey, JSON.stringify(members), ROOM_MEMBERS_CACHE_TTL);

      return members;
    } catch (error) {
      this.logger.error(`Error getting chat room members for ${roomId}:`, error);
      try {
        const chatRoom = await this.chatRoomRepository.findById(roomId);
        if (chatRoom) {
          return [chatRoom.buyer_id, chatRoom.seller_id];
        }
      } catch (dbError) {
        this.logger.error(`Fallback DB query also failed:`, dbError);
      }
      return [];
    }
  }

  
  async cacheChatRoomMembers(roomId: number, userIds: number[]): Promise<void> {
    const cacheKey = this.getRoomMembersKey(roomId);
    try {
      await this.redisService.set(cacheKey, JSON.stringify(userIds), ROOM_MEMBERS_CACHE_TTL);
      this.logger.log(`Cached members for room ${roomId}: ${userIds.join(', ')}`);
    } catch (error) {
      this.logger.error(`Error caching room members for ${roomId}:`, error);
    }
  }

  
  async invalidateChatRoomCache(roomId: number): Promise<void> {
    const cacheKey = this.getRoomMembersKey(roomId);
    try {
      await this.redisService.del(cacheKey);
      this.logger.log(`Invalidated cache for room ${roomId}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache for room ${roomId}:`, error);
    }
  }

  
  async refreshCacheTTL(roomId: number): Promise<void> {
    const cacheKey = this.getRoomMembersKey(roomId);
    try {
      const exists = await this.redisService.exists(cacheKey);
      if (exists) {
        await this.redisService.expire(cacheKey, ROOM_MEMBERS_CACHE_TTL);
        this.logger.log(`Refreshed TTL for room ${roomId} cache`);
      }
    } catch (error) {
      this.logger.error(`Error refreshing TTL for room ${roomId}:`, error);
    }
  }
}


