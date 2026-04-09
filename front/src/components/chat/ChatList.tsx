'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { ServerImage } from '@/components/Image';
import type { ChatRoom } from '@/types/chat';

interface ChatListProps {
  rooms: ChatRoom[];
  selectedRoomId?: number;
  onSelectRoom: (room: ChatRoom) => void;
  currentUserId: number;
  isSellerView?: boolean;
  isHovered?: boolean;
  isCollapsed?: boolean;
}

export function ChatList({
  rooms,
  selectedRoomId,
  onSelectRoom,
  currentUserId,
  isSellerView = false,
  isHovered = false,
  isCollapsed = false,
}: ChatListProps) {
  const { t } = useI18n();

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return t('chat.yesterday');
    } else if (diffDays < 7) {
      return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  };

  const getOtherUser = (room: ChatRoom) => {
    // Определяем собеседника по текущему пользователю для каждой комнаты,
    // чтобы имя корректно отображалось уже при первом открытии страницы.
    if (room.seller_id === currentUserId) {
      return room.buyer;
    }
    if (room.buyer_id === currentUserId) {
      return room.seller;
    }
    // Fallback для редких случаев неполных данных
    return isSellerView ? room.buyer : room.seller;
  };

  const getChatTitle = (room: ChatRoom) => {
    const otherUser = getOtherUser(room);
    // Если есть товар, показываем переведенное название или имя товара
    // Используем translatedProductName или translatedName
    if (room.translatedProductName || room.product?.translatedName || room.product?.name) {
      return room.translatedProductName || room.product?.translatedName || room.product?.name;
    }
    return otherUser?.name || t('chat.unknownUser');
  };

  if (rooms.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p>{t('chat.noChats')}</p>
      </div>
    );
  }
  // Handle wheel event to prevent scroll propagation when hovering over chat list
  const handleWheel = (e: React.WheelEvent) => {
    if (isHovered) {
      e.stopPropagation();
    }
  };

  return (
    <div className="divide-y divide-gray-100" onWheel={handleWheel}>
      {rooms.map((room) => {
        const otherUser = getOtherUser(room);
        const isSelected = selectedRoomId === room.id;
        const hasUnread = (room.unreadCount || 0) > 0;
        const chatTitle = getChatTitle(room);
        const displayName = otherUser?.name || t('chat.unknownUser');
        const hasProductTitle = Boolean(room.translatedProductName || room.product?.translatedName || room.product?.name);

        return (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className={`
              w-full p-4 text-left transition-colors hover:bg-gray-50
              ${isSelected ? 'bg-primary/5 border-l-4 border-primary' : ''}
              ${isCollapsed ? 'flex flex-col items-center text-center border-l-0 border-b-2' : ''}
            `}
            title={chatTitle}
          >
            <div className={`flex items-center gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
              {/* Avatar */}
              <div className="relative w-12 h-12 shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {/* Показываем обложку товара если есть, иначе аватар пользователя */}
                  {/* Используем mainImage (приоритет) или room.product?.media */}
                  {(room.mainImage || room.product?.mainImage || room.product?.media?.[0]) ? (
                    <ServerImage
                      src={room.mainImage || room.product?.mainImage || room.product?.media?.[0]?.url || ''}
                      alt={room.translatedProductName || room.product?.name || 'Product'}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : otherUser?.avatar ? (
                    <ServerImage
                      src={otherUser.avatar}
                      alt={otherUser.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-medium text-gray-600">
                      {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>

                {/* Unread badge on avatar corner */}
                {hasUnread && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-medium min-w-[18px] h-[18px] px-1 rounded-full border-2 border-white flex items-center justify-center leading-none">
                    {room.unreadCount}
                  </span>
                )}
              </div>

              {isCollapsed && (
                <div className="w-full">
                  <p className="text-xs text-gray-700 leading-tight wrap-break-word line-clamp-2">
                    {displayName}
                  </p>
                </div>
              )}

              {/* Chat info */}
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={`font-medium truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                      {chatTitle}
                    </h4>
                    <span className="text-xs text-gray-400 shrink-0">
                      {formatTime(room.last_message_at)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    {hasProductTitle ? (
                      <div className="flex items-center gap-1 text-xs text-gray-500 min-w-0">
                        <span className="truncate max-w-[90px]">
                          {room.translatedProductName || room.product?.translatedName || room.product?.name}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="truncate max-w-[120px]">{displayName}</span>
                      </div>
                    ) : (
                      <div />
                    )}

                    {room.lastMessage && (
                      <p className={`text-sm truncate ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                        {room.lastMessage.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
