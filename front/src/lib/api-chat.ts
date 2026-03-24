import api from '../lib/api';
import type { ChatRoom, ChatMessage, ChatOffer, CustomOrder } from '../types/chat';

// Re-export types for convenience
export type { ChatRoom, ChatMessage, ChatOffer, CustomOrder } from '../types/chat';

// API endpoints
const CHAT_API = '/chat';

export const chatApi = {
  // Chat rooms - create directly in DB with visibility: PENDING
  createChat: async (sellerId: number, productId?: number, userProductId?: number): Promise<ChatRoom> => {
    const response = await api.post(`${CHAT_API}/rooms`, {
      sellerId,
      productId,
      userProductId,
    });
    return response.data;
  },

  // Chat rooms - get visible chats only
  getChatRooms: async (locale?: string, page = 1, limit = 20): Promise<{ rows: ChatRoom[]; count: number }> => {
    const response = await api.get(`${CHAT_API}/rooms`, { 
      params: { page, limit },
      headers: locale ? { 'accept-language': locale } : {}
    });
    return response.data;
  },

  getChatRoom: async (id: number, locale?: string, page = 1, limit = 50): Promise<{ chatRoom: ChatRoom; messages: ChatMessage[]; total: number }> => {
    const response = await api.get(`${CHAT_API}/rooms/${id}`, { 
      params: { page, limit },
      headers: locale ? { 'accept-language': locale } : {}
    });
    return response.data;
  },

  // Messages
  getMessages: async (chatRoomId: number, page = 1, limit = 50): Promise<{ rows: ChatMessage[]; count: number }> => {
    const response = await api.get(`${CHAT_API}/rooms/${chatRoomId}/messages`, { params: { page, limit } });
    return response.data;
  },

  sendMessage: async (chatRoomId: number, content: string, type = 'text', mediaUrl?: string): Promise<ChatMessage> => {
    const response = await api.post(`${CHAT_API}/messages`, {
      chatRoomId,
      content,
      type,
      mediaUrl,
    });
    return response.data;
  },

  // Offers
  createOffer: async (
    chatRoomId: number,
    sellerId: number,
    description: string,
    price: number,
    deadline: string,
  ): Promise<ChatOffer> => {
    const response = await api.post(`${CHAT_API}/offers`, {
      chatRoomId,
      sellerId,
      description,
      price,
      deadline,
    });
    return response.data;
  },

  acceptOffer: async (offerId: number): Promise<CustomOrder> => {
    const response = await api.post(`${CHAT_API}/offers/${offerId}/accept`);
    return response.data;
  },

  declineOffer: async (offerId: number): Promise<ChatOffer> => {
    const response = await api.post(`${CHAT_API}/offers/${offerId}/decline`);
    return response.data;
  },

  getChatOffers: async (chatRoomId: number): Promise<ChatOffer[]> => {
    const response = await api.get(`${CHAT_API}/rooms/${chatRoomId}/offers`);
    return response.data;
  },

  // Custom orders
  getUserOrders: async (page = 1, limit = 20): Promise<{ rows: CustomOrder[]; count: number }> => {
    const response = await api.get(`${CHAT_API}/orders`, { params: { page, limit } });
    return response.data;
  },

  getOrder: async (id: number): Promise<CustomOrder> => {
    const response = await api.get(`${CHAT_API}/orders/${id}`);
    return response.data;
  },

  addRevision: async (orderId: number, fileUrl: string, comment?: string): Promise<void> => {
    await api.post(`${CHAT_API}/orders/${orderId}/revision`, {
      fileUrl,
      comment,
    });
  },

  approveOrder: async (orderId: number): Promise<CustomOrder> => {
    const response = await api.post(`${CHAT_API}/orders/${orderId}/approve`);
    return response.data;
  },

  requestRevision: async (orderId: number): Promise<CustomOrder> => {
    const response = await api.post(`${CHAT_API}/orders/${orderId}/revision-request`);
    return response.data;
  },

  // Unread messages
  getUnreadCounts: async (): Promise<Record<number, number>> => {
    const response = await api.get(`${CHAT_API}/rooms/unread`);
    return response.data;
  },

  markRoomAsRead: async (roomId: number): Promise<void> => {
    await api.post(`${CHAT_API}/rooms/${roomId}/read`);
  },
};
