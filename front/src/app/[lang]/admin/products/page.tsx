'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { useAuth } from '@/context/auth/AuthContext';
import { getCategories } from '@/lib/api-category';
import { getProducts, deleteProduct, activateProduct, deactivateProduct } from '@/lib/api-product';
import type { ProductQueryParams, ProductResponse } from '@/types/product';
import type { CategoryResponse } from '@/types/category';
import { Button, Spinner, ConfirmModal } from '@/components/ui';
import { AdminProductCard } from '@/components/admin/AdminProductCard';
import { ProductFilters, type FilterValues } from '@/components/admin/ProductFilters';

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

  // Категории и фильтры
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterValues>({
    search: '',
    type: '',
    status: '',
    categoryId: '',
  });

  const limit = 12;

  // Проверка прав доступа
  useEffect(() => {
    if (authLoading) return;
    if (!user || (!user.roles.includes('admin') && !user.roles.includes('author'))) {
      router.push(`/${locale}/login`);
    }
  }, [user, authLoading, locale, router]);

  // Загрузка категорий
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

  // Основная функция загрузки данных
  const doFetchProducts = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params: ProductQueryParams = {
        page: pageNum, // Здесь pageNum уже гарантированно число
        limit,
        language: locale,
      };

      if (currentFilters.status !== '') {
        params.isActive = currentFilters.status === 'true';
      }
      if (currentFilters.search) {
        params.search = currentFilters.search;
      }
      if (currentFilters.type) {
        params.type = currentFilters.type;
      }
      if (currentFilters.categoryId) {
        params.categoryId = Number(currentFilters.categoryId);
      }

      const result = await getProducts(params);
      
      setProducts(result.data || []);
      
      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: принудительно приводим всё к Number
      setPagination({
        total: Number(result.meta?.total) || 0,
        page: Number(result.meta?.page) || pageNum,
        limit: Number(result.meta?.limit) || limit,
        totalPages: Number(result.meta?.totalPages) || 1,
      });
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [locale, currentFilters]);

  // Сброс на 1 страницу при изменении фильтров
  useEffect(() => {
    if (user && (user.roles.includes('admin') || user.roles.includes('author'))) {
      doFetchProducts(1);
    }
  }, [user, currentFilters, doFetchProducts]);

  const handleFilterChange = useCallback((filters: FilterValues) => {
    setCurrentFilters(filters);
  }, []);

  // Handlers
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
      doFetchProducts(pagination.page);
    } catch (err) {
      setError('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (product: any) => {
    try {
      // Поддержка обоих вариантов именования поля активности
      const isActive = product.is_active ?? product.isActive;
      if (isActive) {
        await deactivateProduct(product.id);
      } else {
        await activateProduct(product.id);
      }
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('admin.products.title')}
          </h1>
          <Button onClick={() => router.push(`/${locale}/admin/products/new`)}>
            {t('admin.products.createNew')}
          </Button>
        </div>

        {/* Filters */}
        <ProductFilters
          categories={categories}
          onFilterChange={handleFilterChange}
        />

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
            {t('admin.products.noProducts')}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <AdminProductCard
                  key={product.id}
                  product={product}
                  onEdit={(id) => router.push(`/${locale}/admin/products/${id}`)}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>

            {/* Pagination - ИСПРАВЛЕНО */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => doFetchProducts(Number(pagination.page) - 1)}
                >
                  {t('common.previous')}
                </Button>
                
                <span className="text-sm font-medium text-gray-700">
                  {pagination.page} / {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => doFetchProducts(Number(pagination.page) + 1)}
                >
                  {t('common.next')}
                </Button>
              </div>
            )}
          </>
        )}
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