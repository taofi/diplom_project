'use client';

import Link from 'next/link';
import { useI18n } from '@/context/i18n/I18nContext';
import { ServerImage } from './Image';
import type { ProductResponse } from '@/types/product';
import { ProductType } from '@/types/product';

interface ProductCardProps {
  product: ProductResponse;
  className?: string;
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
  const { locale } = useI18n();

  // Используем mainImage или первое изображение из media
  const imageUrl = product.mainImage || product.media?.[0]?.url || null;
const formatPrice = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  return new Intl.NumberFormat('be-BY', {
    style: 'currency',
    currency: 'BYN',
    // Если нужно гарантировать 2 знака после запятой, можно добавить:
    minimumFractionDigits: 2,
  }).format(numPrice);
};
  const displayPrice = formatPrice(Number(product.discountPrice ?? product.price));

  return (
    <Link
      href={`/${locale}/product/${product.id}`}
      className={`block rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-white ${className}`}
    >
      {/* Контейнер изображения с относительным позиционированием для типа */}
      <div className="relative aspect-square w-full">
        <ServerImage
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
        />

        {/* Отображение типа в верхнем углу, как на фото */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 text-gray-600 bg-white bg-opacity-80 px-2 py-1 rounded-sm">
          {/* Иконка для типа */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#3A7B7B]" // Используем сине-зеленый из фото
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <circle cx="10" cy="13" r="3" />
          </svg>
          <span className="text-xs font-medium">
            {product.type === ProductType.BRUSH ? 'Кисть' : 'Иллюстрация'}
          </span>
        </div>
      </div>

      <div className="px-6 py-4 flex flex-row items-center justify-between">
        <h3 className="text-lg font-medium text-gray-950 truncate pr-4">
          {product.name}
        </h3>

        <div className="flex items-center gap-1.5 text-gray-600 bg-[#EBDAEB] px-3 py-1.5 rounded-sm flex-shrink-0">
          <span className="text-xl font-bold text-[#E298E2]">
            {displayPrice} 
          </span>
        </div>
      </div>
    </Link>
  );
}