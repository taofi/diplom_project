'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { socketClient } from '../../lib/socket';
import { chatApi } from '../../lib/api-chat';
import type { ChatRoom, ChatMessage, TempChat, ChatOffer, CustomOrder } from '../../types/chat';

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
  
  // Temp chat (before first message)
  tempChat: TempChat | null;
  initTempChat: (sellerId: number, productId?: number, userProductId?: number) => Promise<void>;
  clearTempChat: () => void;
  
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
  const [tempChat, setTempChat] = useState<TempChat | null>(null);
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
      if (tempChat) {
        // Send via temp chat
        socketClient.sendMessage(tempChat.id, content, type);
        setTempChat(null);
      } else if (currentRoom) {
        // Send to existing room
        socketClient.sendMessage(currentRoom.id, content, type);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [tempChat, currentRoom]);

  const initTempChat = useCallback(async (sellerId: number, productId?: number, userProductId?: number) => {
    try {
      const temp = await chatApi.initTempChat(sellerId, productId, userProductId);
      setTempChat(temp);
    } catch (error) {
      console.error('Error initializing temp chat:', error);
    }
  }, []);

  const clearTempChat = useCallback(() => {
    if (tempChat) {
      chatApi.deleteTempChat(tempChat.id);
    }
    setTempChat(null);
  }, [tempChat]);

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
        tempChat,
        initTempChat,
        clearTempChat,
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
