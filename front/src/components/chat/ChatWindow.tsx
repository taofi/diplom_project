'use client';

import { useState, useRef, FormEvent, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useI18n } from '@/context/i18n/I18nContext';
import { MessageBubble } from './MessageBubble';
import { Button, Spinner } from '@/components/ui';
import { ServerImage } from '@/components/Image';
import { chatApi } from '@/lib/api-chat';
import { ChatAttachmentsPreview } from './ChatAttachmentsPreview';
import type { ChatRoom, ChatMessage } from '@/types/chat';
import type { Offer } from '@/types/chat/offer.types';

interface ChatWindowProps {
  room: ChatRoom | null;
  messages: ChatMessage[];
  offers?: Offer[];
  currentUserId: number;
  onSendMessage: (
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
  typingUsers: Map<number, Set<number>>;
  onTyping: (isTyping: boolean) => void;
  isLoading?: boolean;
  isHovered?: boolean;
  // Online status
  onlineUsers?: Map<number, boolean>;
  // Для создания заказов (только для покупателя)
  onCreateOffer?: () => void;
  isSeller?: boolean;
  // Пагинация сообщений
  hasMoreMessages?: boolean;
  isLoadingOlderMessages?: boolean;
  onLoadOlderMessages?: () => void;
}

export function ChatWindow({
  room,
  messages,
  offers = [],
  currentUserId,
  onSendMessage,
  typingUsers,
  onTyping,
  isLoading = false,
  isHovered = false,
  onlineUsers = new Map(),
  onCreateOffer,
  isSeller = false,
  hasMoreMessages = false,
  isLoadingOlderMessages = false,
  onLoadOlderMessages,
}: ChatWindowProps) {
  const { t, locale } = useI18n();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  // Track previous scroll height for maintaining position after loading older messages
  const prevScrollHeightRef = useRef<number>(0);
  // Track initial load to scroll to bottom when chat is first opened
  const isInitialLoadRef = useRef(true);
  
  // Сброс initial load при смене комнаты
  useEffect(() => {
    if (room) {
      isInitialLoadRef.current = true;
    }
  }, [room]);

  useEffect(() => {
    setAttachments([]);
    setAttachmentsError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [room?.id]);

  // 1. Функция скролла вниз (использует scrollTo для изоляции скролла внутри div)
  const scrollToBottom = useCallback((behaviorOrEvent?: ScrollBehavior | React.MouseEvent) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const behavior: ScrollBehavior = typeof behaviorOrEvent === 'string' 
        ? behaviorOrEvent 
        : 'smooth';

      container.scrollTo({
        top: container.scrollHeight,
        behavior: behavior
      });
    }
  }, []);

  // 2. Обработка события Wheel для блокировки Scroll Chaining
  const handleWheel = useCallback((e: WheelEvent) => {
    if (isHovered && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      // Блокируем прокрутку страницы, если чат в крайних точках
      if ((e.deltaY > 0 && isAtBottom) || (e.deltaY < 0 && isAtTop)) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    }
  }, [isHovered]);

  // 3. Установка нативного слушателя событий
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // 4. Отслеживание положения скролла
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const threshold = 100;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setIsAtBottom(isNearBottom);
    
