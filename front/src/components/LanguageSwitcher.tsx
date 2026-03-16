'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { Locale } from '@/context/i18n/types';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLocale('ru')}
        className={`cursor-pointer transition-colors font-medium ${
          locale === 'ru'
            ? 'border-b-2 border-primary text-primary font-bold'
            : 'text-primary hover:text-primary/80'
        }`}
      >
        РУ
      </button>
      <span className="text-primary">|</span>
      <button
        onClick={() => setLocale('en')}
        className={`cursor-pointer transition-colors font-medium ${
          locale === 'en'
            ? 'border-b-2 border-primary text-primary font-bold'
            : 'text-primary hover:text-primary/80'
        }`}
      >
        EN
      </button>
    </div>
  );
}
