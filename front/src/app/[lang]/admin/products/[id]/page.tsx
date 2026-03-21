'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { useAuth } from '@/context/auth/AuthContext';
import { getProductWithAllTranslations, updateProduct } from '@/lib/api-product';
import { ProductForm } from '@/components/admin/ProductForm';
import { Spinner } from '@/components/ui';
import type { ProductResponse, UpdateProductDto, TranslationDto } from '@/types/product';

interface EditProductPageProps {
  params: Promise<{
    lang: string;
    id: string;
  }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { t, locale } = useI18n();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [allTranslations, setAllTranslations] = useState<TranslationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paramsResolved, setParamsResolved] = useState<{ lang: string; id: string } | null>(null);

  // Resolve params (Next.js 15+)
  useEffect(() => {
    params.then((resolved) => {
      setParamsResolved(resolved);
    });
  }, [params]);

  // Check if user is admin
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    if (!user || (!user.roles.includes('admin') && !user.roles.includes('author'))) {
      router.push(`/${locale}/login`);
    }
  }, [user, authLoading, locale, router]);

  // Fetch product data with all translations
  useEffect(() => {
    if (!paramsResolved || !locale) return;
    
    async function fetchProduct() {
      try {
        const resolvedParams = paramsResolved;
        if (!resolvedParams) return;
        
        const productId = parseInt(resolvedParams.id);
        if (isNaN(productId)) {
          setError('Invalid product ID');
          return;
        }
        
        // Fetching product with all translations
        const data = await getProductWithAllTranslations(productId);
        
        setProduct(data);
        // Сохраняем все переводы (приводим тип к TranslationDto)
        if (data.translations && data.translations.length > 0) {
          const translated = data.translations.map(t => ({
            language: t.language,
            name: t.name,
            description: t.description ?? undefined,
            shortDescription: t.shortDescription ?? undefined,
          }));
          setAllTranslations(translated);
        }
      } catch (err) {
        console.error('[EditProductPage] Failed to fetch product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProduct();
  }, [paramsResolved, locale]);

  const handleSubmit = async (data: UpdateProductDto) => {
    if (!paramsResolved) return;
    
    // Submitting product update
    
    const productId = parseInt(paramsResolved.id);
    await updateProduct(productId, data, locale);
    router.push(`/${locale}/admin/products/${productId}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen mt-20 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <p className="text-red-500">{error || 'Product not found'}</p>
            <button
              onClick={() => router.push(`/${locale}/admin/products`)}
              className="mt-4 text-blue-500 hover:underline"
            >
              {t('common.back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-20 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('admin.products.edit')}
          </h1>
        </div>

        <ProductForm 
          mode="edit"
          product={product}
          allTranslations={allTranslations}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
