'use client';

import { useState } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { chatApi } from '@/lib/api-chat';
import { Button, Modal, Textarea, Input } from '@/components/ui';
import type { CreateOfferDto } from '@/types/chat/offer.types';

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatRoomId: number;
  authorId: number;
  onSuccess?: (offer: unknown) => void;
}

export function CreateOfferModal({
  isOpen,
  onClose,
  chatRoomId,
  authorId,
  onSuccess,
}: CreateOfferModalProps) {
  const { t } = useI18n();
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError(t('chat.errors.descriptionRequired'));
      return;
    }

    if (price <= 0) {
      setError(t('chat.errors.priceRequired'));
      return;
    }

    setLoading(true);
    try {
      const dto: CreateOfferDto = {
        chatRoomId,
        authorId,
        description: description.trim(),
        price,
      };

      const result = await chatApi.createEditOffer(dto);
      onSuccess?.(result);
      handleClose();
    } catch (err) {
      setError(t('chat.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setPrice(0);
    setError(null);
    onClose();
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(value);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('chat.createOrder')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('chat.orderDescription')}
          </label>
          <Textarea
            name="description"
            value={description}
            onChange={setDescription}
            placeholder={t('chat.orderDescriptionPlaceholder')}
            rows={4}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('chat.orderPrice')}
          </label>
          <div className="flex items-center gap-2">
            <Input
              name="price"
              type="number"
              value={price || ''}
              onChange={(val) => setPrice(Number(val) || 0)}
              placeholder="0"
              min={0}
              step={100}
              disabled={loading}
              className="flex-1"
            />
            <span className="text-gray-500 font-medium">RUB</span>
          </div>
          {price > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {t('chat.priceFormatted')}: {formatPrice(price)}
            </p>
          )}
        </div>

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
            {loading ? t('common.loading') : t('chat.createOrder')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}