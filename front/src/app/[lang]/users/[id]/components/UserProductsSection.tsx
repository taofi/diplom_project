'use client';

import type { CSSProperties } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { Card, Button } from '@/components/ui';
import { ProductCard } from '@/components/ProductCard';
import type { ProductResponse } from '@/lib/api-product';
import { useI18n } from '@/context/i18n/I18nContext';

type UserProductsSectionProps = {
  isAuthor: boolean;
  products: ProductResponse[];
  isProductsExpanded: boolean;
  onToggleExpanded: () => void;
};

export function UserProductsSection({
  isAuthor,
  products,
  isProductsExpanded,
  onToggleExpanded,
}: UserProductsSectionProps) {
  const { t } = useI18n();

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold">
          {isAuthor ? t('profile.authorProductsTitle') : t('profile.userIsNotAuthor')}
        </h2>
        {isAuthor && products.length > 0 && (
          <Button variant="secondary" size="sm" onClick={onToggleExpanded}>
            {isProductsExpanded ? t('common.collapse') : t('common.expand')}
          </Button>
        )}
      </div>
      {isAuthor && products.length === 0 && (
        <p className="text-gray-500">{t('profile.authorNoProducts')}</p>
      )}
      {isAuthor && products.length > 0 && (
        <>
          {!isProductsExpanded ? (
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="author-products-swiper-prev inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 shrink-0"
                  aria-label={t('common.previous')}
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <Swiper
                  modules={[Navigation, Pagination]}
                  className="pb-1! flex-1"
                  style={
                    {
                      '--swiper-pagination-bullet-horizontal-gap': '6px',
                    } as CSSProperties
                  }
                  spaceBetween={12}
                  slidesPerView={1.15}
                  navigation={{
                    prevEl: '.author-products-swiper-prev',
                    nextEl: '.author-products-swiper-next',
                  }}
                  pagination={{
                    el: '.author-products-swiper-pagination',
                    clickable: true,
                  }}
                  breakpoints={{
                    640: { slidesPerView: 2.1 },
                    1024: { slidesPerView: 3.1 },
                  }}
                >
                  {products.map((product) => (
                    <SwiperSlide key={product.id}>
                      <ProductCard product={product} className="max-w-[240px] mx-auto" />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <button
                  type="button"
                  className="author-products-swiper-next inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 shrink-0"
                  aria-label={t('common.next')}
                >
                  <span aria-hidden="true">›</span>
                </button>
              </div>
              <div className="author-products-swiper-pagination mt-3 relative! bottom-0! w-auto text-center" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} className="max-w-[260px]" />
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
