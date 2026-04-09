'use client';

import Link from 'next/link';
import { useI18n } from '@/context/i18n/I18nContext';
import { ServerImage } from './Image';
import type { ProductResponse } from '@/types/product';
import { ProductType } from '@/types/product';
import { formatPrice } from '@/utils/price';

interface ProductCardProps {
  product: ProductResponse;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const cardSizeClasses = {
  sm: {
    wrapper: 'max-w-[190px]',
    badge: 'top-1.5 right-1.5 gap-1 px-1.5 py-0.5',
    icon: 10,
    typeText: 'text-[9px]',
    content: 'px-2 py-1.5',
    title: 'text-xs pr-1.5',
    priceWrap: 'gap-1 px-1.5 py-0.5',
    priceText: 'text-sm',
    oldPriceText: 'text-[9px]',
  },
  md: {
    wrapper: 'max-w-[240px]',
    badge: 'top-2 right-2 gap-1 px-1.5 py-0.5',
    icon: 12,
    typeText: 'text-[10px]',
    content: 'px-3 py-2',
    title: 'text-sm pr-2',
    priceWrap: 'gap-1 px-2 py-1',
    priceText: 'text-base',
    oldPriceText: 'text-[10px]',
  },
  lg: {
    wrapper: 'max-w-[300px]',
    badge: 'top-3 right-3 gap-1.5 px-2 py-1',
    icon: 14,
    typeText: 'text-xs',
    content: 'px-4 py-3',
    title: 'text-base pr-3',
    priceWrap: 'gap-1.5 px-2.5 py-1.5',
    priceText: 'text-xl',
    oldPriceText: 'text-xs',
  },
} as const;

export function ProductCard({ product, className = '', size = 'md' }: ProductCardProps) {
  const { locale } = useI18n();
  const sizeConfig = cardSizeClasses[size];

  // Используем mainImage или первое изображение из media
  const imageUrl = product.mainImage || product.media?.[0]?.url || null;
  const hasDiscount =
    product.discountPrice !== null && Number(product.discountPrice) < Number(product.price);
  const oldPrice = formatPrice(Number(product.price));
  const displayPrice = formatPrice(Number(product.discountPrice ?? product.price));

  return (
    <Link
      href={`/${locale}/product/${product.id}`}
      className={`block w-full ${sizeConfig.wrapper} mx-auto rounded-lg overflow-hidden cursor-pointer border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all bg-white ${className}`}
    >
      {/* Контейнер изображения с относительным позиционированием для типа */}
      <div className="relative aspect-4/3 w-full">
        <ServerImage
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
        />

        {/* Отображение типа в верхнем углу, как на фото */}
        <div className={`absolute flex items-center text-gray-600 bg-white bg-opacity-80 rounded-sm ${sizeConfig.badge}`}>
          {/* Иконка для типа */}
          <svg
            width={sizeConfig.icon}
            height={sizeConfig.icon}
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
          <span className={`${sizeConfig.typeText} font-medium`}>
            {product.type === ProductType.BRUSH ? 'Кисть' : 'Иллюстрация'}
          </span>
        </div>
      </div>

      <div className={`flex flex-row items-center justify-between ${sizeConfig.content}`}>
        <h3 className={`font-medium text-gray-950 truncate ${sizeConfig.title}`}>
          {product.name}
        </h3>

        <div
          className={`flex flex-col items-end rounded-md shrink-0 border border-fuchsia-200/80 bg-linear-to-br from-fuchsia-50 to-purple-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ${sizeConfig.priceWrap}`}
        >
          {hasDiscount && (
            <span className={`font-medium text-gray-400 line-through leading-none ${sizeConfig.oldPriceText}`}>
              {oldPrice}
            </span>
          )}
          <span className={`font-bold text-fuchsia-500 tabular-nums tracking-tight leading-none ${sizeConfig.priceText}`}>
            {displayPrice}
          </span>
        </div>
      </div>
    </Link>
  );
}