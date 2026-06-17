import { Language } from '../../common/enums/language.enum';


export function normalizeLanguage(language?: string): string {
  if (!language) {
    return Language.RUSSIAN;
  }

  const firstLanguage = language.split(',')[0].split('-')[0];

  return firstLanguage.toLowerCase() || Language.RUSSIAN;
}


export function findTranslationByLanguage<T>(
  translations: T[] | undefined,
  language?: string,
): T | undefined {
  if (!translations || translations.length === 0) {
    return undefined;
  }

  const normalizedLang = normalizeLanguage(language);

  const translation = translations.find((t) => {
    const obj = t as { dataValues?: { language?: string }; language?: string };
    const lang = obj.dataValues?.language || obj.language;
    return String(lang).toLowerCase() === normalizedLang.toLowerCase();
  });

  return translation || translations[0];
}


