'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { Button } from '@/components/ui';
import {
  Upload,
  X,
  File,
  Download,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  uploadTempFile,
  isValidFileType,
  formatFileSize,
  isTempUrl,
} from '@/lib/api-upload';
import { toastError, toastSuccess } from '@/lib/toast';

interface FileUploaderProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  maxSize?: number; // в MB
  label?: string;
}

export function FileUploader({
  value,
  onChange,
  accept,
  maxSize = 50,
  label,
}: FileUploaderProps) {
  const { t } = useI18n();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      // Проверка типа
      if (accept && !file.type.includes(accept.replace('*', ''))) {
        toastError('Ошибка', 'Недопустимый тип файла');
        return;
      }

      // Проверка размера
      if (file.size > maxSize * 1024 * 1024) {
        toastError(
          'Ошибка',
          `Размер файла не должен превышать ${maxSize}MB`,
        );
        return;
      }

      // Проверка типа (если не задан accept)
      if (!accept && !isValidFileType(file)) {
        toastError('Ошибка', 'Недопустимый тип файла');
        return;
      }

      setIsUploading(true);
      setProgress(0);

      try {
        // Имитация прогресса
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        const result = await uploadTempFile(file);

        clearInterval(progressInterval);
        setProgress(100);

        onChange(result.url);
        toastSuccess('Успешно', 'Файл загружен');
      } catch (error) {
        console.error('Upload error:', error);
        toastError('Ошибка', 'Не удалось загрузить файл');
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [accept, maxSize, onChange],
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
        handleUpload(e.dataTransfer.files[0]);
      }
    },
    [handleUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleUpload(e.target.files[0]);
      }
    },
    [handleUpload],
  );

  const handleRemove = useCallback(() => {
    onChange('');
  }, [onChange]);

  const hasFile = Boolean(value);

  return (
    <div className="space-y-3">
      {/* Область загрузки или карточка файла */}
      {hasFile ? (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-4">
            {/* Иконка файла */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <File className="w-6 h-6 text-primary" />
              </div>
            </div>

            {/* Информация о файле */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {value.split('/').pop() || 'Файл'}
              </p>
              {isTempUrl(value) && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Временный файл
                </span>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="flex items-center gap-2">
              {/* Кнопка заменить */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept={accept}
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={isUploading}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  {t('admin.products.replace') || 'Заменить'}
                </Button>
              </label>

              {/* Кнопка удалить */}
              <Button
                variant="danger"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {t('common.delete') || 'Удалить'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <>
                <div className="w-10 h-10 relative">
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-sm text-gray-500">Загрузка... {progress}%</p>
                {/* Прогресс бар */}
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400" />
                <p className="text-sm text-gray-500">
                  Перетащите файл или нажмите для выбора
                </p>
                <p className="text-xs text-gray-400">
                  Максимальный размер: {maxSize}MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Подсказка */}
      {!hasFile && (
        <p className="text-xs text-gray-500 text-center">
          {label ||
            'Загрузите основной файл продукта (PSD, AI, PDF, ZIP и т.д.)'}
        </p>
      )}
    </div>
  );
}

export default FileUploader;
