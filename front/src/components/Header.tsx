'use client';

import { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Navigation } from './Navigation';
import { UserActions } from './UserActions';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`
        fixed z-100 top-0 left-0 right-0 transition-all duration-300 ease-in-out
        ${isScrolled 
          ? 'bg-white py-1 border-b-2 border-primary/60 shadow-md' // Состояние при скролле
          : 'bg-transparent py-4 border-b border-primary/20'}      // Исходное состояние
      `}
    >
      <div className="grid grid-cols-3 items-center px-20">
        
        <div className="flex justify-start">
          <Logo />
        </div>

        <div className="flex justify-center">
          <Navigation />
        </div>

        <div className="flex justify-end items-center gap-6">
          <UserActions />
          <LanguageSwitcher />
        </div>
        
      </div>
    </header>
  );
}