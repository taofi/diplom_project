'use client';

import Link from 'next/link';
import { useI18n } from '@/context/i18n/I18nContext';
import { Hero } from '@/components/Hero';
import { LatestProducts } from '@/components/LatestProducts';

export default function Home() {
  const { t, locale } = useI18n();

  return (
    <div className="w-full mt-20">
      <div className="-mx-20">
        <Hero />
      </div>

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

      {/* How it works */}
      <section className="bg-secondary/20 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-text text-center mb-8">
            {t('catalog.info.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary/30">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold mb-4">
                1
              </span>
              <h3 className="font-semibold text-text mb-2">
                {t('catalog.info.step1Title')}
              </h3>
              <p className="text-text/70 text-sm">
                {t('catalog.info.step1Desc')}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary/30">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold mb-4">
                2
              </span>
              <h3 className="font-semibold text-text mb-2">
                {t('catalog.info.step2Title')}
              </h3>
              <p className="text-text/70 text-sm">
                {t('catalog.info.step2Desc')}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary/30">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold mb-4">
                3
              </span>
              <h3 className="font-semibold text-text mb-2">
                {t('catalog.info.step3Title')}
              </h3>
              <p className="text-text/70 text-sm">
                {t('catalog.info.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-accent p-8 md:p-10 text-white">
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {t('home.finalCta.title')}
            </h2>
            <p className="text-white/90 mb-6">
              {t('home.finalCta.description')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/${locale}/catalog`}
              className="inline-flex items-center justify-center rounded-lg bg-white text-primary px-6 py-3 font-semibold hover:bg-white/90 transition-colors"
            >
              {t('home.finalCta.catalogButton')}
            </Link>
            <Link
              href={`/${locale}/contacts`}
              className="inline-flex items-center justify-center rounded-lg border border-white/50 text-white px-6 py-3 font-semibold hover:bg-white/10 transition-colors"
            >
              {t('home.finalCta.contactsButton')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
