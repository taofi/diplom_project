// Типы для WebSocket чата

export interface ChatUser {
  id: number;
  username: string;
  email: string;
}

export interface TempChat {
  id: string;
  buyerId: number;
  sellerId: number;
  productId: number | null;
  userProductId: number | null;
  createdAt: string;
  updatedAt: string;
}

// Типы для расширенного ChatRoom с переводами
export interface ChatRoomProductTranslated {
  translatedName: string;
  translatedDescription?: string;
  translatedShortDescription?: string;
}

export interface ChatRoomWithTranslations {
  translatedProductName?: string;
  translatedProductDescription?: string;
  mainImage?: string;
  licenseTypeName?: string;
  price?: number;
}

export interface JoinRoomPayload {
  roomId: number;
}

export interface LeaveRoomPayload {
  roomId: number;
}

export interface SendMessagePayload {
  roomId: number;
  content: string;
  type?: 'text' | 'image' | 'file';
  attachments?: Array<{
    kind: 'image' | 'file';
    url: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>;
}

export interface TypingPayload {
  roomId: number;
  isTyping: boolean;
}

export interface InitTempChatPayload {
  productId?: number;
  sellerId: number;
  userProductId?: number;
}

// Server -> Client events
export interface NewMessageEvent {
  message: {
    id: number;
    chatRoomId: number;
    senderId: number;
    message: string | null;
    messageType: string;
    attachmentUrl: string | null;
    attachments?: Array<{
      id: number;
      kind: string;
      url: string;
      original_name: string;
      mime_type: string;
      size: number;
    }>;
    isRead: boolean;
    createdAt: string;
  };
}

export interface MessageUpdatedEvent {
  message: {
    id: number;
    chatRoomId: number;
    senderId: number;
    message: string | null;
    messageType: string;
    attachmentUrl: string | null;
    attachments?: Array<{
      id: number;
      kind: string;
      url: string;
      original_name: string;
      mime_type: string;
      size: number;
    }>;
    isRead: boolean;
    createdAt: string;
  };
}

export interface OfferCreatedEvent {
  offer: {
    id: number;
    chatRoomId: number;
    messageId: number;
    sellerId: number;
    description: string;
    price: number;
    deadline: string;
    status: string;
    createdAt: string;
  };
}

export interface OfferUpdatedEvent {
  offer: {
    id: number;
    chatRoomId: number;
    messageId: number;
    sellerId: number;
    description: string;
    price: number;
    deadline: string;
    status: string;
    respondedAt: string | null;
    createdAt: string;
  };
}

export interface UserTypingEvent {
  roomId: number;
  userId: number;
  isTyping: boolean;
}

export interface OrderUpdatedEvent {
  order: {
    id: number;
    chatOfferId: number;
    buyerId: number;
    sellerId: number;
    chatRoomId: number;
    description: string;
    price: number;
    status: string;
    deadline: string;
    createdAt: string;
    updatedAt: string;
  };
}
