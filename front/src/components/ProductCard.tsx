'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/context/i18n/I18nContext';
import { ServerImage } from './Image';
import { UserAvatarIcon } from './UserAvatarIcon';
import { getPublicUserProfile, type PublicUserProfileResponse } from '@/lib/api-user';
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
    authorText: 'text-[10px]',
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
    authorText: 'text-xs',
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
    authorText: 'text-sm',
    priceWrap: 'gap-1.5 px-2.5 py-1.5',
    priceText: 'text-xl',
    oldPriceText: 'text-xs',
  },
} as const;

export function ProductCard({ product, className = '', size = 'md' }: ProductCardProps) {
  const { locale } = useI18n();
  const sizeConfig = cardSizeClasses[size];
  const [isAuthorPopoverOpen, setIsAuthorPopoverOpen] = useState(false);
  const [isAuthorPopoverVisible, setIsAuthorPopoverVisible] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<PublicUserProfileResponse | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const imageUrl = product.mainImage || product.media?.[0]?.url || null;
  const hasDiscount =
    product.discountPrice !== null && Number(product.discountPrice) < Number(product.price);
  const oldPrice = formatPrice(Number(product.price));
  const displayPrice = formatPrice(Number(product.discountPrice ?? product.price));
  const authorName =
    product.author?.name ?? product.seller?.name ?? product.seller?.username ?? 'Автор не указан';
  const authorId = product.author?.id ?? product.seller?.id ?? null;
  const authorDescription = authorProfile?.description ?? 'Описание отсутствует';

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const clearAnimationTimeout = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  };

  const handleAuthorEnter = async () => {
    if (!authorId) return;
    clearHideTimeout();
    clearAnimationTimeout();
    setIsAuthorPopoverVisible(true);
    setTimeout(() => setIsAuthorPopoverOpen(true), 0);
    if (!authorProfile) {
      try {
        const profile = await getPublicUserProfile(authorId);
        setAuthorProfile(profile);
      } catch {
        // silently ignore profile loading errors in hover card
      }
    }
  };

  const handleAuthorLeave = () => {
    clearHideTimeout();
    clearAnimationTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setIsAuthorPopoverOpen(false);
      animationTimeoutRef.current = setTimeout(() => {
        setIsAuthorPopoverVisible(false);
      }, 150);
    }, 120);
  };

  useEffect(() => {
    return () => {
      clearHideTimeout();
      clearAnimationTimeout();
    };
  }, []);

  return (
    <>
      <div
        className={`block w-full ${sizeConfig.wrapper} mx-auto rounded-lg overflow-visible border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all bg-white ${className}`}
      >
        <Link href={`/${locale}/product/${product.id}`} className="block cursor-pointer">
          <div className="relative aspect-4/3 w-full overflow-hidden">
            <ServerImage
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />

            <div className={`absolute flex items-center text-gray-600 bg-white bg-opacity-80 rounded-sm ${sizeConfig.badge}`}>
              <svg
                width={sizeConfig.icon}
                height={sizeConfig.icon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#3A7B7B]"
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

          <div className={`flex w-full flex-col ${sizeConfig.content}`}>
            <h3 className={`w-full font-medium text-gray-950 truncate ${sizeConfig.title}`}>
              {product.name}
            </h3>
          </div>
        </Link>

        <div className={`flex w-full items-end justify-between pt-0 ${sizeConfig.content}`}>
          <div
            className="relative min-w-0"
            onMouseEnter={handleAuthorEnter}
            onMouseLeave={handleAuthorLeave}
          >
            <span
              className={`block min-w-0 cursor-pointer truncate text-left text-gray-600 hover:text-gray-900 ${sizeConfig.authorText}`}
            >
              {authorName}
            </span>

            {authorId && isAuthorPopoverVisible && (
              <div
                className={`absolute bottom-full left-0 z-20 mb-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-xl transition-all duration-150 ${
                  isAuthorPopoverOpen
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-1 opacity-0 pointer-events-none'
                }`}
              >
                <Link
                  href={`/${locale}/users/${authorId}`}
                  className="block"
                >
                  <div className="flex items-start gap-3">
                    <UserAvatarIcon
                      avatarUrl={authorProfile?.avatar_url}
                      name={authorProfile?.name ?? authorName}
                      size={44}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {authorProfile?.name ?? authorName}
                      </p>
                      <p className="mt-1 line-clamp-3 text-xs text-gray-600">
                        {authorDescription}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
          <div
            className={`flex flex-col items-start rounded-md shrink-0 border border-fuchsia-200/80 bg-linear-to-br from-fuchsia-50 to-purple-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ${sizeConfig.priceWrap}`}
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
      </div>
    </>
  );
}