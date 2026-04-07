'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { Upload } from 'lucide-react';

interface MediaDropZoneProps {
  isUploading: boolean;
  dragActive: boolean;
  maxItems: number;
  maxSize: number;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function MediaDropZone({
  isUploading,
  dragActive,
  maxItems,
  maxSize,
  onDrag,
  onDrop,
  onFileInput,
}: MediaDropZoneProps) {
  const { t } = useI18n();

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragActive
          ? 'border-primary bg-primary/5'
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={onFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
      />

      <div className="flex flex-col items-center gap-2">
        {isUploading ? (
          <>
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Загрузка...</p>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-400" />
            <p className="text-sm text-gray-500">
              Перетащите медиа или нажмите для выбора
            </p>
            <p className="text-xs text-gray-400">
              Максимум {maxItems} файлов, до {maxSize}MB каждый
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default MediaDropZone;
