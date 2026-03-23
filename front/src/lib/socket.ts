import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = Cookies.get('access_token');

    this.socket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Send events
  emit(event: string, data: unknown) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Listen to events
  on(event: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: unknown) => void) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  // Chat-specific methods
  initChat(sellerId: number, productId?: number) {
    this.emit('initChat', { sellerId, productId });
  }

  joinRoom(roomId: number) {
    this.emit('joinRoom', { roomId });
  }

  leaveRoom(roomId: number, tempChatId?: string) {
    this.emit('leaveRoom', { roomId, tempChatId });
  }

  sendMessage(roomId: number | string, content: string, type = 'text', tempChatId?: string) {
    this.emit('sendMessage', { roomId, content, type, tempChatId });
  }

  typing(roomId: number, isTyping: boolean) {
    this.emit('typing', { roomId, isTyping });
  }
}

// Export singleton instance
export const socketClient = new SocketClient();

// Also export default for convenience
export default socketClient;
