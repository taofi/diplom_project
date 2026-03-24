'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { MessageBubble } from './MessageBubble';
import { OfferCard } from './OfferCard';
import { Button, Spinner } from '@/components/ui';
import { ServerImage } from '@/components/Image';
import type { ChatRoom, ChatMessage, ChatOffer } from '@/types/chat';

interface ChatWindowProps {
  room: ChatRoom | null;
  messages: ChatMessage[];
  offers: ChatOffer[];
  currentUserId: number;
  onSendMessage: (content: string, type?: string) => void;
  onAcceptOffer: (offer: ChatOffer) => Promise<void>;
  onDeclineOffer: (offer: ChatOffer) => Promise<void>;
  typingUsers: Map<number, Set<number>>;
  onTyping: (isTyping: boolean) => void;
  isLoading?: boolean;
}

export function ChatWindow({
  room,
  messages,
  offers,
  currentUserId,
  onSendMessage,
  onAcceptOffer,
  onDeclineOffer,
  typingUsers,
  onTyping,
  isLoading = false,
}: ChatWindowProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Send typing indicator
    if (!isTypingRef.current && room) {
      isTypingRef.current = true;
      onTyping(true);
    }
    
    // Clear typing indicator after 2 seconds of no input
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping(false);
    }, 2000);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    onSendMessage(message.trim());
    setMessage('');
    
    // Clear typing indicator
    isTypingRef.current = false;
    onTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const getOtherUser = () => {
    if (!room) return null;
    return room.seller || room.buyer;
  };

  const otherUser = getOtherUser();
  const roomId = room?.id;
  const roomTypingUsers = room ? typingUsers.get(room.id) : undefined;
  const isTyping = roomTypingUsers ? roomTypingUsers.size > 0 : false;

  // No room selected
  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('chat.selectChat')}
        </h3>
        <p className="text-gray-500">
          {t('chat.chooseChatToStart')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {otherUser?.avatar ? (
              <ServerImage
                src={otherUser.avatar}
                alt={otherUser.username}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium text-gray-600">
                {otherUser?.username?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {otherUser?.username || t('chat.unknownUser')}
            </h3>
            {room.product && (
              <p className="text-sm text-gray-500">
                {t('chat.aboutProduct')}: {room.product.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div>
            {/* Offers */}
            {offers.map((offer) => (
              <div key={offer.id} className="mb-4">
                <OfferCard
                  offer={offer}
                  currentUserId={currentUserId}
                  onAccept={onAcceptOffer}
                  onDecline={onDeclineOffer}
                />
              </div>
            ))}

            {/* Messages */}
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUserId={currentUserId}
                isOffer={message.message_type === 'offer'}
              />
            ))}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Typing indicator */}
      {isTyping && (
        <div className="px-6 py-2 text-sm text-gray-500">
          {t('chat.typing')}
        </div>
      )}

      {/* Message input */}
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder={t('chat.typeMessage')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button type="submit" disabled={!message.trim()}>
            {t('common.send')}
          </Button>
        </form>
      </div>
    </div>
  );
}
