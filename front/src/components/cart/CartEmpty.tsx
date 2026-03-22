'use client';

import { useI18n } from '@/context/i18n/I18nContext';

interface CartEmptyProps {
  onContinueShopping: () => void;
}

export function CartEmpty({ onContinueShopping }: CartEmptyProps) {
  const { t } = useI18n();

  return (
    <div className="text-center py-16">
      <svg
        className="mx-auto h-24 w-24 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <h2 className="mt-4 text-xl font-semibold text-gray-900">
        {t('cart.empty') || 'Your cart is empty'}
      </h2>
      <p className="mt-2 text-gray-500">
        {t('cart.emptyDescription') || 'Add some products to get started'}
      </p>
      <button
        onClick={onContinueShopping}
        className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
      >
        {t('cart.continueShopping') || 'Continue Shopping'}
      </button>
    </div>
  );
}
