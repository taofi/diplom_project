'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { formatPrice } from '@/utils/price';

interface CartSummaryProps {
  total: number;
  itemCount: number;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

export function CartSummary({ 
  total, 
  itemCount, 
  onCheckout, 
  onContinueShopping 
}: CartSummaryProps) {
  const { t } = useI18n();

  return (
    <div className="w-full lg:w-80">
      <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('cart.orderSummary') || 'Order Summary'}
        </h2>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-gray-600">
            <span>{t('cart.subtotal') || 'Subtotal'}</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{t('cart.items') || 'Items'}</span>
            <span>{itemCount}</span>
          </div>
        </div>

        <div className="border-t pt-4 mb-6">
          <div className="flex justify-between text-lg font-semibold">
            <span>{t('cart.total') || 'Total'}</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          className="w-full py-3 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          {t('cart.checkout') || 'Proceed to Checkout'}
        </button>

        <button
          onClick={onContinueShopping}
          className="w-full mt-3 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          {t('cart.continueShopping') || 'Continue Shopping'}
        </button>
      </div>
    </div>
  );
}
