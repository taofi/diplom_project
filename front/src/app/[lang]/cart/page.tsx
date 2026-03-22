'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { useCart } from '@/context/cart/CartContext';
import { Spinner } from '@/components/ui';
import { CartItem, CartSummary, CartEmpty } from '@/components/cart';
import { toastSuccess, toastError } from '@/lib/toast';

export default function CartPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { items, count, isLoading, removeItem, clearCart } = useCart();

  // Вычисление общей суммы (без умножения на quantity - каждый товар = 1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const total = items.reduce((sum: number, item: any) => {
    const price = Number(item.product?.price) || 0;
    return sum + price;
  }, 0);

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem(itemId);
      toastSuccess(t('cart.itemRemoved') || 'Item removed from cart');
    } catch (err) {
      toastError(t('errors.removeItemFailed') || 'Failed to remove item');
    }
  };

  // Больше не поддерживается изменение количества
  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    // Quantity больше не поддерживается - всегда 1
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toastSuccess(t('cart.cartCleared') || 'Cart cleared');
    } catch (err) {
      toastError(t('errors.clearCartFailed') || 'Failed to clear cart');
    }
  };

  const handleCheckout = () => {
    router.push(`/${locale}/checkout`);
  };

  const handleContinueShopping = () => {
    router.push(`/${locale}/catalog`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen mt-20 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-20 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t('nav.cart')} ({count})
        </h1>

        {items.length === 0 ? (
          <CartEmpty onContinueShopping={handleContinueShopping} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Список товаров */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm border">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {items.map((item: any) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>

              {/* Кнопка очистки корзины */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleClearCart}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  {t('cart.clearCart') || 'Clear Cart'}
                </button>
              </div>
            </div>

            {/* Итого */}
            <CartSummary
              total={total}
              itemCount={count}
              onCheckout={handleCheckout}
              onContinueShopping={handleContinueShopping}
            />
          </div>
        )}
      </div>
    </div>
  );
}
