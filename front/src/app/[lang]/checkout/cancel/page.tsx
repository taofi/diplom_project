'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { Button } from '@/components/ui/Button';

export default function CheckoutCancelPage() {
  const { t, locale } = useI18n();

  return (
    <div className="min-h-screen mt-20 py-8">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('checkout.cancelledTitle') || 'Payment Cancelled'}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('checkout.cancelledMessage') || 'Your payment was cancelled. You can try again.'}
        </p>
        <Button onClick={() => window.location.href = `/${locale}/checkout`}>
          {t('checkout.tryAgain') || 'Try Again'}
        </Button>
      </div>
    </div>
  );
}