'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { Select } from '@/components/ui';

/** Типы сортировки */
export type SortOption = 'newest' | 'price_asc' | 'price_desc';

/** Опции сортировки */
export const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'catalog.sortNewest' },
  { value: 'price_asc', label: 'catalog.sortPriceAsc' },
  { value: 'price_desc', label: 'catalog.sortPriceDesc' },
];

export interface ProductSortProps {
  /** Текущее значение сортировки */
  value: SortOption;
  /** Callback при изменении */
  onChange: (value: SortOption) => void;
  /** Дополнительные классы */
  className?: string;
}

/**
 * Компонент сортировки товаров
 * Используется на странице каталога
 */
export function ProductSort({
  value,
  onChange,
  className = '',
}: ProductSortProps) {
  const { t } = useI18n();

  return (
    <Select
      name="sort"
      value={value}
      onChange={(val) => onChange(val as SortOption)}
      options={sortOptions.map(opt => ({ 
        value: opt.value, 
        label: t(opt.label) 
      }))}
      className={`w-auto ${className}`}
    />
  );
}
