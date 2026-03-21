'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { getProducts, type ProductQueryParams } from '@/lib/api-product';
import { ProductCard } from '@/components/ProductCard';
import type { ProductResponse } from '@/types/product';

export function LatestProducts() {
  const { t, locale } = useI18n();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        const params: ProductQueryParams = {
          page: 1,
          limit: 4,
          language: locale,
          isActive: true,
          sortBy: 'created_at',
          sortOrder: 'desc',
        };

        const response = await getProducts(params);
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch latest products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProducts();
  }, [locale]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-secondary/30 rounded-xl h-64"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
