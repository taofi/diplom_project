'use client';

import { useAuth } from '@/context/auth/AuthContext';
import { useI18n } from '@/context/i18n/I18nContext';
import { useCart } from '@/context/cart/CartContext';
import { NavButton } from './NavButton';
import { UserAvatarIcon } from './UserAvatarIcon';

interface UserActionsProps {
  showCart?: boolean;
  showProfile?: boolean;
}

export function UserActions({ showCart = true, showProfile = true }: UserActionsProps) {
  const { user, isAuthenticated, isAdminOrAuthor } = useAuth();
  const { t, locale } = useI18n();
  const { count: cartCount } = useCart();
  
  // Check if user is admin (not just author)
  const isAdmin = user?.roles?.includes('admin') || false;
  
  return (
    <div className="flex items-center gap-4">
      {/* Admin Panel - Only for admins */}
      {isAdmin && (
        <NavButton 
          href={`/${locale}/admin`} 
          text={t('nav.adminPanel')}
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          }
        />
      )}

      {/* Products Management - For admin or author */}
      {isAdminOrAuthor && (
        <NavButton 
          href="/admin/products" 
          text={t('nav.dashboard')}
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
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          }
        />
      )}

      {/* Cart */}
      {showCart && (
        <NavButton 
          href="/cart" 
          text={t('nav.cart')}
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
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          }
        />
      )}

      {/* Profile or Login */}
      {showProfile && (
        <>
          {isAuthenticated ? (
            <NavButton 
              href="/profile" 
              text={t('nav.profile')}
              hideLabel
              icon={<UserAvatarIcon avatarUrl={user?.avatar_url} size={40} />}
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
        </>
      )}
    </div>
  );
}
