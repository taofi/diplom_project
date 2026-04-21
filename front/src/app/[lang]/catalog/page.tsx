'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { getProducts, type ProductQueryParams } from '@/lib/api-product';
import { getCategories } from '@/lib/api-category';
import { ProductType } from '@/types/product';
import { ProductCard } from '@/components/ProductCard';
import type { ProductResponse } from '@/types/product';
import type { CategoryResponse } from '@/types/category';
import { Button, Spinner, Pagination } from '@/components/ui';
import { ProductSearch, type SearchFilters } from '@/components/product/ProductSearch';
import { ProductSort, type SortOption } from '@/components/product/ProductSort';



export default function CatalogPage() {
  const { t, locale } = useI18n();
  
  // State
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    search: '',
    type: '',
    categoryId: '',
    sellerId: '',
  });
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [pagination, setPagination] = useState({ 
    total: 0, 
    page: 1, 
    limit: 12, 
    totalPages: 1 
  });
  
  const limit = 12;

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

  // Fetch products
  const doFetchProducts = useCallback(async (pageNum: number = 1) => {
    setLoading(true);

    const params: ProductQueryParams = {
      page: pageNum,
      limit,
      language: locale,
      isActive: true,
    };

    // Search filters from ProductSearch
    if (searchFilters.search) {
      params.search = searchFilters.search;
    }
    if (searchFilters.type) {
      params.type = searchFilters.type;
    }
    if (searchFilters.categoryId) {
      params.categoryId = Number(searchFilters.categoryId);
    }
    if (searchFilters.sellerId) {
      params.sellerId = Number(searchFilters.sellerId);
    }

    // Price range
    if (minPrice) {
      params.minPrice = parseFloat(minPrice);
    }
    if (maxPrice) {
      params.maxPrice = parseFloat(maxPrice);
    }

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

    try {
      const response = await getProducts(params);
      
      // Заменяем данные, а не накапливаем
      setProducts(response.data || []);
      
      // Обновляем пагинацию
      setPagination({
        total: Number(response.meta?.total) || 0,
        page: Number(response.meta?.page) || pageNum,
        limit: Number(response.meta?.limit) || limit,
        totalPages: Number(response.meta?.totalPages) || 1,
      });
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchFilters, minPrice, maxPrice, sortBy, locale]);

  const authorOptions = useMemo(() => {
    const map = new Map<number, string>();
    products.forEach((product) => {
      const authorId = product.author?.id ?? product.seller?.id;
      const authorName = product.author?.name ?? product.seller?.name ?? product.seller?.username;
      if (authorId && authorName) {
        map.set(authorId, authorName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  // Сброс на страницу 1 при изменении фильтров
  useEffect(() => {
    doFetchProducts(1);
  }, [searchFilters, minPrice, maxPrice, sortBy, locale]);

  // Обработчик изменения страницы
  const handlePageChange = (newPage: number) => {
    doFetchProducts(newPage);
  };

  // Обработчик поиска от ProductSearch
  const handleSearchChange = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
  }, []);

  // Reset filters
  const handleReset = () => {
    setSearchFilters({
      search: '',
      type: '',
      categoryId: '',
      sellerId: '',
    });
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  return (
    <div className="w-full">
      {/* Hero Banner */}
      <div className="-mx-20 mt-19">
        <div className="relative h-[200px] w-full overflow-hidden">
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-primary">
              {t('catalog.title')}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-4">
              {/* ProductSearch - единый компонент поиска и фильтрации */}
              <ProductSearch
                categories={categories}
                authors={authorOptions}
                foundCount={pagination.total}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onMinPriceChange={setMinPrice}
                onMaxPriceChange={setMaxPrice}
                onSearch={handleSearchChange}
                showReset={true}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Sort */}
            <div className="flex justify-end items-center mb-6">
              <ProductSort
                value={sortBy}
                onChange={setSortBy}
              />
            </div>

            {/* Products Grid */}
            {loading && products.length === 0 ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex justify-center py-12">
                <div className="text-gray-500">{t('catalog.noProducts')}</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
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
    </div>
  );
}
