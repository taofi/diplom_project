'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import type { CategoryResponse } from '@/types/category';
import { Button, Section } from '@/components/ui';

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
    <Section title={t('admin.products.categories')}>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            type="button"
            variant={selectedCategories.includes(category.id) ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onToggle(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>
    </Section>
  );
}
