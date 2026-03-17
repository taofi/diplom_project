'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { Locale } from '@/context/i18n/types';
import { usePathname, useRouter } from 'next/navigation';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // 1. Обновляем контекст и куки
    setLocale(newLocale);

    // 2. Формируем новый путь
    const segments = pathname.split('/');
    const locales = ['en', 'ru'];

    // Проверяем, является ли первый сегмент кодом языка
    if (locales.includes(segments[1])) {
      segments[1] = newLocale;
    } else {
      // Если языка в пути нет (редкий случай для 404), добавляем его в начало
      segments.splice(1, 0, newLocale);
    }

    const newPathname = segments.join('/') || '/';
    
    // 3. Используем refresh, чтобы серверные компоненты (включая 404) 
    // получили актуальные данные из обновленных куки
    router.push(newPathname);
    router.refresh(); 
  };

  // ... (ваш JSX код ниже без изменений)
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleLocaleChange('ru')}
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
        onClick={() => handleLocaleChange('en')}
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