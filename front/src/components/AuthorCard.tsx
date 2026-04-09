'use client';

import { ProductCard } from '@/components/ProductCard';
import { ServerImage } from '@/components/Image';
import { Card } from '@/components/ui';
import { useI18n } from '@/context/i18n/I18nContext';
import type { AuthorListItem } from '@/types/author';

interface AuthorCardProps {
  author: AuthorListItem;
}

export function AuthorCard({ author }: AuthorCardProps) {
  const { t } = useI18n();

  return (
    <Card padding="lg" className="border border-gray-100">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <ServerImage
            src={author.avatar_url}
            alt={author.name}
            width={80}
            height={80}
            className="rounded-full bg-gray-100"
          />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 truncate">{author.name}</h2>
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
              <div key={product.id} className="w-[145px] sm:w-[155px] md:w-[165px] lg:w-[175px] xl:w-[185px]">
                <ProductCard product={product} size="sm" className="max-w-none" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

