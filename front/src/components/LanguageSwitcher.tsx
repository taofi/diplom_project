'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { Locale } from '@/context/i18n/types';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const toggleLocale = () => {
    const newLocale: Locale = locale === 'ru' ? 'en' : 'ru';
    setLocale(newLocale);
  };

  return (
    <button
      onClick={toggleLocale}
      className="px-3 py-1 text-sm font-medium rounded-md bg-[var(--secondary)] hover:bg-[var(--primary)] text-[var(--text)] transition-colors"
    >
      {locale === 'ru' ? 'EN' : 'RU'}
    </button>
  );
}
