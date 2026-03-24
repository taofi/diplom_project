import { Language } from '../../common/enums/language.enum';

/**
 * Нормализовать язык для поиска в базе данных
 * @param language - язык переданный в запросе (может быть в любом регистре)
 * @returns нормализованный язык в нижнем регистре
 */
export function normalizeLanguage(language?: string): string {
  return language?.toLowerCase() || Language.RUSSIAN;
}

/**
 * Получить перевод из массива переводов по языку
 * @param translations - массив переводов
 * @param language - язык (может быть в любом регистре)
 * @returns найденный перевод или первый из массива
 */
export function findTranslationByLanguage(
  translations: unknown[] | undefined,
  language?: string,
): unknown | undefined {
  if (!translations || translations.length === 0) {
    return undefined;
  }

  const normalizedLang = normalizeLanguage(language);

  // Сравниваем как строки
  const translation = translations.find((t) => {
    const obj = t as { dataValues?: { language?: string }; language?: string };
    const lang = obj.dataValues?.language || obj.language;
    return String(lang).toLowerCase() === normalizedLang.toLowerCase();
  });

  return translation || translations[0];
}