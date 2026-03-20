'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { ProductType } from '@/types/product';
import type { CategoryResponse } from '@/types/category';
import { Input, Select, Card } from '@/components/ui';

interface ProductFiltersProps {
  categories: CategoryResponse[];
  onFilterChange: (filters: FilterValues) => void;
}

export interface FilterValues {
  search: string;
  type: ProductType | '';
  status: string;
  categoryId: number | '';
}

const typeOptions = [
  { value: '', label: 'catalog.all' },
  { value: ProductType.BRUSH, label: 'catalog.brushes' },
  { value: ProductType.ILLUSTRATION, label: 'catalog.illustrations' },
];

const statusOptions = [
  { value: '', label: 'admin.products.allStatuses' },
  { value: 'true', label: 'admin.products.active' },
  { value: 'false', label: 'admin.products.inactive' },
];

// Debounce хук
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function ProductFilters({ categories, onFilterChange }: ProductFiltersProps) {
  const { t } = useI18n();
  
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<ProductType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');

  // Debounce для поиска (задержка 500ms)
  const debouncedSearch = useDebounce(search, 500);

  // Формируем значения фильтров
  const filterValues = useMemo((): FilterValues => ({
    search: debouncedSearch,
    type: selectedType,
    status: selectedStatus,
    categoryId: selectedCategory,
  }), [debouncedSearch, selectedType, selectedStatus, selectedCategory]);

  // Вызываем callback при изменении фильтров
  useEffect(() => {
    onFilterChange(filterValues);
  }, [filterValues, onFilterChange]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleTypeChange = useCallback((value: string) => {
    setSelectedType(value as ProductType | '');
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setSelectedStatus(value);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value ? Number(value) : '');
  }, []);

  return (
    <Card className="mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Input
            name="search"
            type="text"
            placeholder={t('admin.products.search')}
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Type filter */}
        <div className="w-[180px]">
          <Select
            name="type"
            value={selectedType}
            onChange={handleTypeChange}
            options={typeOptions.map(opt => ({
              value: opt.value,
              label: t(opt.label) || opt.value
            }))}
          />
        </div>

        {/* Status filter */}
        <div className="w-[180px]">
          <Select
            name="status"
            value={selectedStatus}
            onChange={handleStatusChange}
            options={statusOptions.map(opt => ({
              value: opt.value,
              label: t(opt.label) || opt.value
            }))}
          />
        </div>

        {/* Category filter */}
        <div className="w-[180px]">
          <Select
            name="category"
            value={selectedCategory}
            onChange={handleCategoryChange}
            options={[
              { value: '', label: t('catalog.allCategories') || 'All categories' },
              ...(categories.map(cat => ({
                value: cat.id.toString(),
                label: cat.name || ''
              })) || [])
            ]}
          />
        </div>
      </div>
    </Card>
  );
}
