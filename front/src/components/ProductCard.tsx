'use client';

import { ServerImage } from './Image';
import type { ProductResponse } from '@/types/product';

interface ProductCardProps {
  product: ProductResponse;
  className?: string;
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
  // Используем mainImage или первое изображение из media
  const imageUrl = product.mainImage || product.media?.[0]?.url || null;
  
  // Вычисляем цену: если есть скидка - показываем её
  const displayPrice = Number(product.discountPrice ?? product.price);

  return (
    <div 
      className={`rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${className}`}
    >
      {/* Изображение */}
      <div className="relative aspect-square w-full">
        <ServerImage
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Блок с названием и ценой */}
      <div className="px-8 py-5 flex justify-between items-center">
        <h3 className="text-base font-medium text-gray-900 truncate pr-4">
          {product.name}
        </h3>
        <span className="text-base font-semibold text-primary whitespace-nowrap">
          ${displayPrice.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
