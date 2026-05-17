'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { useAuth } from '@/context/auth/AuthContext';
import { Spinner } from '@/components/ui';
import { CategoriesLicensesTab } from '@/components/admin/CategoriesLicensesTab';

export default function AdminCategoriesPage() {
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

  return (
    <div className="min-h-screen mt-20 py-8">
      <div className="max-w-7xl mx-auto px-6">
          {/* Content */}
        <div className="mt-6">
          <CategoriesLicensesTab hideSubTabs={true} activeSubTab="categories" />
        </div>
      </div>
    </div>
  );
}