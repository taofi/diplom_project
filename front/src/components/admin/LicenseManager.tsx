'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import type { LicenseTypeResponse } from '@/types/license-type';
import { LicenseRow } from './LicenseRow';

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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t('admin.products.licenses')}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
        >
          {t('admin.products.addLicense')}
        </button>
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
    </div>
  );
}
