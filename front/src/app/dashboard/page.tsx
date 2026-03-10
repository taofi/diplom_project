'use client';

import { useAuth } from '@/context/auth/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useI18n } from '@/context/i18n/I18nContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function DashboardContent() {
  const { user, logout } = useAuth();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">{t('nav.dashboard')}</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4">{user?.name}</span>
              <LanguageSwitcher />
              <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                {t('auth.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">{t('profile.profileInformation')}</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">{t('profile.name')}:</span> {user?.name}
              </p>
              <p>
                <span className="font-medium">{t('profile.email')}:</span> {user?.email}
              </p>
              <p>
                <span className="font-medium">{t('profile.role')}:</span> {user?.role}
              </p>
              <p>
                <span className="font-medium">{t('profile.locale')}:</span> {user?.locale}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
