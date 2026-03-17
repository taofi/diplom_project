'use client';

import Link from 'next/link';
import { useI18n } from '@/context/i18n/I18nContext';

interface NavButtonProps {
  href: string;
  text: string;
  icon?: React.ReactNode;
  badge?: number;
}

export function NavButton({ href, text, icon, badge }: NavButtonProps) {
  const { locale } = useI18n();

  // Automatically prefix href with current locale if it's not already prefixed
  const localizedHref = href.startsWith('/') && !href.startsWith(`/${locale}`) 
    ? `/${locale}${href}` 
    : href;

  return (
    <Link 
      href={localizedHref} 
      className="flex flex-col items-center gap-1 text-primary hover:text-primary/80 transition-colors"
    >
      {icon && (
        <div className="relative">
          {icon}
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
      )}
      <span className="text-sm font-medium">{text}</span>
    </Link>
  );
}
