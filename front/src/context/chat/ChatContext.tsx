'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { socketClient } from '../../lib/socket';
import { chatApi } from '../../lib/api-chat';
import { getUserById } from '../../lib/api-user';
import { useI18n } from '../../context/i18n/I18nContext';
import type { ChatRoom, ChatMessage, CustomOrder, ChatUser } from '../../types/chat';
import type { Offer, CounterOfferDto } from '../../types/chat/offer.types';
import { OfferStatus } from '../../types/chat/offer.types';

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
  sendMessage: (
    content: string,
    type?: string,
    attachments?: Array<{
      kind: 'image' | 'file';
      url: string;
      originalName: string;
      mimeType: string;
      size: number;
    }>,
  ) => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  hasMoreMessages: boolean;
  isLoadingOlderMessages: boolean;
  
  // Create new chat (creates in DB with visibility: PENDING)
  createChat: (sellerId: number, productId?: number, userProductId?: number) => Promise<ChatRoom | null>;
  
  // Offers
  offers: Offer[];
  createOffer: (chatRoomId: number, sellerId: number, description: string, price: number) => Promise<void>;
  acceptOffer: (offerId: number) => Promise<Offer>;
  declineOffer: (offerId: number) => Promise<void>;
  counterOffer: (offerId: number, newPrice: number) => Promise<void>;
  confirmPrice: (offerId: number) => Promise<void>;
  uploadOfferFiles: (offerId: number, images: File[], file: File | null) => Promise<void>;
  payOrder: (offerId: number, simulateSuccess?: boolean) => Promise<void>;
  getOfferFiles: (offerId: number) => Promise<{ preview_url: string | null; source_files_urls: string[] | null }>;
  
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
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<number, Set<number>>>(new Map());
  // Кэш пользователей для подстановки имени и аватара по sender_id
  const [usersCache, setUsersCache] = useState<Map<number, ChatUser>>(new Map());
  
  // ==================== Pagination for messages ====================
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  
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
        console.log('[ChatContext] Message NOT added - room mismatch, incrementing unread count');
        // Увеличиваем счетчик непрочитанных для комнаты
        setRooms(prev => prev.map(room => 
          room.id === payload.message.chat_room_id
            ? { ...room, unreadCount: (room.unreadCount || 0) + 1 }
            : room
        ));
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

    socketClient.on('offer:created', (data: unknown) => {
      const payload = data as { offer: Offer };
      console.log('[ChatContext] offer:created received:', JSON.stringify(payload));
      console.log('[ChatContext] offer:created - current offers count:', offers.length);
      setOffers(prev => {
        console.log('[ChatContext] offer:created - adding offer, new count:', prev.length + 1);
        return [...prev, payload.offer];
      });
    });

    socketClient.on('offer:statusChanged', (data: unknown) => {
      const payload = data as { offer: Offer };
      console.log('[ChatContext] offer:statusChanged received:', JSON.stringify(payload));
      setOffers(prev => prev.map(o => o.id === payload.offer.id ? payload.offer : o));
    });

    socketClient.on('offer:priceChanged', (data: unknown) => {
      const payload = data as { offer: Offer };
      console.log('[ChatContext] offer:priceChanged received:', JSON.stringify(payload));
      setOffers(prev => prev.map(o => o.id === payload.offer.id ? payload.offer : o));
    });

    socketClient.on('offer:filesUploaded', (data: unknown) => {
      const payload = data as { offer: Offer };
      console.log('[ChatContext] offer:filesUploaded received:', JSON.stringify(payload));
      setOffers(prev => prev.map(o => o.id === payload.offer.id ? payload.offer : o));
    });

    socketClient.on('offer:paid', (data: unknown) => {
      const payload = data as { offer: Offer };
      console.log('[ChatContext] offer:paid received:', JSON.stringify(payload));
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
      // Реверсируем сообщения: сервер отправляет новые first, а нам нужно новые внизу
      setMessages([...result.messages].reverse());
      
      // Устанавливаем информацию о пагинации
      setCurrentPage(1);
      setHasMoreMessages(result.messages.length < result.total);
      
      // Установить активную комнату для правильной обработки входящих сообщений
      setActiveRoomId(roomId);
      console.log('[ChatContext] setActiveRoomId called:', roomId);
      // Уведомить сервер об активной комнате (для множественных вкладок)
      socketClient.setActiveRoom(roomId);
      console.log('[ChatContext] socketClient.setActiveRoom called:', roomId);
      
      // Сбросить счетчик непрочитанных для выбранной комнаты
      setRooms(prev => prev.map(room => 
        room.id === roomId ? { ...room, unreadCount: 0 } : room
      ));
      
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

  const sendMessage = useCallback(
    async (
      content: string,
      type = 'text',
      attachments: Array<{
        kind: 'image' | 'file';
        url: string;
        originalName: string;
        mimeType: string;
        size: number;
      }> = [],
    ) => {
    try {
      if (currentRoom) {
        // Send to existing room
        socketClient.sendMessage(currentRoom.id, content, type, attachments);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  },
    [currentRoom],
  );

  // Загрузка старых сообщений (пагинация)
  const loadOlderMessages = useCallback(async () => {
    if (!currentRoom || isLoadingOlderMessages || !hasMoreMessages) {
      return;
    }
    
    setIsLoadingOlderMessages(true);
    
    try {
      const nextPage = currentPage + 1;
      const result = await chatApi.getMessages(currentRoom.id, nextPage);
      
      // Добавляем старые сообщения в начало (они older, т.е. более старые по времени)
      // Сервер отправляет новые first, поэтому реверсируем перед добавлением
      const olderMessages = [...result.rows].reverse();
      
      // Подставляем данные отправителя из usersCache в старые сообщения
      const olderMessagesWithSender = olderMessages.map(msg => {
        const cachedSender = usersCacheRef.current.get(msg.sender_id);
        if (cachedSender) {
          return { ...msg, sender: cachedSender };
        }
        // Если sender уже есть в сообщении (с сервера), сохраняем его
        return msg;
      });
      
      setMessages(prev => [...olderMessagesWithSender, ...prev]);
      
      // Обновляем информацию о пагинации
      setCurrentPage(nextPage);
      // Проверяем, есть ли еще сообщения для загрузки
      setHasMoreMessages(messages.length + result.rows.length < result.count);
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [currentRoom, currentPage, isLoadingOlderMessages, hasMoreMessages, messages.length]);

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
    price: number
  ) => {
    try {
      const offer = await chatApi.createEditOffer({
        chatRoomId,
        authorId: sellerId,
        description,
        price,
      });
      setOffers(prev => [...prev, offer]);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, []);

  const acceptOffer = useCallback(async (offerId: number): Promise<Offer> => {
    try {
      const offer = await chatApi.acceptEditOffer(offerId);
      setOffers(prev => prev.map(o => o.id === offerId ? offer : o));
      return offer;
    } catch (error) {
      console.error('Error accepting offer:', error);
      throw error;
    }
  }, []);

  const declineOffer = useCallback(async (offerId: number) => {
    try {
      await chatApi.declineOffer(offerId);
      setOffers(prev => prev.map(o => 
        o.id === offerId ? { ...o, status: OfferStatus.REJECTED } : o
      ));
    } catch (error) {
      console.error('Error declining offer:', error);
    }
  }, []);

  const counterOffer = useCallback(async (offerId: number, newPrice: number) => {
    try {
      const dto: CounterOfferDto = { newPrice };
      const offer = await chatApi.counterOffer(offerId, dto);
      setOffers(prev => prev.map(o => 
        o.id === offerId ? offer : o
      ));
    } catch (error) {
      console.error('Error counter-offering:', error);
      throw error;
    }
  }, []);

  const confirmPrice = useCallback(async (offerId: number) => {
    try {
      const offer = await chatApi.confirmPrice(offerId);
      setOffers(prev => prev.map(o => 
        o.id === offerId ? offer : o
      ));
    } catch (error) {
      console.error('Error confirming price:', error);
      throw error;
    }
  }, []);

  const uploadOfferFiles = useCallback(async (
    offerId: number,
    images: File[],
    file: File | null,
  ) => {
    try {
      const offer = await chatApi.uploadOfferFiles(offerId, images, file);
      setOffers(prev => prev.map(o => 
        o.id === offerId ? offer : o
      ));
    } catch (error) {
      console.error('Error uploading offer files:', error);
      throw error;
    }
  }, []);

  const payOrder = useCallback(async (offerId: number, simulateSuccess = false) => {
    try {
      const offer = await chatApi.payOrder(offerId, { simulateSuccess });
      setOffers(prev => prev.map(o => 
        o.id === offerId ? offer : o
      ));
    } catch (error) {
      console.error('Error paying order:', error);
      throw error;
    }
  }, []);

  const getOfferFiles = useCallback(async (offerId: number) => {
    try {
      const files = await chatApi.getOfferFiles(offerId);
      return files;
    } catch (error) {
      console.error('Error getting offer files:', error);
      throw error;
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
        loadOlderMessages,
        hasMoreMessages,
        isLoadingOlderMessages,
        createChat,
        offers,
        createOffer,
        acceptOffer,
        declineOffer,
        counterOffer,
        confirmPrice,
        uploadOfferFiles,
        payOrder,
        getOfferFiles,
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
