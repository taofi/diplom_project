'use client';

import Link from 'next/link';
import { useI18n } from '@/context/i18n/I18nContext';
import { Hero } from '@/components/Hero';
import { LatestProducts } from '@/components/LatestProducts';

export default function Home() {
  const { t, locale } = useI18n();

  return (
    <div className="w-full mt-20">
      <Hero />

      {/* Latest Products */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-text">
            {t('home.latestProducts')}
          </h2>
          <Link 
            href={`/${locale}/catalog`}
            className="text-primary hover:text-accent transition-colors font-medium"
          >
            {t('home.viewAll')}
          </Link>
        </div>
        <LatestProducts />
      </section>

      {/* Features */}
      <section className="bg-secondary/20 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-text text-center mb-8">
            {t('home.features.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Quality */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-text mb-2">
                {t('home.features.quality.title')}
              </h3>
              <p className="text-text/70 text-sm">
                {t('home.features.quality.desc')}
              </p>
            </div>

            {/* Instant Delivery */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-semibold text-text mb-2">
                {t('home.features.instant.title')}
              </h3>
              <p className="text-text/70 text-sm">
                {t('home.features.instant.desc')}
              </p>
            </div>

            {/* Support */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-text mb-2">
                {t('home.features.support.title')}
              </h3>
              <p className="text-text/70 text-sm">
                {t('home.features.support.desc')}
              </p>
            </div>

            {/* License */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-text mb-2">
                {t('home.features.license.title')}
              </h3>
              <p className="text-text/70 text-sm">
                {t('home.features.license.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category CTA */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href={`/${locale}/catalog?type=BRUSH`}
            className="relative h-[200px] bg-gradient-to-r from-primary to-secondary rounded-xl overflow-hidden group cursor-pointer"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
              <h3 className="text-2xl font-bold mb-2">
                {t('catalog.categoryBanners.brushes')}
              </h3>
              <p className="text-white/80">
                {t('catalog.categoryBanners.brushesDesc')}
              </p>
            </div>
          </Link>
          
          <Link 
            href={`/${locale}/catalog?type=ILLUSTRATION`}
            className="relative h-[200px] bg-gradient-to-r from-accent to-primary rounded-xl overflow-hidden group cursor-pointer"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
              <h3 className="text-2xl font-bold mb-2">
                {t('catalog.categoryBanners.illustrations')}
              </h3>
              <p className="text-white/80">
                {t('catalog.categoryBanners.illustrationsDesc')}
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
