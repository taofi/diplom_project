'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useI18n } from '@/context/i18n/I18nContext';
import { OfferCard } from '@/components/chat/OfferCard';
import { Spinner } from '@/components/ui';
import { chatApi } from '@/lib/api-chat';
import type { CustomOrder, Offer } from '@/types/chat';
import { useRouter } from 'next/navigation';

function OrdersContent() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'review' | 'completed'>('all');

  // Load orders on mount using the new API
  useEffect(() => {
    const load = async () => {
      try {
        const result = await chatApi.getAllUserOrders();
        setOrders(result.rows);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  // Separate orders by role
  const buyerOrders = filteredOrders.filter(order => order.buyer_id === user?.id);
  const sellerOrders = filteredOrders.filter(order => order.seller_id === user?.id);

  // Handle click on order to open chat
  const handleOrderClick = (order: CustomOrder) => {
    // Navigate to chat page with the room ID
    router.push(`/chat?roomId=${order.chat_room_id}`);
  };

  // Handle download files - use the same implementation as chat page
  const handleDownloadFiles = async (offer: Offer) => {
    if (!offer.source_files_urls || offer.source_files_urls.length === 0) {
      console.error('No source files available');
      return;
    }

    try {
      // Скачиваем первый файл
      const blob = await chatApi.downloadSourceFile(offer.id, 0);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Используем имя файла из URL
      const fileName = offer.source_files_urls[0].split('/').pop() || 'file';
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading files:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="max-w-6xl mt-20 mx-auto py-12 px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('orders.title')}
          </h1>
          <p className="text-gray-500 mt-2">
            {t('orders.subtitle')}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {[
            { value: 'all', label: t('orders.filterAll') },
            { value: 'in_progress', label: t('orders.filterInProgress') },
            { value: 'completed', label: t('orders.filterCompleted') },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('orders.noOrders')}
            </h3>
            <p className="text-gray-500">
              {t('orders.noOrdersDescription')}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Buyer orders */}
            {buyerOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('orders.buyerOrders')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {buyerOrders.map((order) => (
                    <OfferCard
                      key={order.id}
                      offer={order.offer!}
                      currentUserId={user.id}
                      showActions="completed-only"
                      onDownloadFiles={handleDownloadFiles}
                      onClick={() => handleOrderClick(order)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Seller orders */}
            {sellerOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('orders.sellerOrders')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sellerOrders.map((order) => (
                    <OfferCard
                      key={order.id}
                      offer={order.offer!}
                      currentUserId={user.id}
                      showActions="completed-only"
                      onDownloadFiles={handleDownloadFiles}
                      onClick={() => handleOrderClick(order)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}
