/**
 * Перевод ошибок с сервера на основе текущей локали
 * Использует cookies для получения текущего языка
 */

import Cookies from 'js-cookie';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';

type Locale = 'en' | 'ru';
type Translations = typeof en;

// Карта сообщений сервера на ключи переводов
// Ключ - регулярное выражение для поиска в сообщении сервера
// Значение - ключ перевода в файле locales
const errorMessageMapping: Record<Locale, Array<{ pattern: RegExp; key: string }>> = {
  ru: [
    // Auth ошибки
    { pattern: /invalid credentials|неверный/i, key: 'errors.invalidCredentials' },
    { pattern: /email already exists|email уже существует/i, key: 'errors.emailAlreadyExists' },
    { pattern: /password too short|пароль слишком короткий/i, key: 'errors.passwordTooShort' },
    // Product ошибки
    { pattern: /only deactivate your own products|можете деактивировать только свои/i, key: 'errors.canOnlyDeactivateOwnProducts' },
    { pattern: /only activate your own products|можете активировать только свои/i, key: 'errors.canOnlyActivateOwnProducts' },
    { pattern: /only delete your own products|можете удалить только свои/i, key: 'errors.canOnlyDeleteOwnProducts' },
    { pattern: /only update your own products|можете обновить только свои/i, key: 'errors.canOnlyUpdateOwnProducts' },
    { pattern: /product not found|товар не найден/i, key: 'errors.productNotFound' },
    // Network ошибки
    { pattern: /network|network error|сеть|ошибка сети/i, key: 'errors.networkError' },
    // Validation ошибки
    { pattern: /validation failed|валидация|неверные данные/i, key: 'errors.validationFailed' },
    { pattern: /required|обязательно|required/i, key: 'errors.requiredField' },
  ],
  en: [
    // Auth ошибки
    { pattern: /invalid credentials/i, key: 'errors.invalidCredentials' },
    { pattern: /email already exists/i, key: 'errors.emailAlreadyExists' },
    { pattern: /password too short/i, key: 'errors.passwordTooShort' },
    // Product ошибки
    { pattern: /only deactivate your own products/i, key: 'errors.canOnlyDeactivateOwnProducts' },
    { pattern: /only activate your own products/i, key: 'errors.canOnlyActivateOwnProducts' },
    { pattern: /only delete your own products/i, key: 'errors.canOnlyDeleteOwnProducts' },
    { pattern: /only update your own products/i, key: 'errors.canOnlyUpdateOwnProducts' },
    { pattern: /product not found/i, key: 'errors.productNotFound' },
    // Network ошибки
    { pattern: /network|network error/i, key: 'errors.networkError' },
    // Validation ошибки
    { pattern: /validation failed/i, key: 'errors.validationFailed' },
    { pattern: /required/i, key: 'errors.requiredField' },
  ],
};

const translations: Record<Locale, Translations> = { en, ru };

/**
 * Получить текущую локаль из cookies
 */
function getCurrentLocale(): Locale {
  const savedLocale = Cookies.get('locale');
  if (savedLocale === 'en' || savedLocale === 'ru') {
    return savedLocale;
  }
  // По умолчанию русский
  return 'ru';
}

/**
 * Получить перевод по ключу
 */
function getTranslation(locale: Locale, key: string): string {
  const keys = key.split('.');
  let value: unknown = translations[locale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
}

/**
 * Перевести сообщение об ошибке с сервера
 * @param serverMessage - сообщение от сервера (обычно на английском)
 * @param locale - опционально, локаль для перевода. Если не указана, берется из cookies
 */
export function translateError(serverMessage: string, locale?: Locale): string {
  const currentLocale = locale || getCurrentLocale();
  const mapping = errorMessageMapping[currentLocale];

  // Ищем匹配 в карте
  for (const { pattern, key } of mapping) {
    if (pattern.test(serverMessage)) {
      const translation = getTranslation(currentLocale, key);
      // Если найден перевод, возвращаем его
      if (translation !== key) {
        return translation;
      }
    }
  }

  // Если перевод не найден, возвращаем исходное сообщение
  return serverMessage;
}

export default translateError;
