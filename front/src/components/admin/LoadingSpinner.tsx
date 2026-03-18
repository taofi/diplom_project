'use client';

import { useI18n } from '@/context/i18n/I18nContext';

export function LoadingSpinner() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">{t('common.loading')}</div>
    </div>
  );
}
