'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { Button } from '@/components/ui';

interface FormButtonsProps {
  loading: boolean;
  onCancel: () => void;
}

export function FormButtons({ loading, onCancel }: FormButtonsProps) {
  const { t } = useI18n();

  return (
    <div className="flex gap-4">
      <Button type="submit" loading={loading}>
        {loading ? t('common.loading') : t('admin.products.create')}
      </Button>
      
      <Button type="button" variant="secondary" onClick={onCancel}>
        {t('common.cancel')}
      </Button>
    </div>
  );
}
