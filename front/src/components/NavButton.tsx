'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';

interface NavButtonProps {
  href: string;
  text: string;
  icon?: React.ReactNode;
  badge?: number;
  hideLabel?: boolean;
}

export function NavButton({ href, text, icon, badge, hideLabel = false }: NavButtonProps) {
  const { locale } = useI18n();
  const pathname = usePathname();

  // Automatically prefix href with current locale if it's not already prefixed
  const localizedHref = href.startsWith('/') && !href.startsWith(`/${locale}`) 
    ? `/${locale}${href}` 
    : href;
  const normalizedPathname = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const normalizedHref = localizedHref.endsWith('/') && localizedHref.length > 1 ? localizedHref.slice(0, -1) : localizedHref;
  const isHomeLink = normalizedHref === `/${locale}`;
  const isActive = isHomeLink
    ? normalizedPathname === normalizedHref
    : normalizedPathname === normalizedHref || normalizedPathname.startsWith(`${normalizedHref}/`);

  return (
    <Link 
      href={localizedHref} 
      className={`flex flex-col items-center gap-1 text-primary hover:text-primary/80 transition-colors ${
        isActive ? 'underline underline-offset-4 decoration-2' : ''
      }`}
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
      {!hideLabel && (
        <span className="text-sm font-medium text-center leading-tight whitespace-normal max-w-[84px]">
          {text}
        </span>
      )}
    </Link>
  );
}
