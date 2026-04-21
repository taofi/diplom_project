'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card } from '@/components/ui';
import { Spinner } from '@/components/ui/Spinner';
import { UserProfileHeader } from './components/UserProfileHeader';
import { UserProductsSection } from './components/UserProductsSection';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useI18n } from '@/context/i18n/I18nContext';
import { getPublicUserProfile, type PublicUserProfileResponse } from '@/lib/api-user';
import { chatApi } from '@/lib/api-chat';
import { getProducts, type ProductResponse } from '@/lib/api-product';

function UserProfileContent() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = Number(params?.id);

  const [profile, setProfile] = useState<PublicUserProfileResponse | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);

  const isAuthor = useMemo(
    () => Array.isArray(profile?.roles) && !!profile?.roles?.includes('author'),
    [profile?.roles],
  );

  const loadProfile = useCallback(async () => {
    if (!Number.isFinite(userId) || userId <= 0) {
      setErrorCode(404);
      setLoading(false);
      return;
    }

    try {
      const data = await getPublicUserProfile(userId);
      setProfile(data);

      if (Array.isArray(data.roles) && data.roles.includes('author')) {
        const response = await getProducts({ sellerId: data.id, language: locale, limit: 50 });
        setProducts(response.data || []);
      } else {
        setProducts([]);
      }
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status || 500;
      setErrorCode(status);
    } finally {
      setLoading(false);
    }
  }, [locale, userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleStartChat = useCallback(async () => {
    if (!profile || isCreatingChat) {
      return;
    }

    try {
      setIsCreatingChat(true);
      const chat = await chatApi.createChat(profile.id);
      router.push(`/${locale}/chat?roomId=${chat.id}`);
    } finally {
      setIsCreatingChat(false);
    }
  }, [isCreatingChat, locale, profile, router]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-6">
        <div className="flex justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (errorCode || !profile) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-6">
        <Card padding="lg">
          <h2 className="text-2xl font-bold mb-3">{t('common.error')}</h2>
          <p className="text-gray-600">
            {errorCode === 403 ? 'Доступ к этому профилю запрещен' : 'Профиль не найден'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-16 pt-25 px-6">
      <div className="space-y-6">
        <UserProfileHeader
          profile={profile}
          isCreatingChat={isCreatingChat}
          onStartChat={handleStartChat}
          chatButtonLabel={isCreatingChat ? t('profile.downloading') : t('profile.write')}
        />

        <UserProductsSection
          isAuthor={isAuthor}
          products={products}
          isProductsExpanded={isProductsExpanded}
          onToggleExpanded={() => setIsProductsExpanded((prev) => !prev)}
        />
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <ProtectedRoute>
      <UserProfileContent />
    </ProtectedRoute>
  );
}
