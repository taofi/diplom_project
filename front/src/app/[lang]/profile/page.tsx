'use client';

import { useAuth } from '@/context/auth/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useI18n } from '@/context/i18n/I18nContext';
import { Button, Card } from '@/components/ui';
import { PurchasedProducts } from '@/components/profile/PurchasedProducts';
import { AvatarEditor, UserInfo } from '@/components/profile';

function ProfileContent() {
  const { user, logout, isAdmin } = useAuth();
  const { t, locale } = useI18n();

  return (
    <div className="w-full">
      <div className="max-w-6xl mt-20 mx-auto py-12 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - профиль */}
          <div className="lg:col-span-1">
            <Card padding="lg">
              <h2 className="text-2xl font-bold mb-6 text-center text-primary">
                {t('profile.profileInformation')}
              </h2>
              
              {/* Аватар */}
              <AvatarEditor currentAvatar={user?.avatar_url} />
              
              {/* Имя и email */}
              <div className="mt-6">
                <UserInfo />
              </div>

              {/* Кнопки действий */}
              <div className="mt-8 text-center space-y-3">
                {isAdmin && (
                  <a
                    href={`/${locale}/admin/products`}
                    className="block"
                  >
                    <Button variant="primary">
                      {t('nav.dashboard')}
                    </Button>
                  </a>
                )}
                <Button variant="danger" onClick={logout}>
                  {t('auth.logout')}
                </Button>
              </div>
            </Card>
          </div>

          {/* Правая колонка - покупки */}
          <div className="lg:col-span-2">
            <PurchasedProducts />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
