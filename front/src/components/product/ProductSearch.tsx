'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { ProductType } from '@/types/product';
import type { CategoryResponse } from '@/types/category';
import { Input, Select, Card, Button } from '@/components/ui';

/**
 * Интерфейс пропсов для компонента ProductSearch
 */
export interface ProductSearchProps {
  /** Список категорий для фильтрации */
  categories: CategoryResponse[];
  /** Callback при изменении фильтров */
  onSearch: (filters: SearchFilters) => void;
  /** Начальные значения фильтров */
  initialValues?: SearchFilters;
  /** Показывать ли кнопку сброса */
  showReset?: boolean;
  /** Дополнительные классы для контейнера */
  className?: string;
}

/**
 * Интерфейс значений фильтров поиска
 */
export interface SearchFilters {
  /** Поисковый запрос */
  search: string;
  /** Тип товара */
  type: ProductType | '';
  /** ID категории */
  categoryId: number | '';
}

/** Опции для типа товара */
const typeOptions = [
  { value: '', label: 'catalog.all' },
  { value: ProductType.BRUSH, label: 'catalog.brushes' },
  { value: ProductType.ILLUSTRATION, label: 'catalog.illustrations' },
];

/**
 * Debounce хук для задержки поиска
 */
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

/**
 * Компонент поиска и фильтрации товаров
 * Используется на странице каталога и в админ-панели
 */
export function ProductSearch({
  categories,
  onSearch,
  initialValues,
  showReset = true,
  className = '',
}: ProductSearchProps) {
  const { t } = useI18n();

  // Состояние фильтров
  const [search, setSearch] = useState(initialValues?.search || '');
  const [selectedType, setSelectedType] = useState<ProductType | ''>(initialValues?.type || '');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>(initialValues?.categoryId || '');

  // Debounce для поиска (задержка 500ms)
  const debouncedSearch = useDebounce(search, 500);

  // Формируем значения фильтров
  const filterValues = useMemo((): SearchFilters => ({
    search: debouncedSearch,
    type: selectedType,
    categoryId: selectedCategory,
  }), [debouncedSearch, selectedType, selectedCategory]);

  // Вызываем callback при изменении фильтров
  useEffect(() => {
    onSearch(filterValues);
  }, [filterValues, onSearch]);

  // Обработчики изменений
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleTypeChange = useCallback((value: string) => {
    setSelectedType(value as ProductType | '');
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value ? Number(value) : '');
  }, []);

  // Сброс фильтров
  const handleReset = useCallback(() => {
    setSearch('');
    setSelectedType('');
    setSelectedCategory('');
  }, []);

  // Проверка, есть ли активные фильтры
  const hasActiveFilters = search || selectedType || selectedCategory;

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex flex-col gap-4">
        {/* Заголовок */}
        <h3 className="text-lg font-semibold text-gray-900">
          {t('catalog.filter')}
        </h3>

        {/* Поиск по названию */}
        <div>
          <Input
            type="text"
            name="search"
            label={t('catalog.search')}
            value={search}
            onChange={handleSearchChange}
            placeholder={t('catalog.searchPlaceholder')}
          />
        </div>

        {/* Фильтр по типу товара */}
        <div>
          <Select
            name="type"
            label={t('catalog.type')}
            value={selectedType}
            onChange={handleTypeChange}
            options={typeOptions.map(opt => ({
              value: opt.value,
              label: t(opt.label) || opt.value
            }))}
          />
        </div>

        {/* Фильтр по категории */}
        <div>
          <Select
            name="category"
            label={t('catalog.category')}
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

        {/* Кнопка сброса */}
        {showReset && hasActiveFilters && (
          <Button
            variant="outline"
            fullWidth
            onClick={handleReset}
          >
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </Card>
  );
}
