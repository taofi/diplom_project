'use client';

import { useState } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { chatApi } from '@/lib/api-chat';
import { Button, Modal, Input } from '@/components/ui';
import type { CounterOfferDto } from '@/types/chat/offer.types';

interface PriceChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: number;
  currentPrice: number;
  userType?: 'author' | 'creator';
  onSuccess?: (offer: unknown) => void;
}

export function PriceChangeModal({
  isOpen,
  onClose,
  offerId,
  currentPrice,
  userType = 'author',
  onSuccess,
}: PriceChangeModalProps) {
  const { t } = useI18n();
  const [newPrice, setNewPrice] = useState<number>(currentPrice);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPrice < 0) {
      setError(t('chat.errors.pricePositive'));
      return;
    }

    if (newPrice === currentPrice) {
      setError(t('chat.errors.priceSame'));
      return;
    }

    setLoading(true);
    try {
      const dto: CounterOfferDto = { newPrice };
      let offer;
      if (userType === 'creator') {
        offer = await chatApi.counterOfferFromCreator(offerId, dto);
      } else {
        offer = await chatApi.counterOffer(offerId, dto);
      }
      onSuccess?.(offer);
      handleClose();
    } catch (err) {
      setError(t('chat.errors.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewPrice(currentPrice);
    setError(null);
    onClose();
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(value);
  };

  const priceDiff = newPrice - currentPrice;
  const priceDiffPercent = currentPrice > 0 ? (priceDiff / currentPrice) * 100 : 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('chat.changePrice')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">
            {t('chat.currentPrice')}: <span className="font-semibold">{formatPrice(currentPrice)}</span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('chat.newPrice')}
          </label>
          <div className="flex items-center gap-2">
            <Input
              name="newPrice"
              type="number"
              value={newPrice || ''}
              onChange={(val) => setNewPrice(Number(val) || 0)}
              placeholder="0"
              min={0}
              step={100}
              disabled={loading}
              className="flex-1"
            />
            <span className="text-gray-500 font-medium">RUB</span>
          </div>
        </div>

        {newPrice !== currentPrice && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              {priceDiff > 0 ? t('chat.priceIncrease') : t('chat.priceDecrease')}: {' '}
              <span className="font-semibold">
                {priceDiff > 0 ? '+' : ''}{formatPrice(priceDiff)} ({priceDiffPercent.toFixed(1)}%)
              </span>
            </p>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('chat.submitPrice')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}