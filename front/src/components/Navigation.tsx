'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { NavButton } from './NavButton';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navigation() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <nav className="hidden lg:flex items-center gap-8 px-8">
        <NavButton href={`/${locale}`} text={t('nav.home')} />
        <NavButton href={`/${locale}/catalog`} text={t('nav.catalog')} />
        <NavButton href={`/${locale}/authors`} text={t('nav.authors')} />
        <NavButton href={`/${locale}/licenses`} text={t('nav.licenses') || 'Licenses'} />
        <NavButton href={`/${locale}/contacts`} text={t('nav.contacts')} />
      </nav>

      <div className="relative lg:hidden">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="text-primary hover:text-primary/80 transition-colors p-1"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {isMenuOpen && (
          <div className="absolute -right-4 md:-right-10 top-12 z-120 w-[300px] max-w-[calc(100vw-1rem)] rounded-xl border border-primary/20 bg-white p-4 shadow-lg">
            <div className="flex flex-wrap gap-4 pb-4 border-b border-primary/15">
              <NavButton href={`/${locale}`} text={t('nav.home')} />
              <NavButton href={`/${locale}/catalog`} text={t('nav.catalog')} />
              <NavButton href={`/${locale}/authors`} text={t('nav.authors')} />
              <NavButton href={`/${locale}/licenses`} text={t('nav.licenses') || 'Licenses'} />
              <NavButton href={`/${locale}/contacts`} text={t('nav.contacts')} />
            </div>

            <div className="pt-4">
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
