'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { ProductType } from '@/types/product';

interface BasicInfoSectionProps {
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  type: ProductType;
  onTypeChange: (value: ProductType) => void;
  sku: string;
  onSkuChange: (value: string) => void;
}

export function BasicInfoSection({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  type,
  onTypeChange,
  sku,
  onSkuChange,
}: BasicInfoSectionProps) {
  const { t } = useI18n();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">{t('admin.products.basicInfo')}</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('admin.products.name')} *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('admin.products.description')}
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('admin.products.type')} *
            </label>
            <select
              value={type}
              onChange={(e) => onTypeChange(e.target.value as ProductType)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={ProductType.BRUSH}>{t('product.types.brush')}</option>
              <option value={ProductType.ILLUSTRATION}>{t('product.types.illustration')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              SKU
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => onSkuChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
