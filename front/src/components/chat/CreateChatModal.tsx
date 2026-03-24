'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n/I18nContext';
import { Modal, Button, Spinner } from '@/components/ui';
import { ServerImage } from '@/components/Image';
import { chatApi } from '@/lib/api-chat';
import { getUserProducts, UserProductResponse } from '@/lib/api-user-products';

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId?: number;
  productId?: number;
}

export function CreateChatModal({
  isOpen,
  onClose,
  sellerId,
  productId,
}: CreateChatModalProps) {
  const { t } = useI18n();
  const router = useRouter();
  
  const [products, setProducts] = useState<UserProductResponse[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<UserProductResponse | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load purchased products when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  // Auto-select product if productId is provided
  useEffect(() => {
    if (productId && products.length > 0) {
      const product = products.find(p => p.productId === productId);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [productId, products]);

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    setError(null);
    try {
      const userProducts = await getUserProducts();
      setProducts(userProducts);
      
      // If sellerId is provided, filter products by seller
      if (sellerId) {
        const filtered = userProducts.filter(p => p.sellerId === sellerId);
        if (filtered.length > 0) {
          setProducts(filtered);
        }
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError(t('chat.errorLoadingProducts'));
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !message.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Создаем чат напрямую в БД (с visibility: PENDING)
      const chat = await chatApi.createChat(
        selectedProduct.sellerId,
        selectedProduct.productId,
        selectedProduct.id
      );

      // Отправляем первое сообщение, чтобы сделать чат видимым для автора
      await chatApi.sendMessage(chat.id, message.trim());

      // Переходим на страницу чата с ID комнаты
      router.push(`/chat?roomId=${chat.id}`);
      
      // Закрываем модальное окно
      onClose();
      
      // Сбрасываем форму
      setSelectedProduct(null);
      setMessage('');
    } catch (err) {
      console.error('Error creating chat:', err);
      setError(t('chat.errorCreatingChat'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setSelectedProduct(null);
      setMessage('');
      setError(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('chat.contactAuthor')}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {isLoadingProducts ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 mx-auto text-gray-300 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-gray-500">{t('chat.noPurchasedProducts')}</p>
          </div>
        ) : (
          <>
            {/* Product selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('chat.selectProduct')}
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className={`
                      w-full p-3 rounded-lg border-2 text-left transition-colors
                      ${
                        selectedProduct?.id === product.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {product.productImage && (
                        <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden">
                          <ServerImage
                            src={product.productImage}
                            alt={product.productName}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {product.productName}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {product.licenseTypeName}
                        </p>
                      </div>
                      {selectedProduct?.id === product.id && (
                        <svg
                          className="w-5 h-5 text-primary flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Message input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('chat.message')}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('chat.messagePlaceholder')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                disabled={isLoading}
              />
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!selectedProduct || !message.trim() || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                {t('common.loading')}
              </span>
            ) : (
              t('chat.startChat')
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
