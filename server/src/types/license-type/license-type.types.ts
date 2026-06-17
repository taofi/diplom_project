

import type { EntityBase } from '../base/entity-base';



export interface CreateLicenseTypeDto {
  name: string;
  description?: string;
}


export type UpdateLicenseTypeDto = Partial<CreateLicenseTypeDto>;



export interface LicenseTypeFields extends EntityBase {
  id: number;
}


export type LicenseTypeCreateFields = Omit<LicenseTypeFields, 'id'>;



export interface LicenseTypeTranslationInfo {
  locale: string;
  name: string;
  description: string | null;
}



export interface LicenseTypeResponse {
  id: number;
  name?: string;
  description?: string | null;
  translations?: LicenseTypeTranslationInfo[];
}


export type LicenseTypeWithRelations = LicenseTypeFields & {
  translations?: LicenseTypeTranslationFields[];
};

type LicenseTypeTranslationFields = {
  license_type_id: number;
  locale: string;
  name: string;
  description: string | null;
};



export interface LicenseTypeQueryParams {
  language?: string;
}



export function createLicenseTypeResponse(
  licenseType: LicenseTypeWithRelations,
  language?: string,
): LicenseTypeResponse {
  const response: LicenseTypeResponse = {
    id: licenseType.id,
  };

  if (licenseType.translations && licenseType.translations.length > 0) {
    const translation = language
      ? licenseType.translations.find((t) => t.locale === language)
      : licenseType.translations[0];

    if (translation) {
      response.name = translation.name;
      response.description = translation.description;
    }
  }

  if (licenseType.translations) {
    response.translations = licenseType.translations.map((t) => ({
      locale: t.locale,
      name: t.name,
      description: t.description,
    }));
  }

  return response;
}


