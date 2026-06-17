import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

interface ActiveRoom {
  roomId: string;
  socketId: string;
  timestamp: number;
}

@Injectable()
export class ChatStateService {
  private readonly logger = new Logger(ChatStateService.name);
  private readonly ACTIVE_ROOMS_KEY_PREFIX = 'chat:user:active_rooms';
  private readonly USER_SOCKET_KEY_PREFIX = 'chat:user:sockets';
  private readonly ROOM_USERS_KEY_PREFIX = 'chat:room:users';
  private readonly SOCKET_TTL = 86400;
  private readonly ROOM_ACTIVE_TTL = 1800;

  constructor(private readonly redisService: RedisService) {}

  
  private getActiveRoomsKey(userId: number): string {
    return `${this.ACTIVE_ROOMS_KEY_PREFIX}:${userId}`;
  }

  
  private getUserSocketsKey(userId: number): string {
    return `${this.USER_SOCKET_KEY_PREFIX}:${userId}`;
  }

  
  private getRoomUsersKey(roomId: number): string {
    return `${this.ROOM_USERS_KEY_PREFIX}:${roomId}`;
  }

  
  async setUserActiveRoom(userId: number, socketId: string, roomId: number): Promise<void> {
    try {
      const activeRoomsKey = this.getActiveRoomsKey(userId);
      const socketKey = this.getUserSocketsKey(userId);

      await this.redisService.hSet(activeRoomsKey, socketId, String(roomId));

      await this.redisService.hSet(socketKey, socketId, String(userId));
      await this.redisService.expire(socketKey, this.SOCKET_TTL);

      const roomUsersKey = this.getRoomUsersKey(roomId);
      await this.redisService.hSet(roomUsersKey, String(userId), socketId);
      await this.redisService.expire(roomUsersKey, this.SOCKET_TTL);

      this.logger.log(`User ${userId} set active room ${roomId} for socket ${socketId}`);
    } catch (error) {
      this.logger.error(`Error setting active room for user ${userId}:`, error);
      throw error;
    }
  }

  
  async clearUserActiveRoom(userId: number, socketId: string): Promise<void> {
    try {
      const activeRoomsKey = this.getActiveRoomsKey(userId);
      const roomIdStr = await this.redisService.hGet(activeRoomsKey, socketId);

      if (roomIdStr) {
        const roomId = parseInt(roomIdStr, 10);
        const roomUsersKey = this.getRoomUsersKey(roomId);
        await this.redisService.hDel(roomUsersKey, String(userId));
      }

      await this.redisService.hDel(activeRoomsKey, socketId);

      this.logger.log(`Cleared active room for user ${userId}, socket ${socketId}`);
    } catch (error) {
      this.logger.error(`Error clearing active room for user ${userId}:`, error);
      throw error;
    }
  }

  
  async getUserActiveRooms(userId: number): Promise<ActiveRoom[]> {
    try {
      const activeRoomsKey = this.getActiveRoomsKey(userId);
      const rooms = await this.redisService.hGetAll(activeRoomsKey);

      const result: ActiveRoom[] = [];
      for (const [socketId, roomId] of Object.entries(rooms)) {
        result.push({
          roomId,
          socketId,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (error) {
      this.logger.error(`Error getting active rooms for user ${userId}:`, error);
      return [];
    }
  }

  
  async getActiveRoomForSocket(userId: number, socketId: string): Promise<number | null> {
    try {
      const activeRoomsKey = this.getActiveRoomsKey(userId);
      const roomId = await this.redisService.hGet(activeRoomsKey, socketId);
      return roomId ? parseInt(roomId, 10) : null;
    } catch (error) {
      this.logger.error(`Error getting active room for socket ${socketId}:`, error);
      return null;
    }
  }

  
  async isUserInRoom(userId: number, roomId: number): Promise<boolean> {
    try {
      const activeRoomsKey = this.getActiveRoomsKey(userId);
      const rooms = await this.redisService.hGetAll(activeRoomsKey);

      for (const [, roomIdStr] of Object.entries(rooms)) {
        if (parseInt(roomIdStr, 10) === roomId) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Error checking if user ${userId} in room ${roomId}:`, error);
      return false;
    }
  }

  
  async isUserOnline(userId: number): Promise<boolean> {
    try {
      const activeRoomsKey = this.getActiveRoomsKey(userId);
      const rooms = await this.redisService.hKeys(activeRoomsKey);
      return rooms.length > 0;
    } catch (error) {
      this.logger.error(`Error checking if user ${userId} is online:`, error);
      return false;
    }
  }

  
  async getUserSockets(userId: number): Promise<string[]> {
    try {
      const activeRoomsKey = this.getActiveRoomsKey(userId);
      const sockets = await this.redisService.hKeys(activeRoomsKey);
      this.logger.log(`[ChatStateService] getUserSockets: userId=${userId}, found ${sockets.length} sockets:`, sockets);
      return sockets;
    } catch (error) {
      this.logger.error(`[ChatStateService] Error getting user sockets for ${userId}:`, error);
      return [];
    }
  }

  
  async onUserDisconnect(userId: number, socketId: string): Promise<void> {
    try {
      const roomId = await this.getActiveRoomForSocket(userId, socketId);

      await this.clearUserActiveRoom(userId, socketId);

      const socketKey = this.getUserSocketsKey(userId);
      await this.redisService.hDel(socketKey, socketId);

      const remainingSockets = await this.getUserSockets(userId);
      if (remainingSockets.length === 0) {
        await this.redisService.del(this.getActiveRoomsKey(userId));
        await this.redisService.del(socketKey);
      }

      if (roomId) {
        const roomUsersKey = this.getRoomUsersKey(roomId);
        await this.redisService.hDel(roomUsersKey, String(userId));
      }

      this.logger.log(`User ${userId} disconnected, socket ${socketId}, room ${roomId}`);
    } catch (error) {
      this.logger.error(`Error handling disconnect for user ${userId}:`, error);
    }
  }

  
  async getRoomMembers(roomId: number): Promise<number[]> {
    try {
      const roomUsersKey = this.getRoomUsersKey(roomId);
      const members = await this.redisService.hGetAll(roomUsersKey);
      return Object.keys(members).map((userId) => parseInt(userId, 10));
    } catch (error) {
      this.logger.error(`Error getting room members for ${roomId}:`, error);
      return [];
    }
  }

  
  async clearUserData(userId: number): Promise<void> {
    try {
      const sockets = await this.getUserSockets(userId);

      for (const socketId of sockets) {
        await this.onUserDisconnect(userId, socketId);
      }

      this.logger.log(`Cleared all Redis data for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error clearing user data for ${userId}:`, error);
    }
  }


  
  private getRoomActiveUsersKey(roomId: number): string {
    return `chat:room:active:${roomId}`;
  }

  
  async addUserToRoomActiveList(userId: number, roomId: number): Promise<void> {
    try {
      const key = this.getRoomActiveUsersKey(roomId);
      await this.redisService.hSet(key, String(userId), String(Date.now()));
      await this.redisService.expire(key, this.ROOM_ACTIVE_TTL);
      this.logger.log(`Added user ${userId} to active list of room ${roomId}`);
    } catch (error) {
      this.logger.error(`Error adding user ${userId} to room ${roomId} active list:`, error);
    }
  }

  
  async removeUserFromRoomActiveList(userId: number, roomId: number): Promise<boolean> {
    try {
      const key = this.getRoomActiveUsersKey(roomId);
      await this.redisService.hDel(key, String(userId));

      const remainingUsers = await this.redisService.hKeys(key);
      const isEmpty = remainingUsers.length === 0;

      if (isEmpty) {
        this.logger.log(`Room ${roomId} has no more active users`);
      } else {
        this.logger.log(`Removed user ${userId} from room ${roomId}, ${remainingUsers.length} users remaining`);
      }

      return isEmpty;
    } catch (error) {
      this.logger.error(`Error removing user ${userId} from room ${roomId} active list:`, error);
      return false;
    }
  }

  
  async getRoomActiveUsers(roomId: number): Promise<number[]> {
    try {
      const key = this.getRoomActiveUsersKey(roomId);
      const users = await this.redisService.hKeys(key);
      return users.map((userId) => parseInt(userId, 10));
    } catch (error) {
      this.logger.error(`Error getting active users for room ${roomId}:`, error);
      return [];
    }
  }

  
  async isUserInAnyRoom(userId: number): Promise<boolean> {
    try {
      const rooms = await this.getUserActiveRooms(userId);
      return rooms.length > 0;
    } catch (error) {
      this.logger.error(`Error checking if user ${userId} in any room:`, error);
      return false;
    }
  }
}

