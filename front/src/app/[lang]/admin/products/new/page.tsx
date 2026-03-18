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

  if (fetchingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('admin.products.createNew')}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">{t('admin.products.basicInfo')}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('admin.products.name')} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('admin.products.description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('admin.products.type')} *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ProductType)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value={ProductType.BRUSH}>{t('product.types.brush')}</option>
                    <option value={ProductType.ILLUSTRATION}>{t('product.types.illustration')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File & Stock */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">{t('admin.products.fileStock')}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('admin.products.fileUrl')} *
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  required
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('admin.products.price')} *
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min={0}
                    step={0.01}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('admin.products.stock')}
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('admin.products.discountPrice')}
                  </label>
                  <input
                    type="number"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    min={0}
                    step={0.01}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">{t('admin.products.categories')}</h2>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategories.includes(category.id)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Licenses */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t('admin.products.licenses')}</h2>
              <button
                type="button"
                onClick={addLicense}
                className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
              >
                {t('admin.products.addLicense')}
              </button>
            </div>

            <div className="space-y-3">
              {licenses.map((license, index) => (
                <div key={license.id} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <select
                      value={license.licenseTypeId}
                      onChange={(e) => updateLicense(license.id, 'licenseTypeId', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {licenseTypes.map((lt) => (
                        <option key={lt.id} value={lt.id}>
                          {lt.name || lt.slug}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="number"
                      value={license.price}
                      onChange={(e) => updateLicense(license.id, 'price', e.target.value)}
                      placeholder={t('admin.products.price')}
                      min={0}
                      step={0.01}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLicense(license.id)}
                    disabled={licenses.length === 1}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">{t('admin.products.status')}</h2>
            
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary"
                />
                <span>{t('admin.products.active')}</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-primary"
                />
                <span>{t('admin.products.featured')}</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('admin.products.create')}
            </button>
            
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
