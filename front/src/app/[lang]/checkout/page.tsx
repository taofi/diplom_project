'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { useCart } from '@/context/cart/CartContext';
import { useAuth } from '@/context/auth/AuthContext';
import { checkoutApi } from '@/lib/api-checkout';
import { checkoutVerificationApi } from '@/lib/api-checkout-verification';
import { Spinner } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toastSuccess, toastError } from '@/lib/toast';

export default function CheckoutPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { items, isLoading: cartLoading, refreshCart } = useCart();
  const { isAuthenticated, login, setAuthFromTokens } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  
  // Состояния для верификации email
  const [emailVerified, setEmailVerified] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verificationError, setVerificationError] = useState('');
  const [wasGuest, setWasGuest] = useState(false);

  // Таймер для повторной отправки кода
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [resendTimer]);

  // Эффект для автоматического обновления корзины при входе (после верификации email)
  useEffect(() => {
    // Если были гостем и теперь стали авторизованным - обновить корзину
    if (wasGuest && isAuthenticated) {
      refreshCart();
      setWasGuest(false);
    }
  }, [isAuthenticated, wasGuest, refreshCart]);

  // Проверка валидности email
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail);

  // Обработчик отправки кода верификации
  const handleSendCode = async () => {
    if (!isEmailValid) {
      toastError(t('checkout.verification.invalidEmail') || 'Please enter a valid email');
      return;
    }

    setIsSendingCode(true);
    setVerificationError('');

    try {
      const response = await checkoutVerificationApi.sendVerificationCode(guestEmail);
      
      if (response.success) {
        setShowCodeInput(true);
        setResendTimer(60); // 60 секунд до повторной отправки
        toastSuccess(t('checkout.verification.codeSent') || 'Verification code sent');
      }
    } catch (error) {
      const err = error as Error;
      const message = err?.message || 'Failed to send code';
      toastError(message);
    } finally {
      setIsSendingCode(false);
    }
  };

  // Обработчик подтверждения кода
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setVerificationError(t('checkout.verification.enterCode') || 'Please enter 6-digit code');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');

    try {
      // Передаём корзину на сервер для синхронизации
      const response = await checkoutVerificationApi.verifyAndLogin(guestEmail, verificationCode, items);
      
      if (response.success && response.user && response.accessToken && response.refreshToken) {
        // Запоминаем, что были гостем
        const wasGuestUser = !isAuthenticated;
        setWasGuest(wasGuestUser);
        
        // Установить авторизацию из полученных токенов
        setAuthFromTokens(response.user, response.accessToken, response.refreshToken);
        
        // Обновляем корзину с сервера
        // Сервер уже синхронизировал корзину при верификации
        refreshCart();
        
        setEmailVerified(true);
        setShowCodeInput(false);
        toastSuccess(t('checkout.verification.emailVerified') || 'Email verified successfully');
      } else {
        setVerificationError(response.message || t('checkout.verification.invalidCode') || 'Invalid code');
      }
    } catch (error) {
      const err = error as Error;
      const message = err?.message || 'Verification failed';
      setVerificationError(message);
      toastError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  // Обработчик повторной отправки кода
  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    await handleSendCode();
  };

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

    // Для неавторизованных - проверяем верификацию email
    if (!isAuthenticated && !emailVerified) {
      toastError(t('checkout.verification.placeOrderDisabled') || 'Please verify your email first');
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

  // Кнопка оформления заказа недоступна если email не верифицирован
  const isCheckoutDisabled = !isAuthenticated && !emailVerified;

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

              {/* Для гостей - форма email с верификацией */}
              {!isAuthenticated && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('checkout.email') || 'Email'} *
                  </label>
                  
                  {!emailVerified ? (
                    <>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            type="email"
                            name="email"
                            value={guestEmail}
                            onChange={(value) => {
                              setGuestEmail(value);
                              setEmailVerified(false);
                              setVerificationError('');
                            }}
                            placeholder={t('checkout.emailPlaceholder') || 'your@email.com'}
                            disabled={showCodeInput}
                            required
                          />
                        </div>
                        {!showCodeInput && isEmailValid && (
                          <Button
                            onClick={handleSendCode}
                            disabled={isSendingCode}
                            variant="secondary"
                          >
                            {isSendingCode ? <Spinner size="sm" /> : (t('checkout.verification.sendCode') || 'Send Code')}
                          </Button>
                        )}
                      </div>

                      {/* Поле ввода кода */}
                      {showCodeInput && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('checkout.verification.codePlaceholder') || 'Enter 6-digit code'}
                          </label>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                type="text"
                                name="verificationCode"
                                value={verificationCode}
                                onChange={(value) => {
                                  // Ограничиваем ввод только цифрами и максимум 6 символов
                                  const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
                                  setVerificationCode(digitsOnly);
                                  setVerificationError('');
                                }}
                                placeholder="000000"
                                maxLength={6}
                              />
                            </div>
                            <Button
                              onClick={handleVerifyCode}
                              disabled={isVerifying || verificationCode.length !== 6}
                            >
                              {isVerifying ? <Spinner size="sm" /> : (t('checkout.verification.verify') || 'Verify')}
                            </Button>
                          </div>
                          
                          {/* Ошибка верификации */}
                          {verificationError && (
                            <p className="text-sm text-red-500 mt-2">
                              {verificationError}
                            </p>
                          )}
                          
                          {/* Таймер и кнопка повторной отправки */}
                          <div className="mt-3">
                            {resendTimer > 0 ? (
                              <p className="text-sm text-gray-500">
                                {t('checkout.verification.resendIn').replace('{seconds}', String(resendTimer)) || `Повторить через ${resendTimer} сек`}
                              </p>
                            ) : (
                              <button
                                onClick={handleResendCode}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                {t('checkout.verification.resendCode') || 'Resend code'}
                              </button>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-500 mt-2">
                            {t('checkout.verification.codeSentTo') || `Код отправлен на ${guestEmail}`}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-700">
                        {t('checkout.verification.emailVerified') || 'Email verified'}
                      </span>
                    </div>
                  )}
                  
                  {!emailVerified && (
                    <p className="text-sm text-gray-500 mt-2">
                      {t('checkout.verification.note') || 'Verify email to place order'}
                    </p>
                  )}
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

              {/* Кнопка оформления заказа */}
              {isCheckoutDisabled ? (
                <div>
                  <Button
                    onClick={handleCheckout}
                    disabled={true}
                    className="w-full"
                    size="lg"
                  >
                    {t('checkout.placeOrder') || 'Place Order'}
                  </Button>
                  <p className="text-xs text-red-500 mt-2 text-center">
                    {t('checkout.verification.placeOrderDisabled') || 'Verify email to place order'}
                  </p>
                </div>
              ) : (
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
              )}

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
