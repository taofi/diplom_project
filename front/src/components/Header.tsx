'use client';

import { Logo } from './Logo';
import { Navigation } from './Navigation';
import { UserActions } from './UserActions';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  return (
    <header className="border-b border-primary/20 py-2">
      <div className="grid grid-cols-3 items-center">
        
        {/* Лево: Логотип */}
        <div className="flex justify-start">
          <Logo />
        </div>

        {/* Центр: Навигация */}
        <div className="flex justify-center">
          <Navigation />
        </div>

        {/* Право: Экшены */}
        <div className="flex justify-end items-center gap-6">
          <UserActions />
          <LanguageSwitcher />
        </div>
        
      </div>
    </header>
  );
}