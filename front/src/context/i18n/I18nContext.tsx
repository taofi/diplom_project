'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
} from 'react';
import Cookies from 'js-cookie';
import { Locale, Translations } from './types';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';
import { useAuth } from '@/context/auth/AuthContext';
import { detectBrowserLocale } from './utils';
import api from '@/lib/api';

const translations: Record<Locale, Translations> = { en, ru };
const LOCALE_KEY = 'locale';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { user, isAuthenticated } = useAuth();

  const [locale, setLocaleState] = useState<Locale>(() => {
    const savedLocale = Cookies.get(LOCALE_KEY);
    if (savedLocale === 'en' || savedLocale === 'ru') {
      return savedLocale;
    }
    if (isAuthenticated && user?.locale) {
      const userLocale = user.locale as Locale;
      if (userLocale === 'en' || userLocale === 'ru') {
        return userLocale;
      }
    }
    return detectBrowserLocale();
  });

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    Cookies.set(LOCALE_KEY, newLocale, {
      path: '/',
      sameSite: 'strict',
      expires: 365,
    });

    if (isAuthenticated) {
      try {
        await api.patch('/auth/profile', { locale: newLocale });
      } catch {
        console.error('Failed to sync locale with server');
      }
    }
  };

  const t = useMemo(() => {
    return (key: string): string => {
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
    };
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
