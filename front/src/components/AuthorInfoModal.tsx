'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Modal, Button, Spinner } from '@/components/ui';
import { UserAvatarIcon } from '@/components/UserAvatarIcon';
import { getPublicUserProfile, type PublicUserProfileResponse } from '@/lib/api-user';
import { useI18n } from '@/context/i18n/I18nContext';

interface AuthorInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorId: number | null;
  fallbackName?: string;
}

export function AuthorInfoModal({
  isOpen,
  onClose,
  authorId,
  fallbackName,
}: AuthorInfoModalProps) {
  const { locale } = useI18n();
  const [author, setAuthor] = useState<PublicUserProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !authorId) return;

    let active = true;
    setLoading(true);

    getPublicUserProfile(authorId)
      .then((data) => {
        if (!active) return;
        setAuthor(data);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authorId, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setAuthor(null);
      setLoading(false);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Автор" size="sm">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <UserAvatarIcon
              avatarUrl={author?.avatar_url}
              name={author?.name ?? fallbackName}
              size={56}
            />
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-gray-900">
                {author?.name ?? fallbackName ?? 'Автор'}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {author?.description ?? 'Описание отсутствует'}
              </p>
            </div>
          </div>

          {authorId && (
            <Link href={`/${locale}/users/${authorId}`} onClick={onClose} className="block">
              <Button variant="primary" className="w-full">
                Перейти к автору
              </Button>
            </Link>
          )}
        </div>
      )}
    </Modal>
  );
}

