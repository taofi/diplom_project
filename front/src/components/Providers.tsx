'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/auth/AuthContext';
import { I18nProvider } from '@/context/i18n/I18nContext';
import { ProductProvider } from '@/context/product/ProductContext';
import { CartProvider } from '@/context/cart/CartContext';
import { Locale } from '@/context/i18n/types';

interface ProvidersProps {
  children: ReactNode;
  initialLocale?: Locale; 
}
export function Providers({ children, initialLocale }: ProvidersProps) {
  return (
    <AuthProvider>
      <I18nProvider initialLocale={initialLocale}>
        <ProductProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </ProductProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
