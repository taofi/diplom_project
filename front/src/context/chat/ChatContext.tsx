'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { socketClient } from '../../lib/socket';
import { chatApi } from '../../lib/api-chat';
import { getUserById } from '../../lib/api-user';
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
  const [isConnected, setIsConnected] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [offers, setOffers] = useState<ChatOffer[]>([]);
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<number, Set<number>>>(new Map());

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
    try {
      const result = await chatApi.getChatRooms();
      setRooms(result.rows);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    }
  }, []);

  const loadUserInfo = useCallback(async (userId: number): Promise<ChatUser | null> => {
    try {
      const user = await getUserById(userId);
      return {
        id: user.id,
        username: user.name,
        email: user.email,
        avatar: user.avatar_url || undefined,
      };
    } catch (error) {
      console.error('Error loading user info:', error);
      return null;
    }
  }, []);

  const selectRoom = useCallback(async (roomId: number) => {
    try {
      const result = await chatApi.getChatRoom(roomId);
      setCurrentRoom(result.chatRoom);
      setMessages(result.messages);
      
      // Join WebSocket room
      socketClient.joinRoom(roomId);
      
      // Load offers for this room
      const roomOffers = await chatApi.getChatOffers(roomId);
      setOffers(roomOffers);
    } catch (error) {
      console.error('Error selecting room:', error);
    }
  }, []);

  const sendMessage = useCallback(async (content: string, type = 'text') => {
    try {
      if (currentRoom) {
        // Send to existing room
        socketClient.sendMessage(currentRoom.id, content, type);
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
