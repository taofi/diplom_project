'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { useAuth } from '@/context/auth/AuthContext';
import { chatApi } from '@/lib/api-chat';
import { checkoutVerificationApi } from '@/lib/api-checkout-verification';
import { toastSuccess, toastError } from '@/lib/toast';
import { Spinner } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Offer } from '@/types/chat';
import type { PayOrderResponse } from '@/types/chat/offer.types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer;
  onSuccess: (result: PayOrderResponse) => void;
}

export function PaymentModal({ isOpen, onClose, offer, onSuccess }: PaymentModalProps) {
  const { t, locale } = useI18n();
  const { isAuthenticated, login, setAuthFromTokens, user } = useAuth();

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

  // Сброс состояния при открытии/закрытии
  useEffect(() => {
    if (!isOpen) {
      setGuestEmail('');
      setEmailVerified(false);
      setShowCodeInput(false);
      setVerificationCode('');
      setVerificationError('');
      setResendTimer(0);
    }
  }, [isOpen]);

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
        setResendTimer(60);
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
      const response = await checkoutVerificationApi.verifyAndLogin(guestEmail, verificationCode, []);

      if (response.success && response.user && response.accessToken && response.refreshToken) {
        setAuthFromTokens(response.user, response.accessToken, response.refreshToken);
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

  // Обработчик оплаты
  const handlePay = async () => {
    if (!isAuthenticated && !emailVerified) {
      toastError(t('checkout.verification.placeOrderDisabled') || 'Please verify your email first');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await chatApi.payOrder(offer.id, {});
      const sessionUrl = result.sessionUrl;
      if (sessionUrl) {
        // Открываем форму оплаты Stripe в новой вкладке
        window.open(sessionUrl, '_blank');
        onSuccess(result);
      } else {
        toastError(t('chat.paymentSessionNotCreated') || 'Payment session not created');
      }
      onClose();
    } catch (error) {
      const err = error as Error;
      const message = err?.message || t('chat.paymentFailed') || 'Payment failed';
      toastError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Форматирование цены
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(numPrice);
  };

  // Кнопка оплаты недоступна если email не верифицирован
  const isPaymentDisabled = !isAuthenticated && !emailVerified;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Затемнение фона */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Модальное окно */}
      <div 
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('chat.payOrder') || 'Оплата заказа'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Содержимое */}
        <div className="p-4">
          {/* Информация о заказе */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">
              {t('chat.orderDetails') || 'Детали заказа'}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {offer.description}
            </p>
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <span className="text-gray-600">{t('chat.total') || 'Итого'}:</span>
              <span className="text-xl font-bold text-green-600">
                {formatPrice(offer.price)}
              </span>
            </div>
          </div>


          
        </div>

        {/* Кнопки */}
        <div className="p-4 border-t bg-gray-50">
          {isPaymentDisabled ? (
            <div>
              <Button
                onClick={handlePay}
                disabled={true}
                className="w-full"
                size="lg"
              >
                {t('chat.payOrder') || 'Оплатить'} - {formatPrice(offer.price)}
              </Button>
              <p className="text-xs text-red-500 mt-2 text-center">
                {t('checkout.verification.placeOrderDisabled') || 'Verify email to pay'}
              </p>
            </div>
          ) : (
            <Button
              onClick={handlePay}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <Spinner size="sm" />
              ) : (
                <>
                  {t('chat.payOrder') || 'Оплатить'} - {formatPrice(offer.price)}
                </>
              )}
            </Button>
          )}

          <p className="text-xs text-gray-500 mt-4 text-center">
            {t('checkout.termsNote') || 'By paying, you agree to our terms and conditions'}
          </p>

          <button
            onClick={onClose}
            className="w-full mt-3 text-sm text-gray-600 hover:text-gray-900"
          >
            {t('common.cancel') || 'Отмена'}
          </button>
        </div>
      </div>
    </div>
  );
}