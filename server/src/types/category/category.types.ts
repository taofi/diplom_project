

import type { EntityBase } from '../base/entity-base';



export interface CreateCategoryDto {
  name: string;
  description?: string;
  slug?: string;
  icon?: string;
  color?: string;
  image?: string;
  parentId?: number;
  position?: number;
}


export type UpdateCategoryDto = Partial<CreateCategoryDto>;



export interface CategoryFields extends EntityBase {
  id: number;
  created_at: Date;
}


export type CategoryCreateFields = Omit<CategoryFields, 'id' | 'created_at' | 'updated_at'>;



export interface CategoryTranslationInfo {
  locale: string;
  name: string;
}



export interface CategoryResponse {
  id: number;
  createdAt: Date;
  name?: string;
  translations?: CategoryTranslationInfo[];
}


export type CategoryWithRelations = CategoryFields & {
  translations?: CategoryTranslationFields[];
};

type CategoryTranslationFields = {
  category_id: number;
  locale: string;
  name: string;
};



export interface CategoryQueryParams {
  language?: string;
  parentId?: number;
}



export function createCategoryResponse(
  category: CategoryWithRelations,
  language?: string,
): CategoryResponse {
  const response: CategoryResponse = {
    id: category.id,
    createdAt: category.created_at,
  };

  if (category.translations && category.translations.length > 0) {
    const translation = language
      ? category.translations.find((t) => t.locale === language)
      : category.translations[0];

    if (translation) {
      response.name = translation.name;
    }
  }

  if (category.translations) {
    response.translations = category.translations.map((t) => ({
      locale: t.locale,
      name: t.name,
    }));
  }

  return response;
}


