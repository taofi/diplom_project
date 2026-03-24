'use client';

import { useEffect, useState } from 'react';
import { getUserProducts, downloadProduct, UserProductResponse } from '@/lib/api-user-products';
import { chatApi } from '@/lib/api-chat';
import { useI18n } from '@/context/i18n/I18nContext';
import { Card, Button } from '@/components/ui';
import { Spinner } from '@/components/ui/Spinner';
import { ServerImage } from '@/components/Image';
import { useRouter } from 'next/navigation';

export function PurchasedProducts() {
  const { t } = useI18n();
  const router = useRouter();
  const [products, setProducts] = useState<UserProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [contactingId, setContactingId] = useState<number | null>(null);

  useEffect(() => {
    getUserProducts()
      .then(setProducts)
      .catch((error) => {
        console.error('Failed to load purchased products:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleDownload = async (product: UserProductResponse) => {
    try {
      setDownloadingId(product.id);
      const blob = await downloadProduct(product.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Используем реальное имя файла из fileUrl, сохраняя оригинальное расширение
      const fileName = product.fileUrl.split('/').pop() || `${product.productName}.jpg`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download product:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleContactAuthor = async (product: UserProductResponse) => {
    try {
      setContactingId(product.id);
      // Создаём чат напрямую в БД с visibility: PENDING
      const chat = await chatApi.createChat(
        product.sellerId,
        product.productId,
        product.id
      );
      // Переходим на страницу чатов
      router.push(`/chat?roomId=${chat.id}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
    } finally {
      setContactingId(null);
    }
  };

  if (loading) {
    return (
      <Card padding="lg" className="mt-6">
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="mt-6">
      <h3 className="text-xl font-bold mb-4 text-primary">
        {t('profile.myPurchases')}
      </h3>
      
      {products.length === 0 ? (
        <p className="text-gray-500">{t('profile.noPurchases')}</p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {product.productImage && (
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                    <ServerImage
                      src={product.productImage}
                      alt={product.productName}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {product.productName}
                  </h4>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">{t('profile.license')}:</span> {product.licenseTypeName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t('profile.purchased')}: {product.purchasedAt ? new Date(product.purchasedAt).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => handleDownload(product)}
                disabled={downloadingId === product.id}
                variant="primary"
                className="ml-4 flex-shrink-0"
              >
                {downloadingId === product.id ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    {t('profile.downloading')}
                  </span>
                ) : (
                  t('profile.download')
                )}
              </Button>
              <Button
                onClick={() => handleContactAuthor(product)}
                disabled={contactingId === product.id}
                variant="secondary"
                className="ml-2 flex-shrink-0"
              >
                {contactingId === product.id ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                  </span>
                ) : (
                  t('profile.contactAuthor')
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
