'use client';

import { useCallback, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { UserAvatarIcon } from '@/components/UserAvatarIcon';
import { Card } from '@/components/ui';
import { useI18n } from '@/context/i18n/I18nContext';
import { chatApi } from '@/lib/api-chat';
import type { AuthorListItem } from '@/types/author';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuthorCardProps {
  author: AuthorListItem;
}

export function AuthorCard({ author }: AuthorCardProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const handleStartChat = useCallback(async () => {
    if (isCreatingChat) {
      return;
    }

    try {
      setIsCreatingChat(true);
      const chat = await chatApi.createChat(author.id);
      router.push(`/${locale}/chat?roomId=${chat.id}`);
    } catch (error) {
      console.error('Failed to create chat with author:', error);
    } finally {
      setIsCreatingChat(false);
    }
  }, [author.id, isCreatingChat, locale, router]);

  return (
    <Card padding="lg" className="border border-gray-100">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <UserAvatarIcon avatarUrl={author.avatar_url} name={author.name} size={80} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-gray-900 truncate">{author.name}</h2>
            <button
              type="button"
              onClick={handleStartChat}
              disabled={isCreatingChat}
              title={t('product.writeToAuthor') || 'Написать автору'}
              aria-label={t('product.writeToAuthor') || 'Написать автору'}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingChat ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
            {author.description || t('authors.noDescription')}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-5">
        {author.latestProducts.length === 0 ? (
          <p className="text-sm text-gray-500">{t('authors.noProducts')}</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {author.latestProducts.map((product) => (
              <div key={product.id} className="w-[145px] sm:w-[155px] md:w-[165px] lg:w-[175px] xl:w-[220px]">
                <ProductCard product={product} size="sm" className="max-w-none" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

