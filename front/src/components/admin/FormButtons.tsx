'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { Button } from '@/components/ui';

interface FormButtonsProps {
  mode?: 'create' | 'edit';
  loading: boolean;
  onCancel: () => void;
}

export function FormButtons({ mode = 'create', loading, onCancel }: FormButtonsProps) {
  const { t } = useI18n();

  const submitText = mode === 'edit' 
    ? t('admin.products.update') 
    : t('admin.products.create');

  return (
    <div className="flex gap-4">
      <Button type="submit" loading={loading}>
        {loading ? t('common.loading') : submitText}
      </Button>
      
      <Button type="button" variant="secondary" onClick={onCancel}>
        {t('common.cancel')}
      </Button>
    </div>
  );
}
