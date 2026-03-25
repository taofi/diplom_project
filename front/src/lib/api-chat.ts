import api from '../lib/api';
import type { ChatRoom, ChatMessage, CustomOrder } from '../types/chat';
import type { Offer, OfferFiles, CreateOfferDto, CounterOfferDto, PayOrderDto } from '../types/chat/offer.types';

// Re-export types for convenience
export type { ChatRoom, ChatMessage, CustomOrder } from '../types/chat';
export type { Offer, OfferFiles, CreateOfferDto, CounterOfferDto, PayOrderDto } from '../types/chat/offer.types';

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
  getChatRooms: async (locale?: string): Promise<{ rows: ChatRoom[]; count: number }> => {
    const response = await api.get(`${CHAT_API}/rooms`, { 
      headers: locale ? { 'accept-language': locale } : {}
    });
    return response.data;
  },

  getChatRoom: async (id: number, locale?: string): Promise<{ chatRoom: ChatRoom; messages: ChatMessage[]; total: number }> => {
    const response = await api.get(`${CHAT_API}/rooms/${id}`, { 
      headers: locale ? { 'accept-language': locale } : {}
    });
    return response.data;
  },

  // Messages
  getMessages: async (chatRoomId: number, page = 1, limit = 50): Promise<{ rows: ChatMessage[]; count: number }> => {
    const response = await api.get(`${CHAT_API}/rooms/${chatRoomId}/messages`, {
      params: { page, limit },
    });
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

  // Custom orders
  getUserOrders: async (): Promise<{ rows: CustomOrder[]; count: number }> => {
    const response = await api.get(`${CHAT_API}/orders`);
    return response.data;
  },

  // Получить все заказы пользователя (включая завершённые)
  getAllUserOrders: async (): Promise<{ rows: CustomOrder[]; count: number }> => {
    const response = await api.get(`${CHAT_API}/orders/all`);
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

  // ==================== Offer (заказы на редактирование) ====================

  /**
   * Создать заказ (Заказчик)
   */
  createEditOffer: async (dto: CreateOfferDto): Promise<Offer> => {
    const response = await api.post(`${CHAT_API}/offers`, dto);
    return response.data;
  },

  /**
   * Получить заказ по ID
   */
  getOffer: async (offerId: number): Promise<Offer> => {
    const response = await api.get(`${CHAT_API}/offers/${offerId}`);
    return response.data;
  },

  /**
   * Принять заказ (Автор)
   */
  acceptEditOffer: async (offerId: number): Promise<Offer> => {
    const response = await api.post(`${CHAT_API}/offers/${offerId}/accept`);
    return response.data;
  },

  /**
   * Отклонить заказ (Любой участник)
   */
  rejectOffer: async (offerId: number): Promise<Offer> => {
    const response = await api.post(`${CHAT_API}/offers/${offerId}/reject`);
    return response.data;
  },

  /**
   * Изменить цену (Автор)
   */
  counterOffer: async (offerId: number, dto: CounterOfferDto): Promise<Offer> => {
    const response = await api.post(`${CHAT_API}/offers/${offerId}/counter`, dto);
    return response.data;
  },

  /**
   * Изменить цену (Заказчик)
   */
  counterOfferFromCreator: async (offerId: number, dto: CounterOfferDto): Promise<Offer> => {
    const response = await api.post(`${CHAT_API}/offers/${offerId}/counter-from-creator`, dto);
    return response.data;
  },

  /**
   * Подтвердить цену (Заказчик)
   */
  confirmPrice: async (offerId: number): Promise<Offer> => {
    const response = await api.post(`${CHAT_API}/offers/${offerId}/confirm-price`);
    return response.data;
  },

  /**
   * Загрузить файлы (Автор)
   */
  uploadOfferFiles: async (offerId: number, preview: File | null, files: File[]): Promise<Offer> => {
    const formData = new FormData();
    
    if (preview) {
      formData.append('preview', preview);
    }
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post(`${CHAT_API}/offers/${offerId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Оплатить заказ (Заказчик)
   */
  payOrder: async (offerId: number, dto?: PayOrderDto): Promise<Offer> => {
    const response = await api.post(`${CHAT_API}/offers/${offerId}/pay`, dto || {});
    return response.data;
  },

  /**
   * Получить файлы заказа (с проверкой доступа)
   */
  getOfferFiles: async (offerId: number): Promise<OfferFiles> => {
    const response = await api.get(`${CHAT_API}/offers/${offerId}/files`);
    return response.data;
  },

  /**
   * Получить все заказы в чате
   */
  getRoomOffers: async (roomId: number): Promise<Offer[]> => {
    const response = await api.get(`${CHAT_API}/offers/rooms/${roomId}/offers`);
    return response.data;
  },

  // Алиасы для обратной совместимости с ChatContext
  getChatOffers: async (chatRoomId: number): Promise<Offer[]> => {
    const response = await api.get(`${CHAT_API}/rooms/${chatRoomId}/offers`);
    return response.data;
  },

  createOffer: async (
    chatRoomId: number,
    sellerId: number,
    description: string,
    price: number,
    deadline: string,
  ): Promise<Offer> => {
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

  declineOffer: async (offerId: number): Promise<Offer> => {
    const response = await api.post(`${CHAT_API}/offers/${offerId}/decline`);
    return response.data;
  },

  /**
   * Скачать исходный файл заказа
   */
  downloadSourceFile: async (offerId: number, fileIndex: number): Promise<Blob> => {
    const response = await api.get(`${CHAT_API}/offers/${offerId}/download/${fileIndex}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Скачать файл (альтернативный способ через window.open)
   */
  downloadSourceFileUrl: (offerId: number, fileIndex: number): string => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return `${API_URL}${CHAT_API}/offers/${offerId}/download/${fileIndex}`;
  },
};
