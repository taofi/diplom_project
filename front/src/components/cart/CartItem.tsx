'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { CartItemImage } from './CartItemImage';
import { formatPrice } from '@/utils/price';

interface CartItemProps {
  item: {
    id: number;
    productLicenseId?: number;
    quantity?: number;
    product?: {
      name: string;
      price: number;
      coverImage?: string | null;
    };
    licenseType?: {
      name: string;
    };
  };
  onQuantityChange: (itemId: number, newQuantity: number) => void;
  onRemove: (itemId: number) => void;
}

export function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
  const { t } = useI18n();

  // Проверяем, есть ли информация о товаре
  const hasProductInfo = item.product && item.product.name;
  const productName = hasProductInfo 
    ? (item.product?.name || `Product #${item.productLicenseId || item.id}`) 
    : `Product #${item.productLicenseId || item.id}`;
  const productPrice = Number(item.product?.price) || 0;
  const productImage = item.product?.coverImage;
  const quantity = item.quantity || 1;
  const itemTotal = productPrice * quantity;

  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(item.id, quantity - 1);
    }
  };

  const handleIncrease = () => {
    onQuantityChange(item.id, quantity + 1);
  };

  return (
    <div className="flex items-center gap-4 p-4 border-b last:border-b-0">
      {/* Изображение товара */}
      <CartItemImage src={productImage} alt={productName} />

      {/* Информация о товаре */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-medium text-gray-900 truncate">
          {productName}
        </h3>
        <p className="text-sm text-gray-500">
          {item.licenseType?.name || t('cart.license') || 'License'}
        </p>
        <p className="text-lg font-semibold text-primary mt-1">
          {formatPrice(productPrice)}
        </p>
      </div>

      {/* Управление количеством */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleDecrease}
          disabled={quantity <= 1}
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={t('cart.decreaseQuantity') || 'Decrease'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="w-8 text-center font-medium">{quantity}</span>
        <button
          onClick={handleIncrease}
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 transition-colors"
          title={t('cart.increaseQuantity') || 'Increase'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Сумма */}
      <div className="w-24 text-right">
        <p className="font-semibold text-gray-900">
          {formatPrice(itemTotal)}
        </p>
        {quantity > 1 && (
          <p className="text-xs text-gray-500">
            {formatPrice(productPrice)} × {quantity}
          </p>
        )}
      </div>

      {/* Кнопка удаления */}
      <button
        onClick={() => onRemove(item.id)}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
        title={t('common.delete') || 'Remove'}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
