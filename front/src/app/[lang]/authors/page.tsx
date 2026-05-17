'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthorCard } from '@/components/AuthorCard';
import { Input, Spinner, Button } from '@/components/ui';
import { useI18n } from '@/context/i18n/I18nContext';
import { getAuthors } from '@/lib/api-authors';
import type { AuthorListItem, AuthorsMeta } from '@/types/author';

const DEFAULT_META: AuthorsMeta = {
  total: 0,
  page: 1,
  limit: 5,
  totalPages: 1,
  hasNext: false,
};

export default function AuthorsPage() {
  const { t, locale } = useI18n();

  const [authors, setAuthors] = useState<AuthorListItem[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState<AuthorsMeta>(DEFAULT_META);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasNoResults = useMemo(
    () => !loadingInitial && !loadingMore && !error && authors.length === 0,
    [authors.length, error, loadingInitial, loadingMore],
  );

  const loadAuthors = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingInitial(true);
      }
      setError(null);

      try {
        const response = await getAuthors({
          page: nextPage,
          limit: 5,
          search: search || undefined,
          language: locale,
        });

        setMeta(response.meta);

        if (append) {
          setAuthors((prev) => {
            const prevIds = new Set(prev.map((author) => author.id));
            const nextChunk = response.data.filter((author) => !prevIds.has(author.id));
            return [...prev, ...nextChunk];
          });
        } else {
          setAuthors(response.data);
        }
      } catch (_error: unknown) {
        setError(t('authors.loadError'));
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoadingInitial(false);
        }
      }
    },
    [locale, search, t],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    void loadAuthors(1, false);
  }, [loadAuthors]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !meta.hasNext || loadingInitial || loadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && meta.hasNext && !loadingMore && !loadingInitial) {
          void loadAuthors(meta.page + 1, true);
        }
      },
      { rootMargin: '300px 0px 300px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadAuthors, loadingInitial, loadingMore, meta.hasNext, meta.page]);

  const handleRetry = () => {
    void loadAuthors(1, false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 pt-26">
         <div className="mb-8">
        <Input
          type="text"
          name="authorsSearch"
          value={searchInput}
          onChange={setSearchInput}
          placeholder={t('authors.searchPlaceholder')}
        />
      </div>

      {loadingInitial ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-700">{error}</p>
          <Button className="mt-4" size="sm" onClick={handleRetry}>
            {t('authors.retry')}
          </Button>
        </div>
      ) : hasNoResults ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-500">
          {t('authors.noAuthors')}
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {authors.map((author) => (
              <AuthorCard key={author.id} author={author} />
            ))}
          </div>

          <div ref={sentinelRef} className="h-8" />

          {loadingMore && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}
        </>
      )}
    </div>
  );
}

