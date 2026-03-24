'use client';

import { useState } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { chatApi } from '@/lib/api-chat';
import { Button, Card } from '@/components/ui';
import { ServerImage } from '@/components/Image';
import type { CustomOrder, CustomOrderRevision } from '@/types/chat';
import { useRouter } from 'next/navigation';

interface OrderCardProps {
  order: CustomOrder;
  currentUserId: number;
}

export function OrderCard({ order, currentUserId }: OrderCardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  
  const isBuyer = order.buyer_id === currentUserId;
  const isSeller = order.seller_id === currentUserId;
  const isInProgress = order.status === 'in_progress';
  const isReview = order.status === 'review';
  const isRevision = order.status === 'revision';
  const isCompleted = order.status === 'completed';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = () => {
    const statusConfig = {
      in_progress: { className: 'bg-blue-100 text-blue-800', label: t('chat.orderInProgress') },
      review: { className: 'bg-yellow-100 text-yellow-800', label: t('chat.orderInReview') },
      revision: { className: 'bg-orange-100 text-orange-800', label: t('chat.orderNeedsRevision') },
      completed: { className: 'bg-green-100 text-green-800', label: t('chat.orderCompleted') },
      cancelled: { className: 'bg-red-100 text-red-800', label: t('chat.orderCancelled') },
    };
    
    const config = statusConfig[order.status] || statusConfig.in_progress;
    
    return (
      <span className={`px-2 py-1 ${config.className} text-xs rounded-full`}>
        {config.label}
      </span>
    );
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await chatApi.approveOrder(order.id);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    setLoading(true);
    try {
      await chatApi.requestRevision(order.id);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleViewChat = () => {
    router.push(`/chat?roomId=${order.chat_room_id}`);
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">
            {t('chat.customOrder')} #{order.id}
          </h4>
          <p className="text-sm text-gray-500">{t('chat.deadline')}: {formatDate(order.deadline)}</p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-gray-700">{order.description}</p>
        
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-green-600">{formatPrice(order.price)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={handleViewChat}
          variant="secondary"
          size="sm"
        >
          {t('chat.viewChat')}
        </Button>

        {isBuyer && isReview && (
          <>
            <Button
              onClick={handleApprove}
              disabled={loading}
              variant="primary"
              size="sm"
            >
              {loading ? t('common.loading') : t('chat.approveResult')}
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {t('chat.requestRevision')}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
