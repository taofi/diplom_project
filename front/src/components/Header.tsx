'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { Navigation } from './Navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserAvatarIcon } from './UserAvatarIcon';
import { NavButton } from './NavButton';
import { useAuth } from '@/context/auth/AuthContext';
import { useCart } from '@/context/cart/CartContext';
import { useI18n } from '@/context/i18n/I18nContext';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [avatarMenuState, setAvatarMenuState] = useState<{ open: boolean; path: string | null }>({
    open: false,
    path: null,
  });
  // Новое состояние для выпадающего списка админа
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  const avatarMenuRef = useRef<HTMLDivElement | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { count: cartCount } = useCart();
  const { t, locale } = useI18n();
  const pathname = usePathname();
  
  const isAdmin = user?.roles?.includes('admin') || false;
  const isAdminOrAuthor = isAdmin || user?.roles?.includes('author') || false;
  const isAvatarMenuOpen = avatarMenuState.open && avatarMenuState.path === pathname;

  // Массив ссылок для админ-панели
  const adminLinks = [
       {
      href: `/${locale}/admin/categories`,
      title: t('admin.categories.title') || 'Categories',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/licenses`,
      title: t('admin.licenseTypes.title') || 'License Types',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/users`,
      title: t('admin.tabs.users') || 'Users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Закрываем подменю админа, если закрылось основное меню аватара
  useEffect(() => {
    if (!isAvatarMenuOpen) {
      setIsAdminMenuOpen(false);
    }
  }, [isAvatarMenuOpen]);

  useEffect(() => {
    if (!isAvatarMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!avatarMenuRef.current?.contains(event.target as Node)) {
        setAvatarMenuState({ open: false, path: null });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAvatarMenuOpen]);

  return (
    <header 
      className={`
        fixed z-100 top-0 left-0 right-0 transition-all duration-300 ease-in-out
        ${isScrolled 
          ? 'bg-white/95 backdrop-blur-md py-1 border-b-2 border-primary shadow-lg shadow-primary/10' 
          : 'bg-white/70 backdrop-blur-sm py-4 border-b-2 border-primary/45 shadow-sm shadow-primary/10'}      
      `}
    >
      <div className="flex items-center justify-between lg:grid lg:grid-cols-3 lg:items-center px-4 md:px-10 xl:px-20">
        
        <div className="flex justify-start">
          <Logo />
        </div>

        <div className="hidden lg:flex justify-center">
          <Navigation />
        </div>

        <div className="flex justify-end items-center gap-4">
          <div className="lg:hidden">
            <Navigation />
          </div>
          {!isAuthenticated ? (
            <Link
              href={`/${locale}/login`}
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              {t('nav.login')}
            </Link>
          ) : (
            <div ref={avatarMenuRef} className="relative">
              <button
                type="button"
                onClick={() =>
                  setAvatarMenuState((prev) =>
                    prev.open && prev.path === pathname
                      ? { open: false, path: null }
                      : { open: true, path: pathname },
                  )
                }
                className="cursor-pointer text-primary hover:text-primary/80 transition-colors"
                aria-label="Open user menu"
              >
                <UserAvatarIcon avatarUrl={user?.avatar_url} name={user?.name} size={36} />
              </button>

              {isAvatarMenuOpen && (
                <div className="absolute right-0 top-12 z-120 w-[270px] rounded-xl border border-primary/20 bg-white p-2 shadow-lg">
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/${locale}/profile`}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21a8 8 0 0 0-16 0" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span className="text-left">{t('nav.profile')}</span>
                    </Link>

                    {/* НАЧАЛО ИЗМЕНЕНИЙ: Кнопка вместо ссылки + выпадающий список */}
                    {isAdmin && (
                      <div className="flex flex-col w-full">
                        <button
                          type="button"
                          onClick={() => setIsAdminMenuOpen((prev) => !prev)}
                          className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                        >
                          <div className="flex items-center gap-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span className="text-left">{t('nav.adminPanel')}</span>
                          </div>
                          
                          {/* Иконка стрелочки справа, которая переворачивается при открытии */}
                          <svg 
                            className={`w-4 h-4 transition-transform duration-200 ${isAdminMenuOpen ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            strokeWidth="2"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Контейнер выпадающего списка ссылок */}
                        {isAdminMenuOpen && (
                          <div className="flex flex-col gap-1 pl-4 mt-1 mb-1 border-l border-primary/20">
                            {adminLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setAvatarMenuState({ open: false, path: null })} // Закрываем меню при клике на ссылку
                                className="w-full flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-primary/80 hover:text-primary hover:bg-primary/5 transition-colors"
                              >
                                {link.icon}
                                <span className="text-left">{link.title}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {/* КОНЕЦ ИЗМЕНЕНИЙ */}

                    {isAdminOrAuthor && (
                      <Link
                        href="/admin/products"
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <line x1="3" y1="9" x2="21" y2="9" />
                          <line x1="9" y1="21" x2="9" y2="9" />
                        </svg>
                        <span className="text-left">{t('nav.dashboard')}</span>
                      </Link>
                    )}
                    <Link
                      href={`/${locale}/chat`}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="text-left">{t('nav.chat')}</span>
                    </Link>
                    <Link
                      href={`/${locale}/orders`}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      <span className="text-left">{t('nav.orders')}</span>
                    </Link>
                  </div>
                  <div className="mt-2 pt-2 border-t border-primary/20">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setAvatarMenuState({ open: false, path: null });
                      }}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span className="text-left">{t('profile.logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <NavButton
            href="/cart"
            text={t('nav.cart')}
            hideLabel
            badge={cartCount}
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-6 h-6"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            }
          />
          <LanguageSwitcher />
        </div>
        
      </div>
    </header>
  );
}