'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import type { CategoryResponse } from '@/types/category';

interface CategorySelectorProps {
  categories: CategoryResponse[];
  selectedCategories: number[];
  onToggle: (categoryId: number) => void;
}

export function CategorySelector({
  categories,
  selectedCategories,
  onToggle,
}: CategorySelectorProps) {
  const { t } = useI18n();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">{t('admin.products.categories')}</h2>
      
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onToggle(category.id)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedCategories.includes(category.id)
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
