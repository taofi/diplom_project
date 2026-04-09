import type { ProductResponse } from '@/types/product';

export type AuthorRole = 'admin' | 'author' | 'user';

export interface AuthorListItem {
  id: number;
  name: string;
  avatar_url: string | null;
  description: string | null;
  roles: AuthorRole[];
  latestProducts: ProductResponse[];
}

export interface AuthorsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
}

export interface AuthorsListResponse {
  data: AuthorListItem[];
  meta: AuthorsMeta;
}

export interface GetAuthorsParams {
  page?: number;
  limit?: number;
  search?: string;
  language?: string;
}

