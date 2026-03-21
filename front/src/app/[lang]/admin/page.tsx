'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/context/i18n/I18nContext';
import { useAuth } from '@/context/auth/AuthContext';
import { Spinner } from '@/components/ui';

export default function AdminPage() {
  const { t, locale } = useI18n();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

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

  const adminLinks = [
    {
      href: `/${locale}/admin/products`,
      title: t('admin.products.title') || 'Products Management',
      description: t('admin.products.description') || 'Manage products, create new products, edit existing ones',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/categories-licenses`,
      title: t('admin.tabs.categoriesLicenses') || 'Categories & Licenses',
      description: t('admin.categoriesLicenses.description') || 'Manage categories and license types',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/users`,
      title: t('admin.tabs.users') || 'Users',
      description: t('admin.users.description') || 'Manage users and their roles',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen mt-20 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('admin.title')}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('admin.dashboard.description') || 'Manage your application from this panel'}
          </p>
        </div>

        {/* Statistics Section - Coming Soon */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('admin.dashboard.statistics') || 'Statistics'}
          </h2>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <p className="text-lg font-medium">
              {t('admin.comingSoon') || 'Coming soon'}
            </p>
            <p className="text-blue-100 mt-1">
              {t('admin.dashboard.statisticsComingSoon') || 'Statistics will be available here'}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('admin.dashboard.sections') || 'Sections'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
              >
                <div className="flex items-center justify-center w-14 h-14 bg-blue-50 rounded-lg text-blue-600 mb-4 group-hover:bg-blue-100 transition-colors">
                  {link.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {link.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
