/**
 * i18n Types
 * Типы для интернационализации
 */

export type Locale = 'en' | 'ru';

/**
 * Переводы
 */
export interface Translations {
  [key: string]: string | Translations;
}

/**
 * Состояние i18n
 */
export interface I18nState {
  locale: Locale;
  translations: Translations;
  isLoading: boolean;
}
