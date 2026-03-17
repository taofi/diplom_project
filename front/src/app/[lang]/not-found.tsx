'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-9xl font-display font-bold text-accent mb-4">
          404
        </h1>
        
        <h2 className="text-3xl font-semibold text-text mb-6">
          {t('notFound.title')}
        </h2>
        
        <p className="text-lg text-text/80 mb-8 leading-relaxed">
          {t('notFound.description')}
        </p>
        
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {t('notFound.backButton')}
        </button>
      </div>
    </div>
  );
}