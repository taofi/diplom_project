'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import type { LicenseTypeResponse } from '@/types/license-type';

interface LicenseRowProps {
  license: {
    id: string;
    licenseTypeId: number;
    price: string;
  };
  licenseTypes: LicenseTypeResponse[];
  onUpdate: (id: string, field: 'licenseTypeId' | 'price', value: string | number) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export function LicenseRow({
  license,
  licenseTypes,
  onUpdate,
  onRemove,
  canRemove,
}: LicenseRowProps) {
  const { t } = useI18n();

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-1">
        <select
          value={license.licenseTypeId}
          onChange={(e) => onUpdate(license.id, 'licenseTypeId', Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {licenseTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>
              {lt.name || lt.slug}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex-1">
        <input
          type="number"
          value={license.price}
          onChange={(e) => onUpdate(license.id, 'price', e.target.value)}
          placeholder={t('admin.products.price')}
          min={0}
          step={0.01}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <button
        type="button"
        onClick={() => onRemove(license.id)}
        disabled={!canRemove}
        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ✕
      </button>
    </div>
  );
}
