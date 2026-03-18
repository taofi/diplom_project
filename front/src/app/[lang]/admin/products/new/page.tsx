'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { useAuth } from '@/context/auth/AuthContext';
import { createProduct } from '@/lib/api-product';
import { getCategories } from '@/lib/api-category';
import { getLicenseTypes } from '@/lib/api-license-type';
import { ProductType } from '@/types/product';
import type { CategoryResponse } from '@/types/category';
import type { LicenseTypeResponse } from '@/types/license-type';
import { ProductForm } from '@/components/admin/ProductForm';
import { LoadingSpinner } from '@/components/admin/LoadingSpinner';

interface LicenseFormItem {
  id: string;
  licenseTypeId: number;
  price: string;
}

export default function NewProductPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ProductType>(ProductType.BRUSH);
  const [fileUrl, setFileUrl] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState(0);
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Categories
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  
  // Licenses
  const [licenseTypes, setLicenseTypes] = useState<LicenseTypeResponse[]>([]);
  const [licenses, setLicenses] = useState<LicenseFormItem[]>([]);
  
  // Loading state
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState('');

  // Fetch categories and license types
  useEffect(() => {
    async function fetchData() {
      try {
        const [categoriesData, licenseTypesData] = await Promise.all([
          getCategories({ language: locale }),
          getLicenseTypes({ language: locale }),
        ]);
        
        setCategories(categoriesData || []);
        setLicenseTypes(licenseTypesData || []);
        
        // Initialize with one empty license
        if (licenseTypesData && licenseTypesData.length > 0) {
          setLicenses([{
            id: '1',
            licenseTypeId: licenseTypesData[0].id,
            price: '',
          }]);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load categories and license types');
      } finally {
        setFetchingData(false);
      }
    }
    
    fetchData();
  }, [locale]);

  // Check if user is admin
  useEffect(() => {
    if (!user || (!user.role.includes('admin') && !user.role.includes('author'))) {
      router.push(`/${locale}/login`);
    }
  }, [user, locale, router]);

  // Add license row
  const addLicense = () => {
    setLicenses([
      ...licenses,
      {
        id: Date.now().toString(),
        licenseTypeId: licenseTypes[0]?.id || 0,
        price: '',
      },
    ]);
  };

  // Remove license row
  const removeLicense = (id: string) => {
    if (licenses.length > 1) {
      setLicenses(licenses.filter(l => l.id !== id));
    }
  };

  // Update license
  const updateLicense = (id: string, field: 'licenseTypeId' | 'price', value: string | number) => {
    setLicenses(licenses.map(l => 
      l.id === id ? { ...l, [field]: value } : l
    ));
  };

  // Handle category toggle
  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate licenses
      const validLicenses = licenses
        .filter(l => l.licenseTypeId && l.price)
        .map(l => ({
          licenseTypeId: Number(l.licenseTypeId),
          price: Number(l.price),
        }));

      if (validLicenses.length === 0) {
        setError('At least one license is required');
        setLoading(false);
        return;
      }

      const productData = {
        name,
        description: description || undefined,
        type,
        fileUrl,
        sku: sku || undefined,
        stock,
        price: price ? Number(price) : 0,
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        isActive,
        isFeatured,
        categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
        licenses: validLicenses,
      };

      const product = await createProduct(productData, locale);
      router.push(`/${locale}/admin/products/${product.id}`);
    } catch (err: unknown) {
      console.error('Failed to create product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (fetchingData) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('admin.products.createNew')}
          </h1>
        </div>

        <ProductForm
          // Basic info
          name={name}
          onNameChange={setName}
          description={description}
          onDescriptionChange={setDescription}
          type={type}
          onTypeChange={setType}
          sku={sku}
          onSkuChange={setSku}
          
          // File & stock
          fileUrl={fileUrl}
          onFileUrlChange={setFileUrl}
          price={price}
          onPriceChange={setPrice}
          stock={stock}
          onStockChange={setStock}
          discountPrice={discountPrice}
          onDiscountPriceChange={setDiscountPrice}
          
          // Categories
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          
          // Licenses
          licenseTypes={licenseTypes}
          licenses={licenses}
          onAddLicense={addLicense}
          onUpdateLicense={updateLicense}
          onRemoveLicense={removeLicense}
          
          // Status
          isActive={isActive}
          onIsActiveChange={setIsActive}
          isFeatured={isFeatured}
          onIsFeaturedChange={setIsFeatured}
          
          // Form
          error={error}
          loading={loading}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
