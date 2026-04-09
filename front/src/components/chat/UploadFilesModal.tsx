'use client';

import { useState, useRef, useCallback } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { chatApi } from '@/lib/api-chat';
import { Button, Modal } from '@/components/ui';
import type { Offer } from '@/types/chat/offer.types';

interface UploadFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer | null;
  onSuccess?: (offer: Offer) => void;
}

export function UploadFilesModal({
  isOpen,
  onClose,
  offer,
  onSuccess,
}: UploadFilesModalProps) {
  const { t } = useI18n();
  const [images, setImages] = useState<File[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagesSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedImages = Array.from(e.target.files || []);
    if (selectedImages.length === 0) return;

    const hasInvalidType = selectedImages.some((item) => !item.type.startsWith('image/'));
    if (hasInvalidType) {
      setError(t('chat.errors.imagesOnly'));
      return;
    }

    setImages((prev) => {
      const next = [...prev, ...selectedImages];
      if (next.length > 10) {
        setError(t('chat.errors.maxAuthorImages'));
        return prev;
      }
      return next;
    });
  }, [t]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      return;
    }
    if (selectedFile.type.startsWith('image/')) {
      setError(t('chat.errors.documentOnly'));
      return;
    }
    setFile(selectedFile);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [t]);

  const handleRemoveImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!offer) {
      setError('No offer selected');
      return;
    }

    if (images.length > 10) {
      setError(t('chat.errors.maxAuthorImages'));
      return;
    }
    if (!images.length && !file) {
      setError(t('chat.uploadError'));
      return;
    }

    setError(null);
    setLoading(true);
    
    try {
      const result = await chatApi.uploadOfferFiles(offer.id, images, file);
      onSuccess?.(result);
      handleClose();
    } catch (err) {
      setError(t('chat.uploadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImages([]);
    setFile(null);
    setError(null);
    if (imagesInputRef.current) {
      imagesInputRef.current.value = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('chat.uploadFiles')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Изображения */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('chat.uploadImages')}
          </label>
          <input
            ref={imagesInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesSelect}
            className="hidden"
            id="images-input"
          />
          
          <label
            htmlFor="images-input"
            className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <div className="text-gray-500">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">{t('chat.dragDropImages')}</p>
            </div>
          </label>

          {images.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {images.map((image, index) => (
                <div key={`${image.name}-${index}`} className="relative">
                  <img
                    src={createPreviewUrl(image)}
                    alt={image.name}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Документ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('chat.uploadSingleFile')}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          
          <label
            htmlFor="file-input"
            className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <div className="text-gray-500">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm">{t('chat.dragDropSingleFile')}</p>
            </div>
          </label>

          {file && (
            <div className="mt-2 flex items-center justify-between bg-gray-50 rounded px-2 py-1">
              <span className="text-sm truncate">{file.name}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Ошибка */}
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {/* Кнопки */}
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {t('chat.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? t('chat.uploading') : t('chat.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
