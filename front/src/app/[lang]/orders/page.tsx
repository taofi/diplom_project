'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth/AuthContext';
import { ChatProvider, useChat } from '@/context/chat/ChatContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useI18n } from '@/context/i18n/I18nContext';
import { OrderCard } from '@/components/chat/OrderCard';
import { Spinner } from '@/components/ui';
import type { CustomOrder } from '@/types/chat';

function OrdersContent() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { orders, loadOrders } = useChat();
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'review' | 'completed'>('all');

  // Load orders on mount
  useEffect(() => {
    const load = async () => {
      try {
        await loadOrders();
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [loadOrders]);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  // Separate orders by role
  const buyerOrders = filteredOrders.filter(order => order.buyer_id === user?.id);
  const sellerOrders = filteredOrders.filter(order => order.seller_id === user?.id);

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
            { value: 'review', label: t('orders.filterReview') },
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
                    <OrderCard
                      key={order.id}
                      order={order}
                      currentUserId={user.id}
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
                    <OrderCard
                      key={order.id}
                      order={order}
                      currentUserId={user.id}
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
      <ChatProvider>
        <OrdersContent />
      </ChatProvider>
    </ProtectedRoute>
  );
}
