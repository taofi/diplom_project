'use client';

import { useI18n } from '@/context/i18n/I18nContext';
import { Button } from './Button';

export interface PaginationProps {
  /** Текущая страница */
  currentPage: number;
  /** Всего страниц */
  totalPages: number;
  /** Callback при изменении страницы */
  onPageChange: (page: number) => void;
  /** Дополнительные классы для контейнера */
  className?: string;
}

/**
 * Универсальный компонент пагинации
 * Используется на странице каталога, в админ-панели (товары и пользователи)
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  const { t } = useI18n();

  // Не показываем пагинацию если всего 1 страница
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex justify-center items-center gap-4 ${className}`}>
      <Button
        variant="outline"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        {t('common.previous')}
      </Button>
      
      <span className="text-sm font-medium text-gray-700">
        {currentPage} / {totalPages}
      </span>
      
      <Button
        variant="outline"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        {t('common.next')}
      </Button>
    </div>
  );
}
