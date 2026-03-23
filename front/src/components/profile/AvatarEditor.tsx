'use client';

import { useState, useRef, useCallback } from 'react';
import { uploadAvatar, updateProfile } from '@/lib/api-auth';
import { useAuth } from '@/context/auth/AuthContext';
import { useI18n } from '@/context/i18n/I18nContext';
import { Button } from '@/components/ui';

interface AvatarEditorProps {
  currentAvatar?: string | null;
  onAvatarChange?: (newAvatarUrl: string) => void;
}

export function AvatarEditor({ currentAvatar, onAvatarChange }: AvatarEditorProps) {
  const { user, updateUser } = useAuth();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Обработчик выбора файла
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      setError(t('profile.errors.invalidFileType'));
      return;
    }

    // Проверка размера (макс 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError(t('profile.errors.fileTooLarge'));
      return;
    }

    setError(null);
    setSelectedFile(file);
    setIsEditing(true);

    // Создаем preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [t]);

  // Сохранение аватара
  const handleSave = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // Загружаем аватар
      const { url } = await uploadAvatar(selectedFile);

      // Обновляем профиль
      const updatedUser = await updateProfile({ avatar_url: url });

      // Обновляем контекст
      updateUser(updatedUser);
      onAvatarChange?.(url);

      // Сбрасываем состояние
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setZoom(1);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      setError(t('profile.errors.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, updateUser, onAvatarChange, t]);

  // Отмена редактирования
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setZoom(1);
    setError(null);
  }, []);

  // Текущий аватар (из preview или текущий)
  const displayAvatar = previewUrl || currentAvatar || '/noimage.png';

  return (
    <div className="flex flex-col items-center">
      {/* Контейнер аватара */}
      <div
        className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer border-4 border-gray-200 hover:border-primary transition-colors"
        onClick={() => !isEditing && fileInputRef.current?.click()}
      >
        <img
          src={displayAvatar}
          alt="Avatar"
          className="w-full h-full object-cover"
          style={{
            transform: `scale(${zoom})`,
          }}
        />

        {/* Overlay при наведении */}
        {!isEditing && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-sm font-medium">
              {t('profile.changeAvatar')}
            </span>
          </div>
        )}

        {/* Индикатор загрузки */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Скрытый input для файла */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Панель редактирования */}
      {isEditing && (
        <div className="mt-4 w-full max-w-xs">
          {/* Slider зума */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.zoom')}: {zoom.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Ошибка */}
          {error && (
            <p className="text-red-500 text-sm mb-3">{error}</p>
          )}

          {/* Кнопки */}
          <div className="flex gap-2 justify-center">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isUploading}
            >
              {t('common.save')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              disabled={isUploading}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
