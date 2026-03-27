'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import type { LicenseTypeResponse } from '@/types/license-type';
import { Select, Input, Button } from '@/components/ui';

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

  const typeOptions = licenseTypes.map(lt => ({
    value: lt.id,
    label: lt.name || lt.slug,
  }));

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-1">
        <Select
          name={`licenseType-${license.id}`}
          value={license.licenseTypeId}
          onChange={(value) => onUpdate(license.id, 'licenseTypeId', Number(value))}
          options={typeOptions}
        />
      </div>
      
      <div className="flex-1">
        <Input
          type="number"
          name={`price-${license.id}`}
          value={license.price}
          onChange={(value) => {
      // 1. Заменяем запятую на точку (удобно для разных раскладок)
      const formattedValue = value.replace(',', '.');

      // 2. Разрешаем: пустую строку, только цифры, 
      // или цифры с одной точкой (включая точку в конце)
      if (formattedValue === '' || /^\d*\.?\d*$/.test(formattedValue)) {
        onUpdate(license.id, 'price', formattedValue);
      }
    }}
          placeholder={t('admin.products.price')}
          min={0}
          step={0.01}
          decimals={2}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => onRemove(license.id)}
        disabled={!canRemove}
        className="px-3"
      >
        ✕
      </Button>
    </div>
  );
}
