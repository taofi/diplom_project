'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { OfferCard } from './OfferCard';
import type { Offer } from '@/types/chat';
import { Spinner } from '@/components/ui';

interface OffersPanelProps {
  offers: Offer[];
  currentUserId: number;
  onAccept?: (offer: Offer) => void;
  onDecline?: (offer: Offer) => void;
  isLoading?: boolean;
}

export function OffersPanel({
  offers,
  currentUserId,
  onAccept,
  onDecline,
  isLoading = false,
}: OffersPanelProps) {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
      {/* Заголовок панели */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('chat.offers') || 'Предложения'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {offers.length} {t('chat.offersCount') || 'предложений'}
        </p>
      </div>

      {/* Список предложений со скроллом */}
      <div className="flex-1 overflow-y-auto p-4">
        {offers.length === 0 ? (
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
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                currentUserId={currentUserId}
                onAccept={onAccept}
                onDecline={onDecline}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}