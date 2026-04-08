'use client';

import { useState, useCallback, useEffect } from 'react';
import { updateProfile } from '@/lib/api-auth';
import { useAuth } from '@/context/auth/AuthContext';
import { useI18n } from '@/context/i18n/I18nContext';
import { Button } from '@/components/ui';

export function UserInfo() {
  const { user, updateUser } = useAuth();
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [description, setDescription] = useState(user?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing && user) {
      setName(user.name || '');
      setDescription(user.description || '');
    }
  }, [user?.name, user?.description, isEditing, user]);

  // Начало редактирования
  const handleStartEdit = useCallback(() => {
    setName(user?.name || '');
    setDescription(user?.description || '');
    setIsEditing(true);
    setError(null);
  }, [user?.name, user?.description]);

  // Отмена редактирования
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setName(user?.name || '');
    setDescription(user?.description || '');
    setError(null);
  }, [user?.name, user?.description]);

  // Сохранение имени
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError(t('profile.errors.nameRequired'));
      return;
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (trimmedName === user?.name && trimmedDescription === (user?.description || '')) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedUser = await updateProfile({
        name: trimmedName,
        description: trimmedDescription,
      });
      updateUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update name:', err);
      setError(t('profile.errors.updateFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [name, description, user?.name, user?.description, updateUser, t]);

  // Обработчик нажатия Enter
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  return (
    <div className="text-center">
      {/* Имя пользователя */}
      {isEditing ? (
        <div className="mb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('profile.name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-center font-bold"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('profile.description')}
            rows={4}
            className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
          <div className="flex gap-2 justify-center mt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {t('common.save')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-2 space-y-2">
          <h3
            className="text-xl font-bold text-gray-900 cursor-pointer hover:text-primary transition-colors inline-block"
            onClick={handleStartEdit}
            title={t('profile.clickToEdit')}
          >
            {user?.name}
          </h3>
          <div>
            <Button variant="secondary" size="sm" type="button" onClick={handleStartEdit}>
              {t('profile.editProfile')}
            </Button>
          </div>
        </div>
      )}

      {/* Email */}
      <p className="text-gray-600">{user?.email}</p>

      {/* Описание: всегда видно в режиме просмотра; пустое — с приглашением добавить */}
      {!isEditing && (
        <div className="mt-4 text-left w-full max-w-md mx-auto">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
            {t('profile.description')}
          </span>
          {user?.description?.trim() ? (
            <p className="text-gray-700 whitespace-pre-wrap wrap-break-word text-sm border border-gray-100 rounded-md p-3 bg-gray-50">
              {user.description}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleStartEdit}
              className="w-full text-left text-sm text-gray-500 border border-dashed border-gray-200 rounded-md p-3 hover:border-primary hover:text-primary transition-colors"
            >
              {t('profile.noDescriptionHint')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
