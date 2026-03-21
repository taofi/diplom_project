'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { useAuth } from '@/context/auth/AuthContext';
import { getCategories } from '@/lib/api-category';
import { getProducts, deleteProduct, activateProduct, deactivateProduct } from '@/lib/api-product';
import type { ProductQueryParams, ProductResponse } from '@/types/product';
import type { CategoryResponse } from '@/types/category';
import { Button, Spinner, ConfirmModal, Select, Pagination } from '@/components/ui';
import { AdminProductCard } from '@/components/admin/AdminProductCard';
import { ProductSearch, type SearchFilters } from '@/components/product/ProductSearch';
import { ProductSort, type SortOption } from '@/components/product/ProductSort';

export default function AdminProductsPage() {
  const { t, locale } = useI18n();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Состояние продуктов и пагинации
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ 
    total: 0, 
    page: 1, 
    limit: 12, 
    totalPages: 1 
  });

  // Удаление
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Статус товара (для фильтрации)
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Категории и фильтры
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    search: '',
    type: '',
    categoryId: '',
  });

  // Сортировка
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Проверка прав доступа
  useEffect(() => {
    if (authLoading) return;
    if (!user || (!user.roles.includes('admin') && !user.roles.includes('author'))) {
      router.push(`/${locale}/login`);
    }
  }, [user, authLoading, locale, router]);

  // Загрузка категорий (только один раз при смене языка)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories({ language: locale });
        setCategories(data || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, [locale]);

  // Основная функция загрузки данных
  const doFetchProducts = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params: ProductQueryParams = {
        page: pageNum,
        limit: 12,
        language: locale,
      };

      if (statusFilter !== '') {
        params.isActive = statusFilter === 'true';
      }

      if (searchFilters.search) params.search = searchFilters.search;
      if (searchFilters.type) params.type = searchFilters.type;
      if (searchFilters.categoryId) params.categoryId = Number(searchFilters.categoryId);

      // Sorting
      switch (sortBy) {
        case 'price_asc':
          params.sortBy = 'price';
          params.sortOrder = 'asc';
          break;
        case 'price_desc':
          params.sortBy = 'price';
          params.sortOrder = 'desc';
          break;
        case 'newest':
        default:
          params.sortBy = 'created_at';
          params.sortOrder = 'desc';
      }

      const result = await getProducts(params);
      
      setProducts(result.data || []);
      setPagination({
        total: Number(result.meta?.total) || 0,
        page: Number(result.meta?.page) || pageNum,
        limit: Number(result.meta?.limit) || 12,
        totalPages: Number(result.meta?.totalPages) || 1,
      });
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(t('errors.failedToLoad') || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [locale, searchFilters, statusFilter, sortBy, t]);

  // Загрузка при изменении фильтров или инициализации
  useEffect(() => {
    const canAccess = user && (user.roles.includes('admin') || user.roles.includes('author'));
    if (canAccess && !authLoading) {
      doFetchProducts(1);
    }
  }, [searchFilters, statusFilter, sortBy, authLoading, user, doFetchProducts]);

  const handleSearchChange = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
  }, []);

  const handleDeleteClick = (productId: number) => {
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete);
      setDeleteModalOpen(false);
      setProductToDelete(null);
      // Если удалили последний элемент на странице, переходим назад
      const targetPage = products.length === 1 && pagination.page > 1 
        ? pagination.page - 1 
        : pagination.page;
      doFetchProducts(targetPage);
    } catch (err) {
      setError('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (product: ProductResponse) => {
    try {
      const isActive = product.isActive;
      if (isActive) {
        await deactivateProduct(product.id);
      } else {
        await activateProduct(product.id);
      }
      // Обновляем текущую страницу
      doFetchProducts(pagination.page);
    } catch (err) {
      setError('Failed to update product status');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-20 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('admin.products.title')}
          </h1>
          <Button onClick={() => router.push(`/${locale}/admin/products/new`)}>
            {t('admin.products.createNew')}
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <ProductSearch
                categories={categories}
                onSearch={handleSearchChange}
                showReset={true}
              />

              <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.products.status') || 'Status'}
                </label>
                <Select
                  name="status"
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  options={[
                    { value: '', label: t('admin.products.allStatuses') || 'All statuses' },
                    { value: 'true', label: t('admin.products.active') || 'Active' },
                    { value: 'false', label: t('admin.products.inactive') || 'Inactive' },
                  ]}
                />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Sort */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">
                {pagination.total} {t('nav.products')}
              </span>
              <ProductSort
                value={sortBy}
                onChange={setSortBy}
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-lg">{t('admin.products.noProducts')}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
                  {products.map((product) => (
                    <AdminProductCard
                      key={product.id}
                      product={product}
                      onEdit={(id) => router.push(`/${locale}/admin/products/${id}`)}
                      onToggleActive={() => handleToggleActive(product)}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>

                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={doFetchProducts}
                  className="mt-8"
                />
              </>
            )}
          </main>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('admin.products.delete')}
        message={t('admin.products.confirmDelete')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}