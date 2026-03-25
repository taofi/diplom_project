// Chat types for frontend

export interface ChatUser {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface ChatRoom {
  id: number;
  buyer_id: number;
  seller_id: number;
  product_id: number | null;
  user_product_id: number | null;
  status: 'open' | 'closed';
  visibility: 'pending' | 'visible';
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields (populated from relations)
  buyer?: ChatUser;
  seller?: ChatUser;
  product?: {
    id: number;
    name: string;
    main_image: string;
    translatedName?: string; // Переведенное название товара (translatedProductName)
    translatedDescription?: string; // Переведенное описание товара
    mainImage?: string; // Главное изображение (из is_cover)
    licenseTypeName?: string; // Название типа лицензии
    price?: number; // Цена
    media?: Array<{
      id: number;
      url: string;
      is_cover: boolean;
    }>;
  };
  // Fields from server (ChatRoomWithTranslations)
  translatedProductName?: string;
  translatedProductDescription?: string;
  mainImage?: string;
  licenseTypeName?: string;
  price?: number;
  lastMessage?: ChatMessage;
  unreadCount?: number;
  buyerIsOnline?: boolean;
  sellerIsOnline?: boolean;
}

export interface ChatMessage {
  id: number;
  chat_room_id: number;
  sender_id: number;
  message: string | null;
  message_type: 'text' | 'image' | 'file' | 'offer';
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
  sender?: ChatUser;
}

import { Offer, OfferStatus } from './offer.types';

export type { Offer, OfferStatus };

export interface CustomOrder {
  id: number;
  chat_offer_id: number;
  buyer_id: number;
  seller_id: number;
  chat_room_id: number;
  description: string;
  price: number;
  status: 'in_progress' | 'review' | 'revision' | 'completed' | 'cancelled';
  deadline: string;
  created_at: string;
  updated_at: string;
  offer?: Offer;
  // Дополнительные поля для страницы заказов
  is_paid?: boolean;
  preview_url?: string | null;
  source_files_urls?: string[] | null;
}

export interface CustomOrderRevision {
  id: number;
  custom_order_id: number;
  file_url: string;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
}

// Chat state types
export interface ChatState {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

// WebSocket event payloads
export interface NewMessagePayload {
  message: ChatMessage;
}

export interface MessageUpdatedPayload {
  message: ChatMessage;
}

export interface OfferCreatedPayload {
  offer: Offer;
}

export interface OfferUpdatedPayload {
  offer: Offer;
}

export interface UserTypingPayload {
  roomId: number;
  userId: number;
  isTyping: boolean;
}

export interface OrderUpdatedPayload {
  order: CustomOrder;
}
