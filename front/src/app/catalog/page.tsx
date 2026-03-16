'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { getProducts, type ProductQueryParams } from '@/lib/api-product';
import { ProductType } from '@/types/product';
import { ProductCard } from '@/components/ProductCard';
import type { ProductResponse } from '@/types/product';

type SortOption = 'newest' | 'price_asc' | 'price_desc';

export default function CatalogPage() {
  const { t, locale } = useI18n();
  
  // State
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ProductType | ''>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
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
      <div className="relative h-[200px] w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
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
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">{t('catalog.filter')}</h2>
              
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  {t('catalog.search')}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('catalog.searchPlaceholder')}
                  className="w-full px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  {t('catalog.type')}
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ProductType | '')}
                  className="w-full px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('catalog.all')}</option>
                  <option value={ProductType.BRUSH}>{t('catalog.brushes')}</option>
                  <option value={ProductType.ILLUSTRATION}>{t('catalog.illustrations')}</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  {t('catalog.priceRange')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder={t('catalog.from')}
                    className="w-full px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder={t('catalog.to')}
                    className="w-full px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 text-primary border border-primary rounded-md hover:bg-primary/10 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Sort */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-600">
                {products.length} {t('nav.products')}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="newest">{t('catalog.sortNewest')}</option>
                <option value="price_asc">{t('catalog.sortPriceAsc')}</option>
                <option value="price_desc">{t('catalog.sortPriceDesc')}</option>
              </select>
            </div>

            {/* Products Grid */}
            {loading && products.length === 0 ? (
              <div className="flex justify-center py-12">
                <div className="text-gray-500">{t('common.loading')}</div>
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
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {loading ? t('common.loading') : t('catalog.loadMore')}
                    </button>
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
