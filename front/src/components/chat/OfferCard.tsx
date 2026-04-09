'use client';

import { useState } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { Button, Card } from '@/components/ui';
import { ServerImage } from '@/components/Image';
import { ImageModal } from './ImageModal';
import { PaymentModal } from './PaymentModal';
import { PriceChangeModal } from './PriceChangeModal';
import type { Offer } from '@/types/chat';
import { UploadFilesModal } from './UploadFilesModal';

interface OfferCardProps {
  offer: Offer;
  currentUserId: number;
  onClick?: () => void;
  showActions?: 'all' | 'none' | 'download-only' | 'completed-only';
  onAccept?: (offer: Offer) => void;
  onDecline?: (offer: Offer) => void;
  onCounterOffer?: (offer: Offer) => void;
  onConfirmPrice?: (offer: Offer) => void;
  onPay?: (offer: Offer) => void;
  onUploadFiles?: (offer: Offer) => void;
  onDownloadFiles?: (offer: Offer, fileUrl?: string) => void;
  isLoading?: boolean;
}

export function OfferCard({ 
  offer, 
  currentUserId, 
  onClick,
  showActions = 'all',
  onAccept, 
  onDecline, 
  onCounterOffer,
  onConfirmPrice,
  onPay,
  onUploadFiles,
  onDownloadFiles,
  isLoading = false 
}: OfferCardProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPriceChangeModalOpen, setIsPriceChangeModalOpen] = useState(false);
  const [isCreatorPriceChangeModalOpen, setIsCreatorPriceChangeModalOpen] = useState(false);
  
  // Определение роли: author - это продавец, creator - покупатель
  const isAuthor = offer.author_id === currentUserId;
  const isCreator = offer.creator_id === currentUserId;
  
  // Статусы
  const isWaitingAuthor = offer.status === 'waiting_author';
  const isWaitingUser = offer.status === 'waiting_user';
  const isInProgress = offer.status === 'in_progress';
  const isAwaitingPayment = offer.status === 'awaiting_payment';
  const isCompleted = offer.status === 'completed';
  const isRejected = offer.status === 'rejected';
  
  // Логика отображения цен
  const showBothPrices = offer.original_price !== null && offer.original_price !== offer.price;

  const formatPrice = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  return new Intl.NumberFormat('be-BY', {
    style: 'currency',
    currency: 'BYN',
    // Если нужно гарантировать 2 знака после запятой, можно добавить:
    minimumFractionDigits: 2,
  }).format(numPrice);
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

  const handlePay = async () => {
    // Открываем модальное окно оплаты
    setIsPaymentModalOpen(true);
  };

  const handleUploadFiles = async () => {
    // Открываем модальное окно для загрузки файлов
    setIsModalOpen(true);
  };

  const handleDownloadFiles = async () => {
    if (!onDownloadFiles) return;
    setLoading(true);
    try {
      await onDownloadFiles(offer);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isAwaitingPayment) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
          {t('chat.offerAwaitingPayment')}
        </span>
      );
    }
    if (isCompleted) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          {t('chat.offerCompleted')}
        </span>
      );
    }
    if (isInProgress) {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          {t('chat.inProgress')}
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          {t('chat.offerDeclined')}
        </span>
      );
    }
    return null;
  };

  const getRoleLabel = () => {
    if (isAuthor) {
      return t('chat.from') + ' ' + t('chat.seller');
    }
    if (isCreator) {
      return t('chat.from') + ' ' + t('chat.buyer');
    }
    return t('chat.from') + ' ' + t('chat.seller');
  };

  const parseUrlArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string');
        }
      } catch {
        return [];
      }
    }
    return [];
  };

  const creatorAttachments = parseUrlArray(offer.creator_attachments_urls);
  const authorImages = parseUrlArray(offer.author_images_urls);
  const sourceFiles = parseUrlArray(offer.source_files_urls);
  const isAuthorFileAvailable = offer.status === 'completed' && offer.is_paid;

  const creatorImageUrls = creatorAttachments.filter((url) =>
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url),
  );
  const creatorFileUrls = creatorAttachments.filter(
    (url) => !/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url),
  );
  const authorFileUrls = Array.from(
    new Set([
      ...(isAuthorFileAvailable && offer.author_file_url ? [offer.author_file_url] : []),
      ...(isAuthorFileAvailable ? sourceFiles : []),
    ]),
  );
  const authorImageUrls = Array.from(new Set([...(offer.preview_url ? [offer.preview_url] : []), ...authorImages]));

  return (
    <Card className="p-4 bg-blue-50 border border-blue-200 cursor-pointer" onClick={onClick}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{t('chat.offer')}</h4>
          <p className="text-sm text-gray-500">
            {t('chat.from') + ' ' + t('chat.buyer')}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-gray-700">{offer.description}</p>
        
        {/* Отображение цен */}
        <div className="flex items-center gap-4 text-sm">
          {showBothPrices ? (
            <>
              {/* Цена заказчика (оригинальная) */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500 line-through">
                  {formatPrice(offer.original_price!)}
                </span>
                <span className="text-xs text-gray-400">({t('chat.buyerPrice')})</span>
              </div>
              {/* Финальная цена (предложенная автором) */}
              <div className="flex items-center gap-1">
                <span className="font-semibold text-green-600">
                  {formatPrice(offer.price)}
                </span>
                <span className="text-xs text-gray-400">({t('chat.finalPrice')})</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-green-600">{formatPrice(offer.price)}</span>
            </div>
          )}
        </div>
        
        {/* Изображения заказчика */}
        {creatorImageUrls.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">{t('chat.creatorImages')}</p>
            <div className="grid grid-cols-2 gap-2">
              {creatorImageUrls.map((url) => (
                <div
                  key={url}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(url);
                    setIsImageModalOpen(true);
                  }}
                >
                  <ServerImage 
                    src={url} 
                    alt="Preview" 
                    className="max-w-full h-auto rounded max-h-32 object-contain hover:opacity-90 transition-opacity"
                    width={400}
                    height={120}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Изображения автора */}
        {authorImageUrls.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">{t('chat.authorImages')}</p>
            <div className="grid grid-cols-2 gap-2">
              {authorImageUrls.map((url) => (
                <div
                  key={url}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(url);
                    setIsImageModalOpen(true);
                  }}
                >
                  <ServerImage
                    src={url}
                    alt="Preview"
                    className="max-w-full h-auto rounded max-h-32 object-contain hover:opacity-90 transition-opacity"
                    width={400}
                    height={120}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Файлы заказчика */}
        {creatorFileUrls.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">{t('chat.creatorFiles')}</p>
            <ul className="space-y-1">
              {creatorFileUrls.map((fileUrl) => {
                const filename = fileUrl.split('/').pop() || fileUrl;
                return (
                  <li key={fileUrl} className="flex items-center justify-between bg-white rounded border px-2 py-1">
                    <span className="text-sm truncate max-w-[170px]" title={filename}>
                      {filename}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadFiles?.(offer, fileUrl);
                      }}
                    >
                      {t('chat.downloadFiles')}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Файл автора (доступ после оплаты) */}
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">{t('chat.authorFiles')}</p>
          {authorFileUrls.length > 0 ? (
            <ul className="space-y-1">
              {authorFileUrls.map((fileUrl) => {
                const filename = fileUrl.split('/').pop() || fileUrl;
                return (
                  <li key={fileUrl} className="flex items-center justify-between bg-white rounded border px-2 py-1">
                    <span className="text-sm truncate max-w-[170px]" title={filename}>
                      {filename}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadFiles?.(offer, fileUrl);
                      }}
                    >
                      {t('chat.downloadFiles')}
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            !isAuthorFileAvailable && (
              <p className="text-xs text-gray-400">{t('chat.authorFileAfterPayment')}</p>
            )
          )}
        </div>
      </div>

      {/* Кнопки действий */}
      
      {/* Статус WAITING_AUTHOR - автор может принять, отклонить или изменить цену */}
      {(showActions === 'all') && isWaitingAuthor && isAuthor && (
        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <Button
              onClick={(e) => { e.stopPropagation(); handleAccept(); }}
              disabled={loading || isLoading}
              variant="primary"
              size="sm"
              className="flex-1"
            >
              {loading || isLoading ? t('common.loading') : t('chat.acceptOffer')}
            </Button>
            <Button
              onClick={(e) => { e.stopPropagation(); handleDecline(); }}
              disabled={loading || isLoading}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              {t('chat.declineOffer')}
            </Button>
          </div>
          <Button
            onClick={(e) => { e.stopPropagation(); setIsPriceChangeModalOpen(true); }}
            disabled={loading || isLoading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {t('chat.changePrice')}
          </Button>
        </div>
      )}

      {/* Статус WAITING_USER - заказчик может согласиться или предложить свою цену */}
      {(showActions === 'all') && isWaitingUser && isCreator && (
        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <Button
              onClick={(e) => { e.stopPropagation(); onConfirmPrice?.(offer); }}
              disabled={loading || isLoading}
              variant="primary"
              size="sm"
              className="flex-1"
            >
              {t('chat.confirmPrice')}
            </Button>
            <Button
              onClick={(e) => { e.stopPropagation(); setIsCreatorPriceChangeModalOpen(true); }}
              disabled={loading || isLoading}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              {t('chat.counterOffer')}
            </Button>
          </div>
        </div>
      )}

      {/* Статус IN_PROGRESS - автор загружает файлы */}
      {(showActions === 'all') && isInProgress && isAuthor && (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            onClick={(e) => { e.stopPropagation(); handleUploadFiles(); }}
            disabled={loading || isLoading}
            variant="primary"
            size="sm"
            className="w-full"
          >
            {t('chat.uploadFiles')}
          </Button>
        </div>
      )}

      {/* Статус AWAITING_PAYMENT - заказчик оплачивает */}
      {(showActions === 'all') && isAwaitingPayment && isCreator && (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            onClick={(e) => { e.stopPropagation(); handlePay(); }}
            disabled={loading || isLoading}
            variant="primary"
            size="sm"
            className="w-full"
          >
            {t('chat.payOrder')} - {formatPrice(offer.price)}
          </Button>
        </div>
      )}

      {/* Статус COMPLETED - показать исходники */}
      {(showActions === 'all' || showActions === 'completed-only') && isCompleted && (
        <div className="text-sm text-green-600 font-medium" onClick={(e) => e.stopPropagation()}>
          ✓ {t('chat.orderCompleted')}
          {offer.source_files_urls && offer.source_files_urls.length > 0 && (
            <Button 
              variant="ghost" 
              onClick={(e) => { e.stopPropagation(); handleDownloadFiles(); }}
              disabled={loading || isLoading}
              className="ml-2 text-blue-600"
            >
              {t('chat.downloadFiles')}
            </Button>
          )}
        </div>
      )}

      {/* Модальное окно загрузки файлов */}
      <div onClick={(e) => e.stopPropagation()}>
        <UploadFilesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          offer={offer}
          onSuccess={(updatedOffer) => {
            onUploadFiles?.(updatedOffer);
          }}
        />
      </div>

      {/* Модальное окно просмотра изображения */}
      {selectedImage && (
        <div onClick={(e) => e.stopPropagation()}>
          <ImageModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            src={selectedImage}
            alt="Preview"
          />
        </div>
      )}

      {/* Модальное окно оплаты */}
      <div onClick={(e) => e.stopPropagation()}>
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          offer={offer}
          onSuccess={(updatedOffer) => {
            onPay?.(updatedOffer);
          }}
        />
      </div>

      {/* Модальное окно изменения цены (для автора в статусе waiting_author) */}
      <div onClick={(e) => e.stopPropagation()}>
        <PriceChangeModal
          isOpen={isPriceChangeModalOpen}
          onClose={() => setIsPriceChangeModalOpen(false)}
          offerId={offer.id}
          currentPrice={offer.price}
          userType="author"
          onSuccess={(updatedOffer) => {
            onCounterOffer?.(updatedOffer as Offer);
          }}
        />
      </div>

      {/* Модальное окно изменения цены (для заказчика в статусе waiting_user) */}
      <div onClick={(e) => e.stopPropagation()}>
        <PriceChangeModal
          isOpen={isCreatorPriceChangeModalOpen}
          onClose={() => setIsCreatorPriceChangeModalOpen(false)}
          offerId={offer.id}
          currentPrice={offer.price}
          userType="creator"
          onSuccess={(updatedOffer) => {
            onCounterOffer?.(updatedOffer as Offer);
          }}
        />
      </div>
    </Card>
  );
}
