'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth/AuthContext';
import { ChatProvider, useChat } from '@/context/chat/ChatContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useI18n } from '@/context/i18n/I18nContext';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { CreateOfferModal } from '@/components/chat/CreateOfferModal';
import { OffersPanel } from '@/components/chat/OffersPanel';
import { Spinner } from '@/components/ui';
import type { ChatRoom } from '@/types/chat';
import type { Offer } from '@/types/chat/offer.types';
import { chatApi } from '@/lib/api-chat';

function ChatContent() {
  const { user } = useAuth();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  
  const {
    isConnected,
    rooms,
    currentRoom,
    loadChatRooms,
    selectRoom,
    messages,
    sendMessage,
    offers,
    createOffer,
    acceptOffer,
    declineOffer,
    counterOffer,
    confirmPrice,
    typingUsers,
    setTyping,
    onlineUsers,
    loadOlderMessages,
    hasMoreMessages,
    isLoadingOlderMessages,
  } = useChat();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [isChatHovered, setIsChatHovered] = useState(false);
  const [isChatsCollapsed, setIsChatsCollapsed] = useState(false);
  const isMountedRef = useRef(false);

  // Состояние для модального окна создания заказа
  const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);

  // Load chat rooms on mount
  useEffect(() => {
    // Prevent double loading in Strict Mode
    if (isMountedRef.current) {
      return;
    }
    isMountedRef.current = true;
    
    const loadRooms = async () => {
      try {
        await loadChatRooms();
      } finally {
        setIsLoading(false);
      }
    };
    loadRooms();
  }, [loadChatRooms]);

  // Handle URL parameters
  useEffect(() => {
    const roomId = searchParams.get('roomId');

    if (roomId && !selectedRoomId) {
      // Select room from URL
      const roomIdNum = parseInt(roomId, 10);
      if (!isNaN(roomIdNum)) {
        setSelectedRoomId(roomIdNum);
        selectRoom(roomIdNum);
      }
    }
  }, [searchParams, selectedRoomId, selectRoom]);

  // Handle room selection
  const handleSelectRoom = useCallback((room: ChatRoom) => {
    setSelectedRoomId(room.id);
    selectRoom(room.id);
  }, [selectRoom]);

  // Handle send message
  const handleSendMessage = useCallback(
    async (
      content: string,
      type = 'text',
      attachments: Array<{
        kind: 'image' | 'file';
        url: string;
        originalName: string;
        mimeType: string;
        size: number;
      }> = [],
    ) => {
      await sendMessage(content, type, attachments);

      // Reload rooms to update last message
      await loadChatRooms();
    },
    [sendMessage, loadChatRooms],
  );

  // Handle accept offer
  const handleAcceptOffer = useCallback(async (offer: Offer) => {
    try {
      await acceptOffer(offer.id);
      // Reload rooms to update offer status
      await loadChatRooms();
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  }, [acceptOffer, loadChatRooms]);

  // Handle decline offer
  const handleDeclineOffer = useCallback(async (offer: Offer) => {
    try {
      await declineOffer(offer.id);
      // Reload rooms to update offer status
      await loadChatRooms();
    } catch (error) {
      console.error('Error declining offer:', error);
    }
  }, [declineOffer, loadChatRooms]);

  // Handle counter offer (change price)
  const handleCounterOffer = useCallback(async (offer: Offer) => {
    try {
      // PriceChangeModal calls API directly, this is just for reloading
      await loadChatRooms();
    } catch (error) {
      console.error('Error with counter offer:', error);
    }
  }, [loadChatRooms]);

  // Handle confirm price
  const handleConfirmPrice = useCallback(async (offer: Offer) => {
    try {
      await confirmPrice(offer.id);
      await loadChatRooms();
    } catch (error) {
      console.error('Error confirming price:', error);
    }
  }, [confirmPrice, loadChatRooms]);

  // Handle download files
  const handleDownloadFiles = useCallback(async (offer: Offer, fileUrl?: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const normalizeUrl = (url: string) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      const clean = url.startsWith('/') ? url.slice(1) : url;
      if (clean.startsWith('files/')) {
        return `${API_URL}/${clean}`;
      }
      return `${API_URL}/public/${clean}`;
    };

    try {
      if (!fileUrl) {
        if (!offer.source_files_urls || offer.source_files_urls.length === 0) {
          console.error('No source files available');
          return;
        }
        const firstUrl = offer.source_files_urls[0];
        const blob = await chatApi.downloadSourceFile(offer.id, 0);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = firstUrl.split('/').pop() || 'file';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }

      if (offer.source_files_urls?.includes(fileUrl)) {
        const fileIndex = offer.source_files_urls.indexOf(fileUrl);
        const blob = await chatApi.downloadSourceFile(offer.id, fileIndex);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileUrl.split('/').pop() || 'file';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }

      const response = await fetch(normalizeUrl(fileUrl));
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileUrl.split('/').pop() || 'file';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading files:', error);
    }
  }, []);

  // Обработчик успешного создания заказа
  const handleCreateOfferSuccess = useCallback(async () => {
    // Закрыть модальное окно
    setIsCreateOfferModalOpen(false);
    // Перезагрузить комнаты
    await loadChatRooms();
  }, [loadChatRooms]);

  // Determine if user is seller in current room
  const isSellerView = currentRoom ? currentRoom.seller_id === user?.id : false;

  if (!user) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="max-w-10xl mt-20 mx-auto py-12 px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('chat.title')}
          </h1>
          <p className="text-gray-500 mt-2">
            {t('chat.subtitle')}
          </p>
          {!isConnected && (
            <div className="mt-2 text-sm text-yellow-600">
              {t('chat.connecting')}
            </div>
          )}
        </div>

        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-250px)]"
          onMouseEnter={() => setIsChatHovered(true)}
          onMouseLeave={() => setIsChatHovered(false)}
        >
          {/* Chat list */}
          <div
            className={`bg-white rounded-lg shadow overflow-hidden transition-all duration-200 ${isChatsCollapsed ? 'lg:col-span-1' : 'lg:col-span-2'}`}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  className="w-5 h-5 text-gray-500 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M21 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-3.7-.8L3 18l1.2-3.2A6.75 6.75 0 013 10c0-3.866 3.582-7 8-7s8 3.134 8 7z"
                  />
                </svg>
                {!isChatsCollapsed && (
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {t('chat.myChats')}
                  </h2>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsChatsCollapsed((prev) => !prev)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label={isChatsCollapsed ? 'Expand chats panel' : 'Collapse chats panel'}
              >
                <svg
                  className={`w-5 h-5 transition-transform ${isChatsCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <ChatList
                  rooms={rooms}
                  selectedRoomId={selectedRoomId || undefined}
                  onSelectRoom={handleSelectRoom}
                  currentUserId={user.id}
                  isSellerView={isSellerView}
                  isHovered={isChatHovered}
                  isCollapsed={isChatsCollapsed}
                />
              )}
            </div>
          </div>

          {/* Chat window */}
          <div className={`bg-white rounded-lg shadow overflow-hidden ${isChatsCollapsed ? 'lg:col-span-7' : 'lg:col-span-6'}`}>
            <ChatWindow
              room={currentRoom}
              messages={messages}
              currentUserId={user.id}
              onSendMessage={handleSendMessage}
              typingUsers={typingUsers}
              onTyping={setTyping}
              isLoading={isLoading}
              onlineUsers={onlineUsers}
              onCreateOffer={() => setIsCreateOfferModalOpen(true)}
              isSeller={isSellerView}
              hasMoreMessages={hasMoreMessages}
              isLoadingOlderMessages={isLoadingOlderMessages}
              onLoadOlderMessages={loadOlderMessages}
            />
          </div>

          {/* Offers panel */}
          <div className="hidden lg:block lg:col-span-4 bg-white rounded-lg shadow overflow-hidden">
            <OffersPanel
              offers={offers}
              currentUserId={user.id}
              onAccept={handleAcceptOffer}
              onDecline={handleDeclineOffer}
              onCounterOffer={handleCounterOffer}
              onConfirmPrice={handleConfirmPrice}
              onDownloadFiles={handleDownloadFiles}
            />
          </div>
        </div>
      </div>

      {/* Модальное окно создания заказа */}
      {currentRoom && !isSellerView && (
        <CreateOfferModal
          isOpen={isCreateOfferModalOpen}
          onClose={() => setIsCreateOfferModalOpen(false)}
          chatRoomId={currentRoom.id}
          authorId={currentRoom.seller_id}
          onSuccess={handleCreateOfferSuccess}
        />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatProvider>
        <ChatContent />
      </ChatProvider>
    </ProtectedRoute>
  );
}
