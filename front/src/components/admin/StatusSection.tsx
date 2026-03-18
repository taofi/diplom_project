'use client';

import { useI18n } from '@/context/i18n/I18nContext';

interface StatusSectionProps {
  isActive: boolean;
  onIsActiveChange: (value: boolean) => void;
  isFeatured: boolean;
  onIsFeaturedChange: (value: boolean) => void;
}

export function StatusSection({
  isActive,
  onIsActiveChange,
  isFeatured,
  onIsFeaturedChange,
}: StatusSectionProps) {
  const { t } = useI18n();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">{t('admin.products.status')}</h2>
      
      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => onIsActiveChange(e.target.checked)}
            className="w-4 h-4 text-primary"
          />
          <span>{t('admin.products.active')}</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => onIsFeaturedChange(e.target.checked)}
            className="w-4 h-4 text-primary"
          />
          <span>{t('admin.products.featured')}</span>
        </label>
      </div>
    </div>
  );
}
