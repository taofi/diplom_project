'use client';

import { useState, useCallback } from 'react';
import { updateProfile } from '@/lib/api-auth';
import { useAuth } from '@/context/auth/AuthContext';
import { useI18n } from '@/context/i18n/I18nContext';
import { Button } from '@/components/ui';

export function UserInfo() {
  const { user, updateUser } = useAuth();
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Начало редактирования
  const handleStartEdit = useCallback(() => {
    setName(user?.name || '');
    setIsEditing(true);
    setError(null);
  }, [user?.name]);

  // Отмена редактирования
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setName(user?.name || '');
    setError(null);
  }, [user?.name]);

  // Сохранение имени
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError(t('profile.errors.nameRequired'));
      return;
    }

    if (name.trim() === user?.name) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedUser = await updateProfile({ name: name.trim() });
      updateUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update name:', err);
      setError(t('profile.errors.updateFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [name, user?.name, updateUser, t]);

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
        <div className="mb-2">
          <h3
            className="text-xl font-bold text-gray-900 cursor-pointer hover:text-primary transition-colors inline-block"
            onClick={handleStartEdit}
            title={t('profile.clickToEdit')}
          >
            {user?.name}
          </h3>
        </div>
      )}

      {/* Email */}
      <p className="text-gray-600">{user?.email}</p>
    </div>
  );
}
