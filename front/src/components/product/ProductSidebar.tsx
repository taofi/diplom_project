'use client';

import { useState } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { Button } from '@/components/ui';
import type { LicenseInfo } from '@/types/product';

interface ProductSidebarProps {
  price: number;
  discountPrice?: number | null;
  licenses: LicenseInfo[];
  selectedLicense: LicenseInfo | null;
  onLicenseChange: (license: LicenseInfo) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  isAddingToCart?: boolean;
}

export function ProductSidebar({
  price,
  discountPrice,
  licenses,
  selectedLicense,
  onLicenseChange,
  onAddToCart,
  onBuyNow,
  isAddingToCart = false,
}: ProductSidebarProps) {
  const { t } = useI18n();

  // Вычисление отображаемой цены
  const displayPrice = selectedLicense?.price ?? discountPrice ?? price;

  return (
    <div className="top-4">
      {/* Цена */}
      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900">
          ${displayPrice.toFixed(2)}
        </span>
        {discountPrice && discountPrice < price && (
          <span className="ml-2 text-xl text-gray-400 line-through">
            ${price.toFixed(2)}
          </span>
        )}
      </div>

      {/* Выбор лицензии */}
      {licenses.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('product.license.select') || 'Выберите лицензию'}
          </label>
          <div className="space-y-2">
            {licenses.map((license) => (
              <label
                key={license.id}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                  selectedLicense?.id === license.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="license"
                    checked={selectedLicense?.id === license.id}
                    onChange={() => onLicenseChange(license)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="font-medium">
                    {license.licenseType?.name || license.licenseType?.slug}
                  </span>
                </div>
                <span className="font-bold text-gray-900">
                  ${license.price.toFixed(2)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex gap-3 mb-4">
        <Button
          onClick={onAddToCart}
          variant="outline"
          className="flex-1"
          disabled={isAddingToCart}
          loading={isAddingToCart}
        >
          {t('product.addToCart') || 'Add to cart'}
        </Button>
        <Button onClick={onBuyNow} className="flex-1">
          {t('product.buyNow') || 'Buy now'}
        </Button>
      </div>
    </div>
  );
}
