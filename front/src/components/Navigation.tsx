'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { NavButton } from './NavButton';

export function Navigation() {
  const { t, locale } = useI18n();
  
  return (
    <nav className="flex items-center gap-8 px-8">
      <NavButton href={`/${locale}`} text={t('nav.home')} />
      <NavButton href={`/${locale}/catalog`} text={t('nav.catalog')} />
      <NavButton href={`/${locale}/blog`} text={t('nav.blog')} />
      <NavButton href={`/${locale}/contacts`} text={t('nav.contacts')} />
    </nav>
  );
}
