'use client';

import { useAuth } from '@/context/auth/AuthContext';
import { useI18n } from '@/context/i18n/I18nContext';
import { NavButton } from './NavButton';

export function UserActions() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useI18n();
  
  return (
    <div className="flex items-center gap-4">
      {/* Cart */}
      <NavButton 
        href="/cart" 
        text={t('nav.cart')}
        badge={0}
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
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        }
      />

      {/* Profile or Login */}
      {isAuthenticated ? (
        <NavButton 
          href="/profile" 
          text={t('nav.profile')}
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          }
        />
      ) : (
        <NavButton 
          href="/login" 
          text={t('nav.login')}
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
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          }
        />
      )}
    </div>
  );
}
