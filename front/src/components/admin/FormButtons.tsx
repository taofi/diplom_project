'use client';

import { useI18n } from '@/context/i18n/I18nContext';

interface FormButtonsProps {
  loading: boolean;
  onCancel: () => void;
}

export function FormButtons({ loading, onCancel }: FormButtonsProps) {
  const { t } = useI18n();

  return (
    <div className="flex gap-4">
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? t('common.loading') : t('admin.products.create')}
      </button>
      
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
      >
        {t('common.cancel')}
      </button>
    </div>
  );
}
