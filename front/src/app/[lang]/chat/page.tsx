'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth/AuthContext';
import { ChatProvider, useChat } from '@/context/chat/ChatContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useI18n } from '@/context/i18n/I18nContext';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Spinner } from '@/components/ui';
import type { ChatRoom, ChatOffer } from '@/types/chat';

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
    typingUsers,
    setTyping,
  } = useChat();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const isMountedRef = useRef(false);

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
  const handleSendMessage = useCallback(async (content: string, type = 'text') => {
    await sendMessage(content, type);
    
    // Reload rooms to update last message
    await loadChatRooms();
  }, [sendMessage, loadChatRooms]);

  // Handle accept offer
  const handleAcceptOffer = useCallback(async (offer: ChatOffer) => {
    try {
      await acceptOffer(offer.id);
      // Reload rooms to update offer status
      await loadChatRooms();
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  }, [acceptOffer, loadChatRooms]);

  // Handle decline offer
  const handleDeclineOffer = useCallback(async (offer: ChatOffer) => {
    try {
      await declineOffer(offer.id);
      // Reload rooms to update offer status
      await loadChatRooms();
    } catch (error) {
      console.error('Error declining offer:', error);
    }
  }, [declineOffer, loadChatRooms]);

  // Determine if user is seller in current room
  const isSellerView = currentRoom ? currentRoom.seller_id === user?.id : false;

  if (!user) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mt-20 mx-auto py-12 px-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Chat list */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('chat.myChats')}
              </h2>
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
                />
              )}
            </div>
          </div>

          {/* Chat window */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
            <ChatWindow
              room={currentRoom}
              messages={messages}
              offers={offers}
              currentUserId={user.id}
              onSendMessage={handleSendMessage}
              onAcceptOffer={handleAcceptOffer}
              onDeclineOffer={handleDeclineOffer}
              typingUsers={typingUsers}
              onTyping={setTyping}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
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
