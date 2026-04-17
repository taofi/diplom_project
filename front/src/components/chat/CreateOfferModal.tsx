'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useI18n } from '@/context/i18n/I18nContext';
import { chatApi } from '@/lib/api-chat';
import { Button, Modal, Input } from '@/components/ui';
import type { CreateOfferDto } from '@/types/chat/offer.types';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false },
);

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
  const [images, setImages] = useState<File[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'creating' | 'uploading'>('idle');
  const [createdOfferId, setCreatedOfferId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalAttachments = images.length + files.length;
  const attachments = [
    ...images.map((file, index) => ({ type: 'image' as const, file, index })),
    ...files.map((file, index) => ({ type: 'file' as const, file, index })),
  ];

  const handleAttachmentsSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.currentTarget.value = '';
    if (selected.length === 0) {
      return;
    }

    const selectedImages = selected.filter((file) => file.type.startsWith('image/'));
    const selectedFiles = selected.filter((file) => !file.type.startsWith('image/'));

    if (images.length + files.length + selected.length > 10) {
      setError(t('chat.errors.maxCreatorAttachments'));
      return;
    }

    setError(null);
    setImages((prev) => [...prev, ...selectedImages]);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeAttachment = (type: 'image' | 'file', index: number) => {
    if (type === 'image') {
      setImages((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const createPreviewUrl = (file: File): string => URL.createObjectURL(file);

  const uploadCreatorFiles = async (offerId: number): Promise<void> => {
    if (totalAttachments === 0) {
      return;
    }
    await chatApi.uploadCreatorOfferFiles(offerId, images, files);
  };

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
    if (totalAttachments > 10) {
      setError(t('chat.errors.maxCreatorAttachments'));
      return;
    }

    setLoading(true);
    setPhase('creating');
    let localCreatedOfferId: number | null = null;
    try {
      const dto: CreateOfferDto = {
        chatRoomId,
        authorId,
        description: description.trim(),
        price,
      };

      const result = await chatApi.createEditOffer(dto);
      localCreatedOfferId = result.id;
      setCreatedOfferId(result.id);
      setPhase('uploading');
      await uploadCreatorFiles(result.id);
      onSuccess?.(result);
      handleClose();
    } catch (err) {
      if (localCreatedOfferId) {
        setError(t('chat.errors.uploadAfterCreateFailed'));
      } else {
        setError(t('chat.errors.createFailed'));
      }
    } finally {
      setPhase('idle');
      setLoading(false);
    }
  };

  const handleRetryUpload = async () => {
    if (!createdOfferId) return;
    setError(null);
    setLoading(true);
    setPhase('uploading');
    try {
      await uploadCreatorFiles(createdOfferId);
      const updatedOffer = await chatApi.getOffer(createdOfferId);
      onSuccess?.(updatedOffer);
      handleClose();
    } catch {
      setError(t('chat.errors.uploadAfterCreateFailed'));
    } finally {
      setPhase('idle');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setPrice(0);
    setImages([]);
    setFiles([]);
    setCreatedOfferId(null);
    setPhase('idle');
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('chat.createOrder')}
      size="full"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('chat.orderDescription')}
          </label>
          <div data-color-mode="light">
            <MDEditor
              value={description}
              onChange={(next) => setDescription(next ?? '')}
              preview="edit"
              height={260}
              visibleDragbar={false}
              textareaProps={{
                placeholder: t('chat.orderDescriptionPlaceholder'),
                disabled: loading,
              }}
            />
          </div>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('chat.uploadFiles')}
          </label>
          <input
            type="file"
            multiple
            onChange={handleAttachmentsSelect}
            disabled={loading}
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
          {attachments.length > 0 && (
            <div className="mt-3 border border-gray-200 rounded-lg p-2 bg-gray-50">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {attachments.map((attachment) => (
                  <div
                    key={`${attachment.type}-${attachment.file.name}-${attachment.index}`}
                    className="relative shrink-0 w-24"
                  >
                    {attachment.type === 'image' ? (
                      <img
                        src={createPreviewUrl(attachment.file)}
                        alt={attachment.file.name}
                        className="w-24 h-20 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-24 h-20 rounded border bg-white flex items-center justify-center">
                        <svg className="w-9 h-9 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M14 3v6h6" />
                        </svg>
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs"
                      onClick={() => removeAttachment(attachment.type, attachment.index)}
                      disabled={loading}
                    >
                      ×
                    </button>
                    <p className="text-xs text-gray-600 mt-1 text-center truncate" title={attachment.file.name}>
                      {attachment.file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {t('chat.attachmentsCount')}: {totalAttachments}/10
          </p>
        </div>

        {loading && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            {phase === 'creating'
              ? t('chat.creatingOrderWithFiles')
              : t('chat.uploadingOrderFiles')}
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
            {loading
              ? (phase === 'creating' ? t('chat.creatingOrder') : t('chat.uploading'))
              : t('chat.createOrder')}
          </Button>
        </div>
        {createdOfferId && !loading && totalAttachments > 0 && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleRetryUpload}
            className="w-full"
          >
            {t('chat.retryUpload')}
          </Button>
        )}
      </form>
    </Modal>
  );
}