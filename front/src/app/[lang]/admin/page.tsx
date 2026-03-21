'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { useAuth } from '@/context/auth/AuthContext';
import { Spinner } from '@/components/ui';
import { UsersTab } from '@/components/admin/UsersTab';
import { CategoriesLicensesTab } from '@/components/admin/CategoriesLicensesTab';

type TabType = 'categories-licenses' | 'users';

export default function AdminPage() {
  const { t, locale } = useI18n();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<TabType>('categories-licenses');

  // Check if user is admin
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }
    
    if (!user.roles.includes('admin')) {
      router.push(`/${locale}`);
    }
  }, [user, authLoading, locale, router]);

  if (!user) {
    return (
      <div className="min-h-screen mt-20 flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user.roles.includes('admin')) {
    return null;
  }

  return (
    <div className="min-h-screen mt-20 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('admin.title')}
          </h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('categories-licenses')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'categories-licenses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {t('admin.tabs.categoriesLicenses')}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {t('admin.tabs.users')}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'categories-licenses' && (
            <CategoriesLicensesTab />
          )}
          
          {activeTab === 'users' && (
            <UsersTab />
          )}
        </div>
      </div>
    </div>
  );
}
