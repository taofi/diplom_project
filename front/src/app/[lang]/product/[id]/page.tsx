'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { useCart } from '@/context/cart/CartContext';
import { getProductById } from '@/lib/api-product';
import { Gallery, ProductSidebar, ProductInfo } from '@/components/product';
import { Spinner } from '@/components/ui';
import { toastSuccess, toastError } from '@/lib/toast';
import type { ProductResponse, LicenseInfo } from '@/types/product';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useI18n();
  const { addItem } = useCart();

  const productId = Number(params.id);

  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<LicenseInfo | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Загрузка товара
  useEffect(() => {
    async function loadProduct() {
      if (!productId || isNaN(productId)) {
        setError('Invalid product ID');
        setLoading(false);
        return;
      }

      try {
        const data = await getProductById(productId, locale);
        setProduct(data);

        // Выбрать первую лицензию по умолчанию
        if (data.licenses && data.licenses.length > 0) {
          setSelectedLicense(data.licenses[0]);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
        setError(t('errors.productNotFound') || 'Product not found');
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId, locale, t]);

  // Обработчики
  const handleLicenseChange = (license: LicenseInfo) => {
    setSelectedLicense(license);
  };

  const handleAddToCart = async () => {
    if (!selectedLicense || !product) return;
    
    setIsAddingToCart(true);
    try {
      await addItem({
        productId: product.id,
        licenseTypeId: selectedLicense.licenseTypeId,
      });
      toastSuccess(t('product.addedToCart') || 'Added to cart!');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      toastError(t('errors.addToCartFailed') || 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    // Добавить в корзину и перейти к оформлению
    await handleAddToCart();
    router.push(`/${locale}/cart`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen mt-20 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen mt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('notFound.title') || 'Product not found'}
          </h1>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-primary hover:underline"
          >
            {t('common.back') || 'Go back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-20 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Заголовок и информация о товаре */}
        <ProductInfo
          name={product.name}
          description={product.description}
          seller={product.seller}
          isFeatured={product.isFeatured}
          categories={product.categories}
          productType={product.type}
        />

        {/* Основной контент */}
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          {/* Галерея - 2/3 */}
          <div className="w-full lg:w-2/3">
            <Gallery
              media={product.media || []}
              productName={product.name}
            />
          </div>

          {/* Сайдбар - 1/3 */}
          <div className="w-full lg:w-1/3">
            <ProductSidebar
              price={product.price}
              discountPrice={product.discountPrice}
              licenses={product.licenses || []}
              selectedLicense={selectedLicense}
              onLicenseChange={handleLicenseChange}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              isAddingToCart={isAddingToCart}
            />

            {/* Описание под кнопками (дополнительно) */}
            {product.description && (
              <div className="mt-8 pt-8 border-t">
                <h2 className="text-lg font-semibold mb-3">
                  {t('product.description') || 'Description'}
                </h2>
                <div
                  className="text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
