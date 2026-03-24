'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { socketClient } from '../../lib/socket';
import { chatApi } from '../../lib/api-chat';
import { getUserById } from '../../lib/api-user';
import { useI18n } from '../../context/i18n/I18nContext';
import type { ChatRoom, ChatMessage, ChatOffer, CustomOrder, ChatUser } from '../../types/chat';

interface ChatContextType {
  // Connection state
  isConnected: boolean;
  
  // Chat rooms
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  loadChatRooms: () => Promise<void>;
  selectRoom: (roomId: number) => Promise<void>;
  
  // Messages
  messages: ChatMessage[];
  sendMessage: (content: string, type?: string) => Promise<void>;
  
  // Create new chat (creates in DB with visibility: PENDING)
  createChat: (sellerId: number, productId?: number, userProductId?: number) => Promise<ChatRoom | null>;
  
  // Offers
  offers: ChatOffer[];
  createOffer: (chatRoomId: number, sellerId: number, description: string, price: number, deadline: string) => Promise<void>;
  acceptOffer: (offerId: number) => Promise<CustomOrder>;
  declineOffer: (offerId: number) => Promise<void>;
  
  // Custom orders
  orders: CustomOrder[];
  loadOrders: () => Promise<void>;
  
  // Typing indicator
  setTyping: (isTyping: boolean) => void;
  typingUsers: Map<number, Set<number>>;
  
  // ==================== Tab Support & Online Status ====================
  
  // Active room (for multi-tab support)
  activeRoomId: number | null;
  setActiveRoom: (roomId: number) => void;
  
  // Current user role in current room ('buyer' | 'seller' | null)
  currentUserRole: 'buyer' | 'seller' | null;
  
  // Online users in current room (userId -> isOnline)
  onlineUsers: Map<number, boolean>;
  
  // Mark room as read
  markRoomAsRead: (roomId: number) => Promise<void>;
  
  // Refresh unread counts
  refreshUnreadCounts: () => Promise<void>;
  
  // Update online users
  updateOnlineUsers: (roomId: number, userIds: number[]) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const [isConnected, setIsConnected] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [offers, setOffers] = useState<ChatOffer[]>([]);
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<number, Set<number>>>(new Map());
  // Кэш пользователей для подстановки имени и аватара по sender_id
  const [usersCache, setUsersCache] = useState<Map<number, ChatUser>>(new Map());
  
  // ==================== Tab Support & Online Status ====================
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'buyer' | 'seller' | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Map<number, boolean>>(new Map());
  
  // Refs for values needed in callbacks
  const activeRoomIdRef = useRef<number | null>(null);
  activeRoomIdRef.current = activeRoomId;

  // Refs for preventing duplicate requests
  const isLoadingRoomsRef = useRef(false);
  const isLoadingRoomRef = useRef<number | null>(null);
  // Ref для доступа к usersCache внутри useEffect
  const usersCacheRef = useRef(usersCache);
  usersCacheRef.current = usersCache;

