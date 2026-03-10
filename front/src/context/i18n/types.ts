export type Locale = 'en' | 'ru';

export interface Translations {
  [key: string]: string | Translations;
}

export interface I18nState {
  locale: Locale;
  translations: Translations;
  isLoading: boolean;
}
