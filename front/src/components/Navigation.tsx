'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { NavButton } from './NavButton';

export function Navigation() {
  const { t } = useI18n();
  
  return (
    <nav className="flex items-center gap-8 px-8">
      <NavButton href="/" text={t('nav.home')} />
      <NavButton href="/catalog" text={t('nav.catalog')} />
      <NavButton href="/blog" text={t('nav.blog')} />
      <NavButton href="/contacts" text={t('nav.contacts')} />
    </nav>
  );
}
