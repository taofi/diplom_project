'use client';

import Link from 'next/link';
import { useI18n } from '@/context/i18n/I18nContext';
import type { SellerInfo, CategoryInfo } from '@/types/product';

interface ProductInfoProps {
  name: string;
  description: string | null;
  seller?: SellerInfo;
  isFeatured: boolean;
  categories?: CategoryInfo[];
  productType?: string;
}

export function ProductInfo({
  name,
  description,
  seller,
  isFeatured,
  categories,
  productType,
}: ProductInfoProps) {
  const { t, locale } = useI18n();

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

          {/* Продавец */}
          {seller && (
            <Link
              href={`/${locale}/author/${seller.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>{seller.username}</span>
            </Link>
          )}

          {/* Featured */}
          {isFeatured && (
            <span className="inline-flex items-center gap-1 bg-yellow-400 text-white px-2 py-1 rounded text-sm font-medium">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {t('product.featured') || 'Featured'}
            </span>
          )}
        </div>
      </div>

      {/* Категории */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/${locale}/catalog?category=${cat.id}`}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-700 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* Описание */}
      {description && (
        <div className="prose prose-sm max-w-none">
          <h2 className="text-lg font-semibold mb-2">
            {t('product.description') || 'Описание'}
          </h2>
          <div
            className="text-gray-600"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      )}
    </div>
  );
}
