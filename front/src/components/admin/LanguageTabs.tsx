'use client';

import React from 'react';

interface LanguageTabsProps {
  activeLanguage: string;
  onChange: (language: string) => void;
  className?: string;
}

const languages = [
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'en', label: 'EN', flag: '🇺🇸' },
];

export function LanguageTabs({ activeLanguage, onChange, className = '' }: LanguageTabsProps) {
  return (
    <div className={`flex gap-1 bg-gray-100 p-1 rounded-lg ${className}`}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => onChange(lang.code)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
            ${
              activeLanguage === lang.code
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
}
