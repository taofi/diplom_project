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
      console.log('[SocketClient] WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('[SocketClient] WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketClient] WebSocket connection error:', error);
    });

    // Логирование всех входящих событий для отладки offer событий
    this.socket.onAny((event, ...args) => {
      if (event.startsWith('offer:')) {
        console.log(`[SocketClient] Received offer event: ${event}`, args);
      }
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
  initChat(sellerId: number, productId?: number, userProductId?: number) {
    this.emit('initChat', { sellerId, productId, userProductId });
  }

  joinRoom(roomId: number) {
    this.emit('joinRoom', { roomId });
  }

  leaveRoom(roomId: number) {
    this.emit('leaveRoom', { roomId });
  }

  sendMessage(roomId: number, content: string, type = 'text', attachmentUrl?: string) {
    this.emit('sendMessage', { roomId, content, type, attachmentUrl });
  }

  typing(roomId: number, isTyping: boolean) {
    this.emit('typing', { roomId, isTyping });
  }

  // ==================== Tab Support ====================

  /**
   * Get unique ID for the current browser tab
   * Uses sessionStorage to persist across page reloads
   */
  getTabId(): string {
    let tabId = sessionStorage.getItem('chat_tab_id');
    if (!tabId) {
      tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('chat_tab_id', tabId);
    }
    return tabId;
  }

  /**
   * Set active room for the current tab
   * Called when user opens a chat
   */
  setActiveRoom(roomId: number) {
    this.emit('setActiveRoom', { 
      roomId,
      tabId: this.getTabId() // pass tab ID
    });
  }

  /**
   * Clear active room (tab closed or user on chat list page)
   */
  clearActiveRoom() {
    this.emit('clearActiveRoom', { 
      tabId: this.getTabId() 
    });
  }

  // ==================== Event Listeners ====================

  /**
   * Subscribe to unread count updates
   * Event: unreadCountUpdate
   */
  onUnreadUpdate(callback: (data: { roomId: number; count: number }) => void) {
    this.on('unreadCountUpdate', callback as (data: unknown) => void);
  }

  /**
   * Subscribe to online users in room changes
   * Event: usersOnline
   */
  onUsersOnline(callback: (data: { roomId: number; userIds: number[] }) => void) {
    this.on('usersOnline', callback as (data: unknown) => void);
  }

  /**
   * Subscribe to user online status changes
   * Event: userOnlineStatus
   */
  onUserOnlineStatus(callback: (data: { userId: number; isOnline: boolean }) => void) {
    this.on('userOnlineStatus', callback as (data: unknown) => void);
  }
}

// Export singleton instance
export const socketClient = new SocketClient();

// Also export default for convenience
export default socketClient;
