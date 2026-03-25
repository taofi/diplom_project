'use client';

import { useState } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { chatApi } from '@/lib/api-chat';
import { Button, Card, Modal } from '@/components/ui';
import { ServerImage } from '@/components/Image';
import type { CustomOrder, CustomOrderRevision } from '@/types/chat';
import { useRouter } from 'next/navigation';

interface OrderCardProps {
  order: CustomOrder;
  currentUserId: number;
  onClick?: () => void;
}

export function OrderCard({ order, currentUserId, onClick }: OrderCardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [downloadingFileIndex, setDownloadingFileIndex] = useState<number | null>(null);
  
  const isBuyer = order.buyer_id === currentUserId;
  const isSeller = order.seller_id === currentUserId;
  const isInProgress = order.status === 'in_progress';
  const isReview = order.status === 'review';
  const isRevision = order.status === 'revision';
  const isCompleted = order.status === 'completed';
  
  // Check if order is paid - use is_paid field or check offer status
  const isPaid = order.is_paid || (order.offer && order.offer.is_paid);

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

  const handleViewChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      router.push(`/chat?room=${order.chat_room_id}`);
    }
  };

  // Handle file download
  const handleDownloadFile = async (fileIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingFileIndex(fileIndex);
    try {
      // Construct the download URL
      const downloadUrl = `/chat/offers/${order.chat_offer_id}/download/${fileIndex}`;
      
      // Create a temporary anchor to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `file_${fileIndex + 1}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setDownloadingFileIndex(null);
    }
  };

  // Get preview URL from order or offer
  const previewUrl = order.preview_url || (order.offer && order.offer.preview_url);
  const sourceFilesUrls = order.source_files_urls || (order.offer && order.offer.source_files_urls);

  // Click handler for the entire card
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/chat?room=${order.chat_room_id}`);
    }
  };

  return (
    <>
      <Card 
        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleCardClick}
      >
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

        {/* Files section for paid orders */}
        {isPaid && (previewUrl || sourceFilesUrls) && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">{t('chat.orderFiles')}:</p>
            
            {/* Preview button */}
            {previewUrl && (
              <Button
                onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
                variant="outline"
                size="sm"
                className="mb-2 mr-2"
              >
                {t('chat.viewPreview')}
              </Button>
            )}
            
            {/* Download buttons for source files */}
            {sourceFilesUrls && sourceFilesUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sourceFilesUrls.map((url, index) => (
                  <Button
                    key={index}
                    onClick={(e) => handleDownloadFile(index, e)}
                    variant="secondary"
                    size="sm"
                    disabled={downloadingFileIndex === index}
                  >
                    {downloadingFileIndex === index 
                      ? t('common.loading') 
                      : `${t('chat.downloadFile')} ${index + 1}`}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

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
                onClick={(e) => { e.stopPropagation(); handleApprove(); }}
                disabled={loading}
                variant="primary"
                size="sm"
              >
                {loading ? t('common.loading') : t('chat.approveResult')}
              </Button>
              <Button
                onClick={(e) => { e.stopPropagation(); handleRequestRevision(); }}
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

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={t('chat.preview')}
      >
        {previewUrl && (
          <div className="flex flex-col items-center">
            <img
              src={previewUrl}
              alt={t('chat.preview')}
              className="max-w-full max-h-[70vh] object-contain"
            />
            <div className="mt-4 flex gap-2">
              {sourceFilesUrls && sourceFilesUrls.length > 0 && sourceFilesUrls.map((url, index) => (
                <Button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); handleDownloadFile(index, e); }}
                  variant="primary"
                  size="sm"
                >
                  {t('chat.downloadFile')} {index + 1}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
