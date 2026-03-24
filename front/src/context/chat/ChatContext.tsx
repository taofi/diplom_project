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
      // Подставляем данные отправителя из кэша
      const sender = usersCacheRef.current.get(payload.message.sender_id);
      if (sender) {
        payload.message.sender = sender;
      }
      setMessages(prev => [...prev, payload.message]);
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
