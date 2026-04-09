'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { useCart } from '@/context/cart/CartContext';
import { getProductById, getProducts } from '@/lib/api-product';
import { chatApi } from '@/lib/api-chat';
import { Gallery, ProductSidebar, ProductInfo } from '@/components/product';
import { ProductCard } from '@/components/ProductCard';
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
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductResponse[]>([]);

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

        const primaryCategoryId = data.categories?.[0]?.id;
        if (primaryCategoryId) {
          const recommendations = await getProducts({
            categoryId: primaryCategoryId,
            type: data.type,
            isActive: true,
            language: locale,
            page: 1,
            limit: 8,
          });

          setRecommendedProducts(
            (recommendations.data || [])
              .filter((item) => item.id !== data.id)
              .slice(0, 4)
          );
        } else {
          setRecommendedProducts([]);
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

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedLicense || !product) return;
    
    setIsAddingToCart(true);
    try {
      await addItem({
        productId: product.id,
        licenseTypeId: selectedLicense.licenseTypeId,
        quantity,
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

  const handleWriteToAuthor = async () => {
    if (!product?.seller?.id || isCreatingChat) return;

    try {
      setIsCreatingChat(true);
      const chat = await chatApi.createChat(product.seller.id, product.id);
      router.push(`/${locale}/chat?roomId=${chat.id}`);
    } catch (err) {
      console.error('Failed to create chat with author:', err);
      toastError(t('errors.generic') || 'Не удалось открыть чат с автором');
    } finally {
      setIsCreatingChat(false);
    }
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

        {product.seller?.id && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleWriteToAuthor}
              disabled={isCreatingChat}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingChat
                ? t('profile.downloading') || 'Открываем чат...'
                : t('product.writeToAuthor') || 'Написать автору'}
            </button>
          </div>
        )}

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
              onQuantityChange={handleQuantityChange}
              quantity={quantity}
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

        {product.categories && product.categories.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('product.categories') || 'Categories'}
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => router.push(`/${locale}/catalog?category=${category.id}`)}
                  className="rounded-full bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors"
                >
                  {category.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {recommendedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {t('product.recommendations') || 'Recommended products'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((recommendedProduct) => (
                <ProductCard key={recommendedProduct.id} product={recommendedProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
