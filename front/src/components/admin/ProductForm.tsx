'use client';

import { ProductType } from '@/types/product';
import type { CategoryResponse } from '@/types/category';
import type { LicenseTypeResponse } from '@/types/license-type';
import { useI18n } from '@/context/i18n/I18nContext';
import { BasicInfoSection } from './BasicInfoSection';
import { FileStockSection } from './FileStockSection';
import { CategorySelector } from './CategorySelector';
import { LicenseManager } from './LicenseManager';
import { StatusSection } from './StatusSection';
import { FormButtons } from './FormButtons';
import { ErrorMessage } from './ErrorMessage';
import type { MediaItem } from './MediaUploader';

interface LicenseFormItem {
  id: string;
  licenseTypeId: number;
  price: string;
}

interface ProductFormProps {
  // Basic info
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  type: ProductType;
  onTypeChange: (value: ProductType) => void;

  // File, media & stock
  fileUrl: string;
  onFileUrlChange: (value: string) => void;
  media: MediaItem[];
  onMediaChange: (items: MediaItem[]) => void;

  // Categories
  categories: CategoryResponse[];
  selectedCategories: number[];
  onToggleCategory: (categoryId: number) => void;

  // Licenses
  licenseTypes: LicenseTypeResponse[];
  licenses: LicenseFormItem[];
  onAddLicense: () => void;
  onUpdateLicense: (id: string, field: 'licenseTypeId' | 'price', value: string | number) => void;
  onRemoveLicense: (id: string) => void;

  // Status
  isActive: boolean;
  onIsActiveChange: (value: boolean) => void;
  isFeatured: boolean;
  onIsFeaturedChange: (value: boolean) => void;

  // Form
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function ProductForm({
  // Basic info
  name,
  onNameChange,
  description,
  onDescriptionChange,
  type,
  onTypeChange,

  // File, media & stock
  fileUrl,
  onFileUrlChange,
  media,
  onMediaChange,

  // Categories
  categories,
  selectedCategories,
  onToggleCategory,

  // Licenses
  licenseTypes,
  licenses,
  onAddLicense,
  onUpdateLicense,
  onRemoveLicense,

  // Status
  isActive,
  onIsActiveChange,
  isFeatured,
  onIsFeaturedChange,

  // Form
  error,
  loading,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const { t } = useI18n();

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <ErrorMessage message={error} />
      
      <BasicInfoSection
        name={name}
        onNameChange={onNameChange}
        description={description}
        onDescriptionChange={onDescriptionChange}
        type={type}
        onTypeChange={onTypeChange}
      />
      
      <FileStockSection
        fileUrl={fileUrl}
        onFileUrlChange={onFileUrlChange}
        media={media}
        onMediaChange={onMediaChange}
      />
      
      <CategorySelector
        categories={categories}
        selectedCategories={selectedCategories}
        onToggle={onToggleCategory}
      />
      
      <LicenseManager
        licenses={licenses}
        licenseTypes={licenseTypes}
        onAdd={onAddLicense}
        onUpdate={onUpdateLicense}
        onRemove={onRemoveLicense}
      />
      
      <StatusSection
        isActive={isActive}
        onIsActiveChange={onIsActiveChange}
        isFeatured={isFeatured}
        onIsFeaturedChange={onIsFeaturedChange}
      />
      
      <FormButtons loading={loading} onCancel={onCancel} />
    </form>
  );
}
