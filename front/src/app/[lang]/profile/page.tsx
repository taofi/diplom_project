'use client';

import { useAuth } from '@/context/auth/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useI18n } from '@/context/i18n/I18nContext';
import { Hero } from '@/components/Hero';

function ProfileContent() {
  const { user, logout } = useAuth();
  const { t } = useI18n();

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white rounded-lg shadow-md p-8">
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
              <span className="text-gray-900">{user?.role}</span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="font-medium text-gray-600">{t('profile.locale')}:</span>
              <span className="text-gray-900">{user?.locale}</span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={logout}
              className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition-colors"
            >
              {t('auth.logout')}
            </button>
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
