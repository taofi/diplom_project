'use client';

import { useI18n } from '@/context/i18n/I18nContext';

export default function CookiesPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 mt-20">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        {t('cookies.title')}
      </h1>
      <p className="text-gray-500 mb-8">
        {t('cookies.lastUpdated')}
      </p>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-8">
          {t('cookies.intro')}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {t('cookies.section1Title')}
          </h2>
          <p className="text-gray-600">
            {t('cookies.section1Text')}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {t('cookies.section2Title')}
          </h2>
          <p className="text-gray-600">
            {t('cookies.section2Text')}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {t('cookies.section3Title')}
          </h2>
          <p className="text-gray-600">
            {t('cookies.section3Text')}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {t('cookies.section4Title')}
          </h2>
          <p className="text-gray-600">
            {t('cookies.section4Text')}
          </p>
        </section>
      </div>
    </div>
  );
}
