'use client';

import { useI18n } from '@/context/i18n/I18nContext';

interface ProductInfoProps {
  name: string;
  description: string | null;
  seller?: { id: number; username: string };
  isFeatured: boolean;
  categories?: Array<{ id: number; name: string }>;
  productType?: string;
}

export function ProductInfo({
  name,
  productType,
}: ProductInfoProps) {
  const { t } = useI18n();

  return (
    <div>
      {/* Заголовок и метаданные */}
      <div className="mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          {name}
        </h1>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Тип товара */}
          {productType && (
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {productType === 'brush'
                ? t('product.types.brush')
                : t('product.types.illustration')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
