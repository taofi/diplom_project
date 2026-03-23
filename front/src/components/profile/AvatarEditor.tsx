'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import Cropper from 'react-easy-crop';
import { uploadAvatar, updateProfile } from '@/lib/api-auth';
import { useAuth } from '@/context/auth/AuthContext';
import { useI18n } from '@/context/i18n/I18nContext';
import { Button } from '@/components/ui';
import { ServerImage } from '@/components/Image';

interface ProfileAvatarEditorProps {
  currentAvatar?: string | null;
  onAvatarChange?: (newAvatarUrl: string) => void;
}

export function ProfileAvatarEditor({ currentAvatar, onAvatarChange }: ProfileAvatarEditorProps) {
  const { updateUser } = useAuth();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
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

    // Проверка размера (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(t('profile.errors.fileTooLarge'));
      return;
    }

    // Создаем preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setSelectedFile(file);
      setIsEditing(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, [t]);

  // Создание обрезанного изображения
  const createCroppedImage = useCallback(async (imgSrc: string, zoomValue: number): Promise<File | null> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const image = new Image();
    image.src = imgSrc;
    
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    // Размер аватара
    const size = 256;
    canvas.width = size;
    canvas.height = size;

    // Центрирование и масштабирование
    const scale = zoomValue;
    const minDim = Math.min(image.width, image.height);
    const cropSize = minDim / scale;
    const centerX = image.width / 2;
    const centerY = image.height / 2;
    const sx = centerX - cropSize / 2;
    const sy = centerY - cropSize / 2;

    ctx.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, size, size);

    return new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'avatar.png', { type: 'image/png' });
          resolve(file);
        } else {
          resolve(null);
        }
      }, 'image/png');
    });
  }, []);

  // Сохранение аватара
  const handleSave = useCallback(async () => {
    if (!selectedFile || !imageSrc) return;

    setIsUploading(true);
    setError(null);

    try {
      // Создаем обрезанное изображение
      const croppedFile = await createCroppedImage(imageSrc, zoom);
      
      if (!croppedFile) {
        setError(t('profile.errors.uploadFailed'));
        setIsUploading(false);
        return;
      }

      // Загружаем аватар
      const { url } = await uploadAvatar(croppedFile);

      // Обновляем профиль
      const updatedUser = await updateProfile({ avatar_url: url });

      // Обновляем контекст
      updateUser(updatedUser);
      onAvatarChange?.(url);

      // Сбрасываем состояние
      setIsEditing(false);
      setSelectedFile(null);
      setImageSrc(null);
      setZoom(1);
      setIsUploading(false);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      setError(t('profile.errors.uploadFailed'));
      setIsUploading(false);
    }
  }, [selectedFile, imageSrc, zoom, createCroppedImage, updateUser, onAvatarChange, t]);

  // Отмена редактирования
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setSelectedFile(null);
    setImageSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setError(null);
  }, []);

  // Текущий аватар

  return (
    <div className="flex flex-col items-center">
      {/* Контейнер аватара */}
      {isEditing && imageSrc ? (
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            style={{
              containerStyle: { background: '#f0f0f0' },
              cropAreaStyle: { border: '2px solid white' },
            }}
          />
        </div>
      ) : (
        <div
          className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer border-4 border-gray-200 hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ServerImage
            src={currentAvatar || undefined}
            alt="Avatar"
            width={128}
            height={128}
            className="w-full h-full"
          />

          {/* Overlay при наведении */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-sm font-medium">
              {t('profile.changeAvatar')}
            </span>
          </div>
        </div>
      )}

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
              min={1}
              max={3}
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
              {isUploading ? t('common.loading') : t('common.save')}
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

// Экспорт как AvatarEditor для обратной совместимости
export { ProfileAvatarEditor as AvatarEditor };
