'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { CartItemImage } from './CartItemImage';

interface CartItemProps {
  item: {
    id: number;
    productLicenseId?: number;
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
          ${productPrice.toFixed(2)}
        </p>
      </div>

      {/* Больше нет управления количеством - всегда 1 товар */}

      {/* Сумма */}
      <div className="w-24 text-right">
        <p className="font-semibold text-gray-900">
          ${productPrice.toFixed(2)}
        </p>
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