  // Connect to WebSocket on mount
  useEffect(() => {
    const socket = socketClient.connect();
    
    socket?.on('connect', () => {
      setIsConnected(true);
    });
    
    socket?.on('disconnect', () => {
      setIsConnected(false);
    });

    // Set up event listeners
    socketClient.on('newMessage', (data: unknown) => {
      const payload = data as { message: ChatMessage };
      console.log('[ChatContext] newMessage received:', payload.message.chat_room_id, 'activeRoomId:', activeRoomIdRef.current);
      // Подставляем данные отправителя из кэша
      const sender = usersCacheRef.current.get(payload.message.sender_id);
      if (sender) {
        payload.message.sender = sender;
      }
      // Only add message if this is the active room (for multi-tab support)
      if (activeRoomIdRef.current === payload.message.chat_room_id) {
        console.log('[ChatContext] Adding message to state');
        setMessages(prev => [...prev, payload.message]);
      } else {
        console.log('[ChatContext] Message NOT added - room mismatch');
      }
    });

    socketClient.on('userTyping', (data: unknown) => {
      const payload = data as { roomId: number; userId: number; isTyping: boolean };
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(payload.roomId)) {
          newMap.set(payload.roomId, new Set());
        }
        if (payload.isTyping) {
          newMap.get(payload.roomId)!.add(payload.userId);
        } else {
          newMap.get(payload.roomId)!.delete(payload.userId);
        }
        return newMap;
      });
    });

    socketClient.on('offerCreated', (data: unknown) => {
      const payload = data as { offer: ChatOffer };
      setOffers(prev => [...prev, payload.offer]);
    });

    socketClient.on('offerUpdated', (data: unknown) => {
      const payload = data as { offer: ChatOffer };
      setOffers(prev => prev.map(o => o.id === payload.offer.id ? payload.offer : o));
    });

    socketClient.on('chatRoomCreated', (data: unknown) => {
      const payload = data as { room: ChatRoom };
      setRooms(prev => {
        const exists = prev.some(room => room.id === payload.room.id);
        if (exists) return prev;
        return [...prev, payload.room];
      });
    });

    // ==================== Tab Support & Online Status Listeners ====================
    
    // Listen for unread count updates
    socketClient.on('unreadCountUpdate', (data: unknown) => {
      const payload = data as { roomId: number; count: number };
      setRooms(prev => prev.map(room => 
        room.id === payload.roomId 
          ? { ...room, unreadCount: payload.count }
          : room
      ));
      // If this is the active room, also update currentRoom
      if (currentRoom?.id === payload.roomId) {
        setCurrentRoom(prev => prev ? { ...prev, unreadCount: payload.count } : null);
      }
    });

    // Listen for users online in room
    socketClient.on('usersOnline', (data: unknown) => {
      const payload = data as { roomId: number; userIds: number[] };
      // Only update if this is the current room
      if (currentRoom?.id === payload.roomId) {
        const newOnlineUsers = new Map<number, boolean>();
        payload.userIds.forEach(userId => newOnlineUsers.set(userId, true));
        setOnlineUsers(newOnlineUsers);
      }
    });

    // Listen for user online status changes
    socketClient.on('userOnlineStatus', (data: unknown) => {
      const payload = data as { userId: number; isOnline: boolean };
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(payload.userId, payload.isOnline);
        return newMap;
      });
    });

    return () => {
      socketClient.disconnect();
      setIsConnected(false);
    };
  }, []);

  const loadChatRooms = useCallback(async () => {
    // Prevent duplicate requests
    if (isLoadingRoomsRef.current) {
      return;
    }
    isLoadingRoomsRef.current = true;
    
    try {
      const result = await chatApi.getChatRooms(locale);
      setRooms(result.rows);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      isLoadingRoomsRef.current = false;
    }
  }, [locale]);

  const loadUserInfo = useCallback(async (userId: number): Promise<ChatUser | null> => {
    try {
      const user = await getUserById(userId);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar_url || undefined,
      };
    } catch (error) {
      console.error('Error loading user info:', error);
      return null;
    }
  }, []);

  const selectRoom = useCallback(async (roomId: number) => {
    // Prevent duplicate requests for the same room
    if (isLoadingRoomRef.current === roomId) {
      return;
    }
    isLoadingRoomRef.current = roomId;
    
    try {
      const result = await chatApi.getChatRoom(roomId, locale);
      setCurrentRoom(result.chatRoom);
      setMessages(result.messages);
      
      // Установить активную комнату для правильной обработки входящих сообщений
      setActiveRoomId(roomId);
      console.log('[ChatContext] setActiveRoomId called:', roomId);
      // Уведомить сервер об активной комнате (для множественных вкладок)
      socketClient.setActiveRoom(roomId);
      console.log('[ChatContext] socketClient.setActiveRoom called:', roomId);
      
      // Сохраняем участников чата в кэш
      const newUsersCache = new Map(usersCacheRef.current);
      const buyer = result.chatRoom.buyer as ChatUser & { avatar_url?: string } | undefined;
      const seller = result.chatRoom.seller as ChatUser & { avatar_url?: string } | undefined;
      
      if (buyer) {
        newUsersCache.set(buyer.id, {
          id: buyer.id,
          name: buyer.name,
          email: buyer.email,
          avatar: buyer.avatar || buyer.avatar_url,
        });
      }
      if (seller) {
        newUsersCache.set(seller.id, {
          id: seller.id,
          name: seller.name,
          email: seller.email,
          avatar: seller.avatar || seller.avatar_url,
        });
      }
      // Также сохраняем sender из всех сообщений
      result.messages.forEach((msg: ChatMessage) => {
        if (msg.sender) {
          newUsersCache.set(msg.sender.id, msg.sender);
        }
      });
      setUsersCache(newUsersCache);
      
      // Join WebSocket room
      socketClient.joinRoom(roomId);
      
      // Load offers for this room
      const roomOffers = await chatApi.getChatOffers(roomId);
      setOffers(roomOffers);
    } catch (error) {
      console.error('Error selecting room:', error);
    } finally {
      isLoadingRoomRef.current = null;
    }
  }, [locale]);

  const sendMessage = useCallback(async (content: string, type = 'text', attachmentUrl?: string) => {
    try {
      if (currentRoom) {
        // Send to existing room
        socketClient.sendMessage(currentRoom.id, content, type, attachmentUrl);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [currentRoom]);

  const createChat = useCallback(async (sellerId: number, productId?: number, userProductId?: number): Promise<ChatRoom | null> => {
    try {
      // Создаем чат напрямую в БД (с visibility: PENDING)
      const chat = await chatApi.createChat(sellerId, productId, userProductId);
      return chat;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  }, []);

  const createOffer = useCallback(async (
    chatRoomId: number,
    sellerId: number,
    description: string,
    price: number,
    deadline: string
  ) => {
    try {
      const offer = await chatApi.createOffer(chatRoomId, sellerId, description, price, deadline);
      setOffers(prev => [...prev, offer]);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, []);

  const acceptOffer = useCallback(async (offerId: number) => {
    try {
      const order = await chatApi.acceptOffer(offerId);
      setOrders(prev => [...prev, order]);
      return order;
    } catch (error) {
      console.error('Error accepting offer:', error);
      throw error;
    }
  }, []);

  const declineOffer = useCallback(async (offerId: number) => {
    try {
      await chatApi.declineOffer(offerId);
      setOffers(prev => prev.map(o => 
        o.id === offerId ? { ...o, status: 'declined' as const } : o
      ));
    } catch (error) {
      console.error('Error declining offer:', error);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const result = await chatApi.getUserOrders();
      setOrders(result.rows);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }, []);

  const setTyping = useCallback((isTyping: boolean) => {
    if (currentRoom) {
      socketClient.typing(currentRoom.id, isTyping);
    }
  }, [currentRoom]);

  // ==================== Tab Support & Online Status Methods ====================

  const setActiveRoom = useCallback((roomId: number) => {
    setActiveRoomId(roomId);
  }, []);

  const markRoomAsRead = useCallback(async (roomId: number) => {
    try {
      await chatApi.markRoomAsRead(roomId);
      // Update local state
      setRooms(prev => prev.map(room => 
        room.id === roomId 
          ? { ...room, unreadCount: 0 }
          : room
      ));
      if (currentRoom?.id === roomId) {
        setCurrentRoom(prev => prev ? { ...prev, unreadCount: 0 } : null);
      }
      // Reset message read status
      setMessages(prev => prev.map(msg => ({ ...msg, is_read: true })));
    } catch (error) {
      console.error('Error marking room as read:', error);
    }
  }, [currentRoom]);

  const refreshUnreadCounts = useCallback(async () => {
    try {
      const counts = await chatApi.getUnreadCounts();
      // counts is Record<roomId, count>
      setRooms(prev => prev.map(room => {
        const count = counts[room.id] ?? 0;
        return { ...room, unreadCount: count };
      }));
      if (currentRoom) {
        const currentCount = counts[currentRoom.id] ?? 0;
        setCurrentRoom(prev => prev ? { ...prev, unreadCount: currentCount } : null);
      }
    } catch (error) {
      console.error('Error refreshing unread counts:', error);
    }
  }, [currentRoom]);

  const updateOnlineUsers = useCallback((roomId: number, userIds: number[]) => {
    // Only update for current room
    if (activeRoomIdRef.current === roomId) {
      const newOnlineUsers = new Map<number, boolean>();
      userIds.forEach(userId => newOnlineUsers.set(userId, true));
      setOnlineUsers(newOnlineUsers);
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isConnected,
        rooms,
        currentRoom,
        loadChatRooms,
        selectRoom,
        messages,
        sendMessage,
        createChat,
        offers,
        createOffer,
        acceptOffer,
        declineOffer,
        orders,
        loadOrders,
        setTyping,
        typingUsers,
        // ==================== Tab Support & Online Status ====================
        activeRoomId,
        setActiveRoom,
        currentUserRole,
        onlineUsers,
        markRoomAsRead,
        refreshUnreadCounts,
        updateOnlineUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
