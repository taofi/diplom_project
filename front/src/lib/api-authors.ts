import api from './api';
import type { AuthorsListResponse, GetAuthorsParams } from '@/types/author';

export async function getAuthors(params?: GetAuthorsParams): Promise<AuthorsListResponse> {
  const response = await api.get<AuthorsListResponse>('/authors', { params });
  return response.data;
}

