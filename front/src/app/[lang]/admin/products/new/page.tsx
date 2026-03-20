'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { useAuth } from '@/context/auth/AuthContext';
import { createProduct } from '@/lib/api-product';
import { ProductForm } from '@/components/admin/ProductForm';
import type { CreateProductDto, UpdateProductDto } from '@/types/product';

export default function NewProductPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  // Check if user is admin
  useEffect(() => {
    if (!user || (!user.roles.includes('admin') && !user.roles.includes('author'))) {
      router.push(`/${locale}/login`);
    }
  }, [user, locale, router]);

  const handleSubmit = async (data: CreateProductDto | UpdateProductDto) => {
    // Type assertion - we know this is CreateProductDto in this context
    await createProduct(data as CreateProductDto, locale);
    router.push(`/${locale}/admin/products`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen mt-20 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('admin.products.createNew')}
          </h1>
        </div>

        <ProductForm 
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
