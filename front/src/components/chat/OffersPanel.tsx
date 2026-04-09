'use client';

import { useState } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { OfferCard } from './OfferCard';
import type { Offer } from '@/types/chat';
import { Spinner, Button } from '@/components/ui';
import { OfferStatus } from '@/types/chat/offer.types';

type OfferFilter = 'all' | OfferStatus;

interface OffersPanelProps {
  offers: Offer[];
  currentUserId: number;
  onAccept?: (offer: Offer) => void;
  onDecline?: (offer: Offer) => void;
  onCounterOffer?: (offer: Offer) => void;
  onConfirmPrice?: (offer: Offer) => void;
  onPay?: (offer: Offer) => void;
  onUploadFiles?: (offer: Offer) => void;
  onDownloadFiles?: (offer: Offer) => void;
  isLoading?: boolean;
}

export function OffersPanel({
  offers,
  currentUserId,
  onAccept,
  onDecline,
  onCounterOffer,
  onConfirmPrice,
  onPay,
  onUploadFiles,
  onDownloadFiles,
  isLoading = false,
}: OffersPanelProps) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<OfferFilter>('all');

  // Фильтрация предложений по статусу
  const filteredOffers = filter === 'all' 
    ? offers 
    : offers.filter(o => o.status === filter);

  // Подсчет количества по статусам
  const statusCounts = {
    waiting_author: offers.filter(o => o.status === 'waiting_author').length,
    waiting_user: offers.filter(o => o.status === 'waiting_user').length,
    in_progress: offers.filter(o => o.status === 'in_progress').length,
    awaiting_payment: offers.filter(o => o.status === 'awaiting_payment').length,
    completed: offers.filter(o => o.status === 'completed').length,
    rejected: offers.filter(o => o.status === 'rejected').length,
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
      {/* Заголовок панели с фильтрами */}
      <div className="p-4 border-b border-gray-200 shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('chat.offers') || 'Заказы'}
        </h2>
        
        {/* Фильтры */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('chat.filterAll') || 'Все'} ({offers.length})
          </button>
          <button
            onClick={() => setFilter(OfferStatus.WAITING_AUTHOR)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === OfferStatus.WAITING_AUTHOR
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('chat.filterWaiting') || 'Ожидают'} ({statusCounts.waiting_author})
          </button>
          <button
            onClick={() => setFilter(OfferStatus.IN_PROGRESS)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === OfferStatus.IN_PROGRESS
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('chat.inProgress') || 'В работе'} ({statusCounts.in_progress})
          </button>
          <button
            onClick={() => setFilter(OfferStatus.AWAITING_PAYMENT)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === OfferStatus.AWAITING_PAYMENT
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('chat.filterAwaitingPayment') || 'Оплата'} ({statusCounts.awaiting_payment})
          </button>
          <button
            onClick={() => setFilter(OfferStatus.COMPLETED)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === OfferStatus.COMPLETED
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('chat.filterCompleted') || 'Завершённые'} ({statusCounts.completed})
          </button>
        </div>
      </div>

      {/* Список предложений со скроллом */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg
              className="w-12 h-12 text-gray-300 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500 text-sm">
              {t('chat.noOffers') || 'Нет предложений'}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {t('chat.noOffersHint') || 'Предложения появятся здесь'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                currentUserId={currentUserId}
                onAccept={onAccept}
                onDecline={onDecline}
                onCounterOffer={onCounterOffer}
                onConfirmPrice={onConfirmPrice}
                onPay={onPay}
                onUploadFiles={onUploadFiles}
                onDownloadFiles={onDownloadFiles}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}