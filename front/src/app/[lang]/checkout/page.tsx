'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/context/i18n/I18nContext';
import { useCart } from '@/context/cart/CartContext';
import { useAuth } from '@/context/auth/AuthContext';
import { checkoutApi } from '@/lib/api-checkout';
import { Spinner } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toastSuccess, toastError } from '@/lib/toast';

export default function CheckoutPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { items, isLoading: cartLoading, refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');

  // Вычисление общей суммы
  const total = items.reduce((sum, item) => {
    const price = Number(item.product?.price) || 0;
    return sum + price;
  }, 0);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toastError(t('checkout.cartEmpty') || 'Cart is empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = isAuthenticated 
        ? {} 
        : { guestEmail };

      if (!isAuthenticated && !guestEmail) {
        toastError(t('checkout.emailRequired') || 'Email is required');
        setIsSubmitting(false);
        return;
      }

      const response = await checkoutApi.checkout(payload);
      
      if (response.success) {
        toastSuccess(t('checkout.orderSuccess') || 'Order placed successfully!');
        // Очищаем корзину
        await refreshCart();
        // Перенаправляем на страницу успеха
        router.push(`/${locale}/checkout/success?orderId=${response.order.id}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toastError(t('checkout.orderFailed') || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueShopping = () => {
    router.push(`/${locale}/catalog`);
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen mt-20 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen mt-20 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('checkout.title') || 'Checkout'}
          </h1>
          <p className="text-gray-600 mb-8">
            {t('checkout.cartEmpty') || 'Your cart is empty'}
          </p>
          <Button onClick={handleContinueShopping}>
            {t('checkout.continueShopping') || 'Continue Shopping'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-20 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t('checkout.title') || 'Checkout'}
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Левая колонка - форма */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">
                {t('checkout.orderDetails') || 'Order Details'}
              </h2>

              {/* Для гостей - форма email */}
              {!isAuthenticated && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('checkout.email') || 'Email'} *
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={guestEmail}
                    onChange={setGuestEmail}
                    placeholder={t('checkout.emailPlaceholder') || 'your@email.com'}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('checkout.emailNote') || 'We will send order details to this email'}
                  </p>
                </div>
              )}

              {/* Для авторизованных - информация из профиля */}
              {isAuthenticated && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {t('checkout.authenticatedNote') || 'Your order will be associated with your account'}
                  </p>
                </div>
              )}

              {/* Информация о заказе */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">
                  {t('checkout.items') || 'Items'} ({items.length})
                </h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name || `Product #${item.productId}`}</p>
                        <p className="text-sm text-gray-500">
                          {item.licenseType?.name || `License #${item.licenseTypeId}`}
                        </p>
                      </div>
                      <p className="font-medium">
                        ${Number(item.product?.price || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка - итоги */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">
                {t('checkout.summary') || 'Summary'}
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t('checkout.subtotal') || 'Subtotal'}
                  </span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t('checkout.itemsCount') || 'Items'}
                  </span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">{t('checkout.total') || 'Total'}</span>
                  <span className="font-bold text-xl">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <Spinner size="sm" />
                ) : (
                  t('checkout.placeOrder') || 'Place Order'
                )}
              </Button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                {t('checkout.termsNote') || 'By placing an order, you agree to our terms and conditions'}
              </p>

              <button
                onClick={handleContinueShopping}
                className="w-full mt-4 text-sm text-gray-600 hover:text-gray-900"
              >
                {t('checkout.continueShopping') || 'Continue Shopping'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
