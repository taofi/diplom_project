import { Locale } from './types';

// Языки, которые переключаются на русский
const RUSSIAN_LANGUAGES = ['ru', 'kk', 'be', 'uk'];

export function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const browserLang = navigator.language.split('-')[0].toLowerCase();

  if (RUSSIAN_LANGUAGES.includes(browserLang)) {
    return 'ru';
  }

  return 'en';
}
