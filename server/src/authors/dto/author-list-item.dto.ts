import type { ProductListItemResponse } from '../../types/product/product-response.types';

export interface AuthorListItemDto {
  id: number;
  name: string;
  avatar_url: string | null;
  description: string | null;
  roles: string[];
  latestProducts: ProductListItemResponse[];
}



