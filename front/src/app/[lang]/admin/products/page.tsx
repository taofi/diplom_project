'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { useAuth } from '@/context/auth/AuthContext';
import { 
  getProducts, 
  deleteProduct, 
  activateProduct, 
  deactivateProduct,
  type ProductQueryParams 
} from '@/lib/api-product';
import { getCategories } from '@/lib/api-category';
import { ProductType } from '@/types/product';
import type { ProductResponse } from '@/types/product';
import type { CategoryResponse } from '@/types/category';
import { Button, Input, Select, Card, Spinner } from '@/components/ui';
import { ServerImage } from '@/components/Image';

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

export default function AdminProductsPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ProductType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

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

  // Fetch products
  const fetchProducts = useCallback(async (pageNum: number = 1) => {
    setFetchingProducts(true);
    setError('');

    try {
      const params: ProductQueryParams = {
        page: pageNum,
        limit,
        language: locale,
      };

      // Для админа показываем все товары, для автора - только свои
      // Если передан параметр status - используем его
      if (selectedStatus !== '') {
        params.isActive = selectedStatus === 'true';
      } else {
        // По умолчанию для публичного запроса показываем только активные
        // Но для админа нам нужны все, поэтому передаем явно false
        params.isActive = false;
      }

      // Search
      if (searchQuery) {
        params.search = searchQuery;
      }

      // Type filter
      if (selectedType) {
        params.type = selectedType;
      }

      // Category filter
      if (selectedCategory) {
        params.categoryId = Number(selectedCategory);
      }

      const result = await getProducts(params);
      setProducts(result.data || []);
      setTotalPages(result.meta?.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products');
    } finally {
      setFetchingProducts(false);
    }
  }, [locale, searchQuery, selectedType, selectedStatus, selectedCategory]);

  // Initial fetch
  useEffect(() => {
    if (user && (user.roles.includes('admin') || user.roles.includes('author'))) {
      fetchProducts(1);
    }
  }, [user, fetchProducts]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

  // Handle delete
  const handleDelete = async (productId: number) => {
    if (!confirm(t('admin.products.confirmDelete'))) {
      return;
    }

    try {
      await deleteProduct(productId);
      fetchProducts(page);
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError('Failed to delete product');
    }
  };

  // Handle activate/deactivate
  const handleToggleActive = async (product: ProductResponse) => {
    try {
      if (product.isActive) {
        await deactivateProduct(product.id);
      } else {
        await activateProduct(product.id);
      }
      fetchProducts(page);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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
        <Card className="mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <Input
                name="search"
                type="text"
                placeholder={t('admin.products.search')}
                value={searchQuery}
                onChange={(value) => setSearchQuery(value)}
              />
            </div>

            {/* Type filter */}
            <div className="w-[180px]">
              <Select
                name="type"
                value={selectedType}
                onChange={(value) => setSelectedType(value as ProductType | '')}
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
                onChange={(value) => setSelectedStatus(value)}
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
                onChange={(value) => setSelectedCategory(value as number | '')}
                options={[
                  { value: '', label: t('catalog.allCategories') || 'All categories' },
                  ...(categories.map(cat => ({
                    value: cat.id.toString(),
                    label: cat.name || ''
                  })) || [])
                ]}
              />
            </div>

            {/* Search button */}
            <div>
              <Button type="submit">
                {t('common.search')}
              </Button>
            </div>
          </form>
        </Card>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading || fetchingProducts ? (
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
                <Card key={product.id} className="overflow-hidden">
                  {/* Image */}
                  <div className="relative aspect-square w-full">
                    <ServerImage
                      src={product.mainImage || product.media?.[0]?.url || null}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        product.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? t('admin.products.active') : t('admin.products.inactive')}
                      </span>
                    </div>
                    {/* Type badge */}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                        {product.type === ProductType.BRUSH 
                          ? t('catalog.brushes') 
                          : t('catalog.illustrations')}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate mb-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold text-primary">
                        ${Number(product.price).toFixed(2)}
                      </span>
                      {product.discountPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ${Number(product.discountPrice).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(product.id)}
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant={product.isActive ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleActive(product)}
                      >
                        {product.isActive ? t('admin.products.deactivate') : t('admin.products.activate')}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => fetchProducts(page - 1)}
                >
                  {t('common.previous')}
                </Button>
                <span className="flex items-center px-4 text-gray-600">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => fetchProducts(page + 1)}
                >
                  {t('common.next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
