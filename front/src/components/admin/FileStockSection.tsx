'use client';

import { useI18n } from '@/context/i18n/I18nContext';

interface FileStockSectionProps {
  fileUrl: string;
  onFileUrlChange: (value: string) => void;
  price: string;
  onPriceChange: (value: string) => void;
  stock: number;
  onStockChange: (value: number) => void;
  discountPrice: string;
  onDiscountPriceChange: (value: string) => void;
}

export function FileStockSection({
  fileUrl,
  onFileUrlChange,
  price,
  onPriceChange,
  stock,
  onStockChange,
  discountPrice,
  onDiscountPriceChange,
}: FileStockSectionProps) {
  const { t } = useI18n();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">{t('admin.products.fileStock')}</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('admin.products.fileUrl')} *
          </label>
          <input
            type="url"
            value={fileUrl}
            onChange={(e) => onFileUrlChange(e.target.value)}
            required
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('admin.products.price')} *
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              required
              min={0}
              step={0.01}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('admin.products.stock')}
            </label>
            <input
              type="number"
              value={stock}
              onChange={(e) => onStockChange(Number(e.target.value))}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('admin.products.discountPrice')}
            </label>
            <input
              type="number"
              value={discountPrice}
              onChange={(e) => onDiscountPriceChange(e.target.value)}
              min={0}
              step={0.01}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
