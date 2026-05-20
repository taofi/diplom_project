'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { ServerImage } from '@/components/Image';
import type { ChatMessage } from '@/types/chat';
import { MessageAttachments } from './MessageAttachments';

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId: number;
  isOffer?: boolean;
}

export function MessageBubble({ message, currentUserId, isOffer = false }: MessageBubbleProps) {
  const { t } = useI18n();
  const isOwn = message.sender_id === currentUserId;
  const sender = message.sender;

  if (isOffer) {
    return null;
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = () => {
    const hasAttachments = Boolean(message.attachments && message.attachments.length > 0);
    if (hasAttachments) {
      return (
        <div className="space-y-2">
          <MessageAttachments attachments={message.attachments || []} />
          {message.message && (
            <p className="whitespace-pre-wrap wrap-break-word">{message.message}</p>
          )}
        </div>
      );
    }

    switch (message.message_type) {
      case 'image':
        return message.attachment_url ? (
          <div className="rounded-lg overflow-hidden">
            <ServerImage
              src={message.attachment_url}
              alt="Image"
              width={200}
              height={200}
              className="max-w-[200px] object-cover"
            />
          </div>
        ) : null;
      case 'file':
        return message.attachment_url ? (
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-sm">{t('chat.attachment')}</span>
          </a>
        ) : null;
      default:
        return <p className="whitespace-pre-wrap wrap-break-word">{message.message}</p>;
    }
  };

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center overflow-hidden">
        {sender?.avatar_url ? (
          <ServerImage
            src={sender.avatar_url}
            alt={sender.name}
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium text-gray-600">
            {sender?.name?.charAt(0).toUpperCase() || '?'}
          </span>
        )}
      </div>

      {/* Message content */}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-700">
            {sender?.name || t('chat.unknownUser')}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(message.created_at)}
          </span>
        </div>
        
        <div
          className={`
            px-4 py-2 rounded-2xl
            ${isOwn 
              ? 'bg-primary text-white rounded-br-md' 
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
            }
          `}
        >
          {renderContent()}
        </div>

        {message.is_read && isOwn && (
          <span className="text-xs text-gray-400 mt-1 block">
            {t('chat.read')}
          </span>
        )}
      </div>
    </div>
  );
}