    // Если прокрутили вверх и есть еще сообщения - загружаем старые
    if (container.scrollTop < 100 && hasMoreMessages && !isLoadingOlderMessages && onLoadOlderMessages) {
      // Сохраняем текущую высоту скролла перед загрузкой
      prevScrollHeightRef.current = container.scrollHeight;
      onLoadOlderMessages();
    }
  }, [hasMoreMessages, isLoadingOlderMessages, onLoadOlderMessages]);

  // 5. Авто-скролл при новых сообщениях
  useEffect(() => {
    // Если загружаем старые сообщения, восстанавливаем позицию скролла
    if (isLoadingOlderMessages && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const heightDiff = newScrollHeight - prevScrollHeightRef.current;
      // Восстанавливаем позицию (добавляем разницу высоты)
      container.scrollTop = heightDiff;
      prevScrollHeightRef.current = 0;
      return;
    }
    
    // При начальной загрузке (первое появление сообщений) - скроллим вниз
    if (isInitialLoadRef.current && messages.length > 0 && messagesContainerRef.current) {
      // Используем requestAnimationFrame для гарантии, что контент уже отрендерен
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
      isInitialLoadRef.current = false;
      return;
    }
    
    // Обычный скролл вниз при новых сообщениях
    if (isAtBottom && (messages.length > 0 || offers.length > 0)) {
      scrollToBottom('smooth');
    }
  }, [messages.length, offers.length, isAtBottom, scrollToBottom, isLoadingOlderMessages]);

  // Обработка ввода
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (!isTypingRef.current && room) {
      isTypingRef.current = true;
      onTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping(false);
    }, 2000);
  };

  const handleAttachmentsSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) {
      return;
    }

    const nextCount = attachments.length + selected.length;
    if (nextCount > 5) {
      setAttachmentsError(t('chat.errors.maxChatAttachments') || 'You can upload up to 5 attachments');
      return;
    }

    const oversized = selected.find((file) => file.size > 20 * 1024 * 1024);
    if (oversized) {
      setAttachmentsError(t('chat.errors.chatFileTooLarge') || 'File is too large (max 20MB)');
      return;
    }

    setAttachments((prev) => [...prev, ...selected]);
    setAttachmentsError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && attachments.length === 0) || !room) {
      return;
    }

    try {
      setIsSending(true);
      setAttachmentsError(null);

      let uploadedAttachments: Array<{
        kind: 'image' | 'file';
        url: string;
        originalName: string;
        mimeType: string;
        size: number;
      }> = [];

      if (attachments.length > 0) {
        uploadedAttachments = await chatApi.uploadChatAttachments(room.id, attachments);
      }

      await onSendMessage(message.trim(), 'text', uploadedAttachments);
      setMessage('');
      setAttachments([]);
      isTypingRef.current = false;
      onTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTimeout(() => scrollToBottom('smooth'), 100);
    } catch {
      setAttachmentsError(t('chat.uploadError') || 'Upload error');
    } finally {
      setIsSending(false);
    }
  };
  const otherUser = room?.seller?.id === currentUserId ? room?.buyer : room?.seller;
  const hasProductTitle = Boolean(room?.translatedProductName || room?.product?.translatedName || room?.product?.name);
  const roomTypingUsers = room ? typingUsers.get(room.id) : undefined;
  const isTyping = roomTypingUsers ? roomTypingUsers.size > 0 : false;


  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('chat.selectChat')}</h3>
        <p className="text-gray-500">{t('chat.chooseChatToStart')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Шапка */}
      <div className="flex-none px-6 py-4 border-b border-gray-200 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {(room.mainImage || room.product?.mainImage || room.product?.media?.[0]) ? (
              <ServerImage
                src={room.mainImage || room.product?.mainImage || room.product?.media?.[0]?.url || ''}
                alt={room.translatedProductName || room.product?.name || 'Product'}
                width={40} height={40} className="w-full h-full object-cover"
              />
            ) : otherUser?.avatar_url ? (
              <ServerImage
                src={otherUser.avatar_url} alt={otherUser.name}
                width={40} height={40} className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium text-gray-600">{otherUser?.name?.charAt(0).toUpperCase() || '?'}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {room.translatedProductName || room.product?.translatedName || room.product?.name || otherUser?.name || t('chat.unknownUser')}
              </h3>
              {/* Online status indicator */}
              {otherUser && onlineUsers.get(otherUser.id) && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {t('chat.online') || 'Online'}
                </span>
              )}
            </div>
            {otherUser && hasProductTitle && (
              <p className="text-sm text-gray-500">{otherUser.name}</p>
            )}
          </div>
          {otherUser?.id && (
            <Link href={`/${locale}/users/${otherUser.id}`} className="ml-auto">
              <Button variant="ghost" size="sm">
                {t('profile.openProfile')}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Контейнер сообщений */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain p-6 bg-gray-50 relative"
      >
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="min-h-full flex flex-col justify-end">
            <div className="w-full">
              {/* Индикатор загрузки старых сообщений */}
              {isLoadingOlderMessages && (
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Spinner size="sm" />
                    <span className="text-sm">{t('chat.loadingOlder') || 'Загрузка сообщений...'}</span>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} message={msg} 
                  currentUserId={currentUserId} 
                  isOffer={msg.message_type === 'offer'} 
                />
              ))}
              <div ref={messagesEndRef} className="h-0" />
            </div>
          </div>
        )}

        {!isAtBottom && (
          <button
            onClick={() => scrollToBottom('smooth')}
            className="sticky bottom-4 float-right bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors z-20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      {/* Индикатор печати и Ввод */}
      <div className="flex-none bg-white border-t border-gray-200">
        {isTyping && (
          <div className="px-6 py-2 text-sm text-gray-500 bg-gray-50/50">{t('chat.typing')}</div>
        )}
        <div className="px-6 py-4">
          <form onSubmit={handleSubmit}>
            <ChatAttachmentsPreview files={attachments} onRemove={handleRemoveAttachment} />
            {attachmentsError && (
              <div className="mb-2 text-sm text-red-500">{attachmentsError}</div>
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleAttachmentsSelect}
                className="hidden"
                id="chat-attachments-input"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label={t('chat.addAttachment') || 'Add attachment'}
                title={t('chat.addAttachment') || 'Add attachment'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              <input
                type="text"
                value={message}
                onChange={handleInputChange}
                placeholder={t('chat.typeMessage')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              {/* Кнопка создания заказа - только для покупателя */}
              {onCreateOffer && !isSeller && room && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCreateOffer}
                  className="whitespace-nowrap"
                >
                  {t('chat.createOrder')}
                </Button>
              )}

              <Button
                type="submit"
                disabled={isSending || (!message.trim() && attachments.length === 0)}
              >
                {isSending ? (t('chat.uploading') || 'Uploading...') : t('common.send')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}