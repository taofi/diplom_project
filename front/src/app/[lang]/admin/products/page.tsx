'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { useAuth } from '@/context/auth/AuthContext';
import { getCategories } from '@/lib/api-category';
import { getProducts, deleteProduct, activateProduct, deactivateProduct } from '@/lib/api-product';
import { ProductType } from '@/types/product';
import type { ProductQueryParams, ProductResponse } from '@/types/product';
import type { CategoryResponse } from '@/types/category';
import { Button, Card, Spinner, ConfirmModal } from '@/components/ui';
import { AdminProductCard } from '@/components/admin/AdminProductCard';
import { ProductFilters, type FilterValues } from '@/components/admin/ProductFilters';

export default function AdminProductsPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  
  // Локальный state для продуктов
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });

  // State для модального окна удаления
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Локальный state для категорий
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  
  // Текущие фильтры
  const [currentFilters, setCurrentFilters] = useState<FilterValues>({
    search: '',
    type: '',
    status: '',
    categoryId: '',
  });

  const limit = 12;

  // Check if user is admin or author
  useEffect(() => {
    if (user && !user.roles.includes('admin') && !user.roles.includes('author')) {
      router.push(`/${locale}/login`);
    }
  }, [user, locale, router]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories({ language: locale });
        setCategories(data || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    }
    fetchCategories();
  }, [locale]);

  // Fetch products с учетом фильтров
  const doFetchProducts = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    setError('');
    
    try {
      const params: Record<string, unknown> = {
        page: pageNum,
        limit,
        language: locale,
      };

      // Status filter - только если выбран конкретный статус
      if (currentFilters.status !== '') {
        params.isActive = currentFilters.status === 'true';
      }
      // Если выбраны "все статусы" (пустое значение) - не добавляем isActive

      // Search
      if (currentFilters.search) {
        params.search = currentFilters.search;
      }

      // Type filter
      if (currentFilters.type) {
        params.type = currentFilters.type;
      }

      // Category filter
      if (currentFilters.categoryId) {
        params.categoryId = Number(currentFilters.categoryId);
      }

      const result = await getProducts(params as ProductQueryParams);
      setProducts(result.data || []);
      setPagination({
        total: result.meta?.total || 0,
        page: result.meta?.page || 1,
        limit: result.meta?.limit || 12,
        totalPages: result.meta?.totalPages || 1,
      });
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [locale, currentFilters]);

  // Обработчик изменения фильтров
  const handleFilterChange = useCallback((filters: FilterValues) => {
    setCurrentFilters(filters);
    // doFetchProducts вызовется через useEffect благодаря изменению currentFilters
  }, []);

  // При изменении фильтров - загружаем продукты
  useEffect(() => {
    if (user && (user.roles.includes('admin') || user.roles.includes('author'))) {
      doFetchProducts(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentFilters]);

  // Handle delete - открытие модального окна
  const handleDeleteClick = (productId: number) => {
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  };

  // Подтверждение удаления
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete);
      setDeleteModalOpen(false);
      setProductToDelete(null);
      // Обновляем список после удаления
      doFetchProducts(pagination.page);
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  // Отмена удаления
  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setProductToDelete(null);
  };

  // Handle activate/deactivate
  const handleToggleActive = async (product: ProductResponse) => {
    try {
      if ((product as unknown as { is_active: boolean }).is_active) {
        await deactivateProduct(product.id);
      } else {
        await activateProduct(product.id);
      }
      // Обновляем список после изменения статуса
      doFetchProducts(pagination.page);
    } catch (err) {
      console.error('Failed to toggle product status:', err);
      setError('Failed to update product status');
    }
  };

  // Handle edit
  const handleEdit = (productId: number) => {
    router.push(`/${locale}/admin/products/${productId}`);
  };

  // Handle create new
  const handleCreateNew = () => {
    router.push(`/${locale}/admin/products/new`);
  };

  if (!user || (!user.roles.includes('admin') && !user.roles.includes('author'))) {
    return <Spinner size="lg" />;
  }

  const displayError = error;

  return (
    <div className="min-h-screen mt-20 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('admin.products.title')}
          </h1>
          <Button onClick={handleCreateNew}>
            {t('admin.products.createNew')}
          </Button>
        </div>

        {/* Filters */}
        <ProductFilters
          categories={categories}
          onFilterChange={handleFilterChange}
        />


        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t('admin.products.noProducts')}
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <AdminProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={pagination.page === 1}
                  onClick={() => doFetchProducts(pagination.page - 1)}
                >
                  {t('common.previous')}
                </Button>
                <span className="flex items-center px-4 text-gray-600">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => doFetchProducts(pagination.page + 1)}
                >
                  {t('common.next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно подтверждения удаления */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('admin.products.delete') || 'Удалить товар'}
        message={t('admin.products.confirmDelete') || 'Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.'}
        confirmText={t('common.delete') || 'Удалить'}
        cancelText={t('common.cancel') || 'Отмена'}
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
