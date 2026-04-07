'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { Image as ImageIcon } from 'lucide-react';
import {
  uploadTempMedia,
  isValidMediaType,
  UploadResult,
  MAX_MEDIA_UPLOAD_SIZE_MB,
} from '@/lib/api-upload';
import { toastError, toastSuccess } from '@/lib/toast';
import { MediaItemCard } from './MediaItemCard';
import { MediaDropZone } from './MediaDropZone';
import type { UpdateMediaItem } from '@/types/product';
import { MediaType } from '@/types/product';

export interface MediaItem {
  url: string;
  tempUrl?: string;
  isCover: boolean;
  isNew: boolean;
  mediaType: MediaType;
  id?: number; // ID медиа для существующих элементов
}

interface MediaUploaderProps {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  onMediaChange?: (changes: { updatedMedia: UpdateMediaItem[]; deletedMediaIds: number[] }) => void;
  maxItems?: number;
  maxSize?: number; // в MB
}

export function MediaUploader({
  value = [],
  onChange,
  onMediaChange,
  maxItems = 10,
  maxSize = MAX_MEDIA_UPLOAD_SIZE_MB,
}: MediaUploaderProps) {
  const { t } = useI18n();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Проверка количества
      if (value.length + fileArray.length > maxItems) {
        toastError(
          'Ошибка',
          `Максимальное количество изображений: ${maxItems}`,
        );
        return;
      }

      setIsUploading(true);

      try {
        const newItems: MediaItem[] = [];

        for (const file of fileArray) {
          // Проверка типа
          if (!isValidMediaType(file)) {
            toastError('Ошибка', 'Недопустимый тип файла');
            continue;
          }

          // Проверка размера
          if (file.size > maxSize * 1024 * 1024) {
            toastError(
              'Ошибка',
              `Размер файла не должен превышать ${maxSize}MB`,
            );
            continue;
          }

          // Загрузка
          const result = await uploadTempMedia(file);
          const uploadResult = result as unknown as UploadResult;

          newItems.push({
            url: uploadResult.url,
            tempUrl: uploadResult.url,
            isCover:
              file.type.startsWith('image/') &&
              value.length === 0 &&
              newItems.length === 0,
            isNew: true,
            mediaType: file.type.startsWith('video/')
              ? MediaType.VIDEO
              : MediaType.IMAGE,
          });
        }

        if (newItems.length > 0) {
          onChange([...value, ...newItems]);
          toastSuccess('Успешно', 'Медиа загружены');
        }
      } catch (error) {
        console.error('Upload error:', error);
        toastError('Ошибка', 'Не удалось загрузить медиа');
      } finally {
        setIsUploading(false);
      }
    },
    [value, maxItems, maxSize, onChange],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [handleUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleUpload(e.target.files);
      }
    },
    [handleUpload],
  );

  const handleRemove = useCallback(
    (index: number) => {
      const removedItem = value[index];
      const newItems = value.filter((_, i) => i !== index);
      
      // Если удалили cover, сделать первое изображение cover
      if (
        removedItem.isCover &&
        newItems.length > 0 &&
        !newItems[0].isCover
      ) {
        const firstImageIndex = newItems.findIndex(
          (item) => item.mediaType === MediaType.IMAGE,
        );
        if (firstImageIndex >= 0) {
          newItems[firstImageIndex].isCover = true;
        }
      }
      
      onChange(newItems);
      
      // Вызвать колбек изменений для существующих медиа
      if (onMediaChange && removedItem.id && !removedItem.isNew) {
        onMediaChange({
          updatedMedia: [],
          deletedMediaIds: [removedItem.id],
        });
      }
    },
    [value, onChange, onMediaChange],
  );

  const handleSetCover = useCallback(
    (index: number) => {
      if (value[index]?.mediaType !== MediaType.IMAGE) {
        toastError('Ошибка', 'Обложкой может быть только изображение');
        return;
      }

      const newItems = value.map((item, i) => ({
        ...item,
        isCover: i === index,
      }));
      onChange(newItems);

      // Вызвать колбек изменений для существующих медиа
      if (onMediaChange) {
        const changedItem = value[index];
        
        // Если изменяемое медиа уже существует (не новое), отправляем изменение
        if (changedItem.id && !changedItem.isNew) {
          onMediaChange({
            updatedMedia: [{ id: changedItem.id, isCover: true }],
            deletedMediaIds: [],
          });
        }
      }
    },
    [value, onChange, onMediaChange],
  );

  const canAddMore = value.length < maxItems;

  return (
    <div className="space-y-4">
      {/* Загрузочная зона */}
      {canAddMore && (
        <MediaDropZone
          isUploading={isUploading}
          dragActive={dragActive}
          maxItems={maxItems}
          maxSize={maxSize}
          onDrag={handleDrag}
          onDrop={handleDrop}
          onFileInput={handleFileInput}
        />
      )}

      {/* Галерея изображений */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {value.map((item, index) => (
            <MediaItemCard
              key={item.url + index}
              item={item}
              index={index}
              onRemove={handleRemove}
              onSetCover={handleSetCover}
            />
          ))}
        </div>
      )}

      {/* Пустое состояние */}
      {value.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>{t('admin.products.noMedia') || 'Нет загруженных медиа'}</p>
        </div>
      )}
    </div>
  );
}

export default MediaUploader;
