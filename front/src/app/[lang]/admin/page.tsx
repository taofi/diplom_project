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
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/categories`,
      title: t('admin.categories.title') || 'Categories',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/licenses`,
      title: t('admin.licenseTypes.title') || 'License Types',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/users`,
      title: t('admin.tabs.users') || 'Users',
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

        {/* Navigation Links */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('admin.dashboard.sections') || 'Sections'}
          </h2>
          <div className="flex gap-6">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-4 p-4 w-full bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
              >
                {/* Компактный контейнер для иконки слева */}
                <div className="flex items-center justify-center shrink-0 w-10 h-10 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {link.icon}
                  </div>
                </div>

                {/* Текст справа, идеально выровнен по центру иконки */}
                <h3 className="text-base font-medium text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {link.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
