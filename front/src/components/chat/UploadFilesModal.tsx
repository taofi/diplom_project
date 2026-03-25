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
  const [preview, setPreview] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const previewInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const handlePreviewSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(file);
    }
  }, []);

  const handleFilesSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleRemovePreview = useCallback(() => {
    setPreview(null);
    if (previewInputRef.current) {
      previewInputRef.current.value = '';
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!offer) {
      setError('No offer selected');
      return;
    }

    // Валидация: должен быть хотя бы один файл (превью или исходные)
    if (!preview && files.length === 0) {
      setError(t('chat.uploadError'));
      return;
    }

    setError(null);
    setLoading(true);
    
    try {
      const result = await chatApi.uploadOfferFiles(offer.id, preview, files);
      onSuccess?.(result);
      handleClose();
    } catch (err) {
      setError(t('chat.uploadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPreview(null);
    setFiles([]);
    setError(null);
    if (previewInputRef.current) {
      previewInputRef.current.value = '';
    }
    if (filesInputRef.current) {
      filesInputRef.current.value = '';
    }
    onClose();
  };

  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('chat.uploadFiles')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Превью */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('chat.uploadPreview')}
          </label>
          <input
            ref={previewInputRef}
            type="file"
            accept="image/*"
            onChange={handlePreviewSelect}
            className="hidden"
            id="preview-input"
          />
          
          {preview ? (
            <div className="relative inline-block">
              <img
                src={createPreviewUrl(preview)}
                alt="Preview"
                className="max-w-full h-auto rounded max-h-40 object-contain border"
              />
              <button
                type="button"
                onClick={handleRemovePreview}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ) : (
            <label
              htmlFor="preview-input"
              className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <div className="text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">{t('chat.dragDropPreview')}</p>
              </div>
            </label>
          )}
        </div>

        {/* Исходные файлы */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('chat.uploadSourceFiles')}
          </label>
          <input
            ref={filesInputRef}
            type="file"
            multiple
            onChange={handleFilesSelect}
            className="hidden"
            id="files-input"
          />
          
          <label
            htmlFor="files-input"
            className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <div className="text-gray-500">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm">{t('chat.dragDropFiles')}</p>
            </div>
          </label>

          {/* Список выбранных файлов */}
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                {files.length} {t('chat.filesSelected')}
              </p>
              <ul className="space-y-1 max-h-32 overflow-y-auto">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                    <span className="text-sm truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
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
