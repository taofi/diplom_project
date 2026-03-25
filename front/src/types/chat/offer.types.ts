/**
 * Типы для работы с заказами (Offer) на фронтенде
 */

// Интерфейс для файлов заказа (из базы данных)
export interface OfferFile {
  id: number;
  offer_id: number;
  type: OfferFileType;
  original_name: string;
  filename: string;
  url: string;
  size: number;
  mime_type: string;
  created_at: string | Date;
}

export enum OfferStatus {
  WAITING_AUTHOR = 'waiting_author',
  WAITING_USER = 'waiting_user',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  AWAITING_PAYMENT = 'awaiting_payment',
  COMPLETED = 'completed',
}

export enum OfferFileType {
  PREVIEW = 'preview',
  SOURCE = 'source',
}

export interface Offer {
  id: number;
  chat_room_id: number;
  creator_id: number;
  author_id: number;
  description: string;
  price: number;
  original_price: number | null;
  status: OfferStatus;
  preview_url: string | null;
  source_files_urls: string[] | null;
  is_paid: boolean;
  paid_at: Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  deadline?: string;
  // Legacy fields for backward compatibility - maps author_id to seller_id
  seller_id: number;
  responded_at?: string | null;
  // Связанные данные (при загрузке с сервера)
  creator?: {
    id: number;
    username: string;
    avatar_url?: string;
  };
  author?: {
    id: number;
    username: string;
    avatar_url?: string;
  };
}

export interface OfferFiles {
  preview_url: string | null;
  source_files_urls: string[] | null;
}

// DTO для создания заказа
export interface CreateOfferDto {
  chatRoomId: number;
  authorId: number;
  description: string;
  price: number;
}

// DTO для изменения цены (контр-offer)
export interface CounterOfferDto {
  newPrice: number;
}

// DTO для загрузки файлов
export interface UploadFilesDto {
  previewUrl: string;
  sourceFilesUrls: string[];
}

// DTO для оплаты
export interface PayOrderDto {
  simulateSuccess?: boolean;
}