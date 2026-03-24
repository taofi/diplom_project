'use client';

import { useState } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { chatApi } from '@/lib/api-chat';
import { Button, Card } from '@/components/ui';
import type { ChatOffer, ChatUser } from '@/types/chat';

interface OfferCardProps {
  offer: ChatOffer;
  currentUserId: number;
  onAccept?: (offer: ChatOffer) => void;
  onDecline?: (offer: ChatOffer) => void;
  isLoading?: boolean;
}

export function OfferCard({ offer, currentUserId, onAccept, onDecline, isLoading = false }: OfferCardProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  
  const isSeller = offer.seller_id === currentUserId;
  const isPending = offer.status === 'pending';
  const isAccepted = offer.status === 'accepted';
  const isDeclined = offer.status === 'declined';

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

  const handleAccept = async () => {
    if (!onAccept) return;
    setLoading(true);
    try {
      await onAccept(offer);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!onDecline) return;
    setLoading(true);
    try {
      await onDecline(offer);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isAccepted) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          {t('chat.offerAccepted')}
        </span>
      );
    }
    if (isDeclined) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          {t('chat.offerDeclined')}
        </span>
      );
    }
    return null;
  };

  return (
    <Card className="p-4 bg-blue-50 border border-blue-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{t('chat.offer')}</h4>
          <p className="text-sm text-gray-500">
            {t('chat.from')} {t('chat.seller')}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-gray-700">{offer.description}</p>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-green-600">{formatPrice(offer.price)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-600">{formatDate(offer.deadline)}</span>
          </div>
        </div>
      </div>

      {isPending && !isSeller && (
        <div className="flex gap-2">
          <Button
            onClick={handleAccept}
            disabled={loading || isLoading}
            variant="primary"
            size="sm"
            className="flex-1"
          >
            {loading || isLoading ? t('common.loading') : t('chat.acceptOffer')}
          </Button>
          <Button
            onClick={handleDecline}
            disabled={loading || isLoading}
            variant="secondary"
            size="sm"
            className="flex-1"
          >
            {t('chat.declineOffer')}
          </Button>
        </div>
      )}

      {isAccepted && (
        <div className="text-sm text-green-600 font-medium">
          ✓ {t('chat.orderCreated')}
        </div>
      )}
    </Card>
  );
}
