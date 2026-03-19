'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { Checkbox, Section } from '@/components/ui';

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
    <Section title={t('admin.products.status')}>
      <div className="flex gap-6">
        <Checkbox
          name="isActive"
          label={t('admin.products.active')}
          checked={isActive}
          onChange={onIsActiveChange}
        />

        <Checkbox
          name="isFeatured"
          label={t('admin.products.featured')}
          checked={isFeatured}
          onChange={onIsFeaturedChange}
        />
      </div>
    </Section>
  );
}
