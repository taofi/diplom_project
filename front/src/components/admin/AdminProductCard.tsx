'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { ProductType } from '@/types/product';
import type { ProductResponse } from '@/types/product';
import { Button, Card } from '@/components/ui';
import { ServerImage } from '@/components/Image';
import { Trash2 } from 'lucide-react';

interface AdminProductCardProps {
  product: ProductResponse;
  onEdit: (id: number) => void;
  onToggleActive: (product: ProductResponse) => void;
  onDelete: (id: number) => void;
}

export function AdminProductCard({
  product,
  onEdit,
  onToggleActive,
  onDelete,
}: AdminProductCardProps) {
  const { t } = useI18n();

  const isActive = (product as unknown as { is_active: boolean }).is_active ?? product.isActive;

  return (
    <Card className="overflow-hidden group relative flex flex-col h-full">
      {/* Кликабельное изображение */}
      <div 
        className="relative aspect-square w-full cursor-pointer overflow-hidden"
        onClick={() => onEdit(product.id)}
      >
        <ServerImage
          src={product.mainImage || product.media?.[0]?.url || null}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Кнопка удаления (иконка) */}
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="danger"
            size="icon"
            className="h-8 w-8 shadow-md"
            onClick={(e) => {
              e.stopPropagation(); // Чтобы не срабатывал переход при клике на удаление
              onDelete(product.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Бейджи статуса и типа */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          <span
            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded shadow-sm ${
              isActive
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {isActive ? t('admin.products.active') : t('admin.products.inactive')}
          </span>
          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm">
            {product.type === ProductType.BRUSH
              ? t('catalog.brushes')
              : t('catalog.illustrations')}
          </span>
        </div>
      </div>

      {/* Контент */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 
          className="font-medium text-gray-900 truncate mb-1 cursor-pointer hover:text-primary transition-colors"
          onClick={() => onEdit(product.id)}
        >
          {product.name}
        </h3>
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-bold text-primary">
            ${Number(product.price).toFixed(2)}
          </span>
          {product.discountPrice && (
            <span className="text-sm text-gray-400 line-through">
              ${Number(product.discountPrice).toFixed(2)}
            </span>
          )}
        </div>

        {/* Только кнопка активации/деактивации */}
        <div className="mt-auto">
          <Button
            variant={isActive ? 'secondary' : 'primary'}
            size="sm"
            fullWidth
            onClick={() => onToggleActive(product)}
          >
            {isActive ? t('admin.products.deactivate') : t('admin.products.activate')}
          </Button>
        </div>
      </div>
    </Card>
  );
}