'use client';

import { useAuth } from '@/context/auth/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useI18n } from '@/context/i18n/I18nContext';
import { Button, Card } from '@/components/ui';

function ProfileContent() {
  const { user, logout, isAdmin } = useAuth();
  const { t, locale } = useI18n();

  return (
    <div className="w-full">
      <div className="max-w-4xl  mx-auto py-12 px-6">
        <Card padding="lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-primary">
            {t('profile.profileInformation')}
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="font-medium text-gray-600">{t('profile.name')}:</span>
              <span className="text-gray-900">{user?.name}</span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="font-medium text-gray-600">{t('profile.email')}:</span>
              <span className="text-gray-900">{user?.email}</span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="font-medium text-gray-600">{t('profile.role')}:</span>
              <span className="text-gray-900">{user?.roles?.join(', ')}</span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="font-medium text-gray-600">{t('profile.locale')}:</span>
              <span className="text-gray-900">{user?.locale}</span>
            </div>
          </div>

          <div className="mt-8 text-center">
            {isAdmin && (
              <a
                href={`/${locale}/admin/products`}
                className="inline-block mr-4"
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
