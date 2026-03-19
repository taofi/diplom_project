'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import type { LicenseTypeResponse } from '@/types/license-type';
import { LicenseRow } from './LicenseRow';
import { Button, Section } from '@/components/ui';

interface LicenseFormItem {
  id: string;
  licenseTypeId: number;
  price: string;
}

interface LicenseManagerProps {
  licenses: LicenseFormItem[];
  licenseTypes: LicenseTypeResponse[];
  onAdd: () => void;
  onUpdate: (id: string, field: 'licenseTypeId' | 'price', value: string | number) => void;
  onRemove: (id: string) => void;
}

export function LicenseManager({
  licenses,
  licenseTypes,
  onAdd,
  onUpdate,
  onRemove,
}: LicenseManagerProps) {
  const { t } = useI18n();

  return (
    <Section title={t('admin.products.licenses')}>
      <div className="flex justify-end mb-4">
        <Button type="button" size="sm" onClick={onAdd}>
          {t('admin.products.addLicense')}
        </Button>
      </div>

      <div className="space-y-3">
        {licenses.map((license) => (
          <LicenseRow
            key={license.id}
            license={license}
            licenseTypes={licenseTypes}
            onUpdate={onUpdate}
            onRemove={onRemove}
            canRemove={licenses.length > 1}
          />
        ))}
      </div>
    </Section>
  );
}
