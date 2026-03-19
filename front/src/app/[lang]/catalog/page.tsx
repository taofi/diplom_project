'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { getProducts, type ProductQueryParams } from '@/lib/api-product';
import { ProductType } from '@/types/product';
import { ProductCard } from '@/components/ProductCard';
import type { ProductResponse } from '@/types/product';
import { Button, Input, Select, Card, Spinner } from '@/components/ui';

type SortOption = 'newest' | 'price_asc' | 'price_desc';

const sortOptions = [
  { value: 'newest', label: 'catalog.sortNewest' },
  { value: 'price_asc', label: 'catalog.sortPriceAsc' },
  { value: 'price_desc', label: 'catalog.sortPriceDesc' },
];

const typeOptions = [
  { value: '', label: 'catalog.all' },
  { value: ProductType.BRUSH, label: 'catalog.brushes' },
  { value: ProductType.ILLUSTRATION, label: 'catalog.illustrations' },
];

export default function CatalogPage() {
  const { t, locale } = useI18n();
  
  // State
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ProductType | ''>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const limit = 12;

  // Fetch products
  const fetchProducts = useCallback(async (pageNum: number = 1, isNewSearch: boolean = false) => {
    setLoading(true);
    
    const params: ProductQueryParams = {
      page: pageNum,
      limit,
      language: locale,
      isActive: true,
    };

    // Search
    if (searchQuery) {
      params.search = searchQuery;
    }

    // Type filter
    if (selectedType) {
      params.type = selectedType;
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
      
      if (isNewSearch) {
        setProducts(response.data);
      } else {
        setProducts(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === limit);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedType, minPrice, maxPrice, sortBy, locale]);

  // Initial load and filter changes
  useEffect(() => {
    setPage(1);
    fetchProducts(1, true);
  }, [searchQuery, selectedType, minPrice, maxPrice, sortBy, fetchProducts]);

  // Load more
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(page + 1, false);
    }
  };

  // Reset filters
  const handleReset = () => {
    setSearchQuery('');
    setSelectedType('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  return (
    <div className="w-full">
      {/* Hero Banner */}
      <div className="relative h-[200px] mt-20 w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-primary">
            {t('catalog.title')}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <Card padding="md" className="sticky top-4">
              <h2 className="text-lg font-semibold mb-4">{t('catalog.filter')}</h2>
              
              {/* Search */}
              <div className="mb-6">
                <Input
                  type="text"
                  name="search"
                  label={t('catalog.search')}
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={t('catalog.searchPlaceholder')}
                />
              </div>

              {/* Type Filter */}
              <div className="mb-6">
                <Select
                  name="type"
                  label={t('catalog.type')}
                  value={selectedType}
                  onChange={(value) => setSelectedType(value as ProductType | '')}
                  options={typeOptions.map(opt => ({ value: opt.value, label: t(opt.label) }))}
                />
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  {t('catalog.priceRange')}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    name="minPrice"
                    value={minPrice}
                    onChange={setMinPrice}
                    placeholder={t('catalog.from')}
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    name="maxPrice"
                    value={maxPrice}
                    onChange={setMaxPrice}
                    placeholder={t('catalog.to')}
                  />
                </div>
              </div>

              {/* Reset Button */}
              <Button variant="outline" fullWidth onClick={handleReset}>
                {t('common.cancel')}
              </Button>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Sort */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-600">
                {products.length} {t('nav.products')}
              </span>
              <Select
                name="sort"
                value={sortBy}
                onChange={(value) => setSortBy(value as SortOption)}
                options={sortOptions.map(opt => ({ value: opt.value, label: t(opt.label) }))}
                className="w-auto"
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

                {/* Load More */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loading}
                      loading={loading}
                    >
                      {loading ? t('common.loading') : t('catalog.loadMore')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
