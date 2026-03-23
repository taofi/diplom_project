'use client';

import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { Button } from '@/components/ui/Button';

export default function CheckoutSuccessPage() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen mt-20 py-8">
      <div className="max-w-2xl mx-auto px-6 text-center">
        {/* Иконка успеха */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('checkout.successTitle') || 'Order Placed Successfully!'}
        </h1>

        <p className="text-gray-600 mb-6">
          {t('checkout.successMessage') || 'Thank you for your purchase. We have received your order.'}
        </p>

        {orderId && (
          <p className="text-sm text-gray-500 mb-8">
            {t('checkout.orderNumber') || 'Order Number'}: <span className="font-medium">#{orderId}</span>
          </p>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold mb-4">
            {t('checkout.whatHappensNext') || 'What happens next?'}
          </h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              {t('checkout.step1') || 'You will receive a confirmation email with your order details'}
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              {t('checkout.step2') || 'Your purchased products will be available in your profile'}
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              {t('checkout.step3') || 'Download links will be sent to your email'}
            </li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={() => window.location.href = `/${locale}/profile`}>
            {t('checkout.goToProfile') || 'Go to Profile'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = `/${locale}/catalog`}
          >
            {t('checkout.continueShopping') || 'Continue Shopping'}
          </Button>
        </div>
      </div>
    </div>
  );
}
