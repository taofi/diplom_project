'use client';

import { useState, useEffect, useRef } from 'react';
import { ProductType, type CreateProductDto, type UpdateProductDto, type ProductResponse, type UpdateMediaItem, type TranslationDto } from '@/types/product';
import type { CategoryResponse } from '@/types/category';
import type { LicenseTypeResponse } from '@/types/license-type';
import { useI18n } from '@/context/i18n/I18nContext';
import { getCategories } from '@/lib/api-category';
import { getLicenseTypes } from '@/lib/api-license-type';
import { BasicInfoSection } from './BasicInfoSection';
import { FileStockSection } from './FileStockSection';
import { CategorySelector } from './CategorySelector';
import { LicenseManager } from './LicenseManager';
import { StatusSection } from './StatusSection';
import { FormButtons } from './FormButtons';
import { ErrorMessage } from './ErrorMessage';
import { Spinner } from '@/components/ui';
import { LanguageTabs } from './LanguageTabs';
import type { MediaItem } from './MediaUploader';

interface LicenseFormItem {
  id: string;
  licenseTypeId: number;
  price: string;
}

// Тип для хранения переводов
interface TranslationsState {
  ru: {
    name: string;
    description: string;
  };
  en: {
    name: string;
    description: string;
  };
}

interface ProductFormProps {
  // Режим работы формы
  mode?: 'create' | 'edit';
  
  // Продукт для редактирования
  product?: ProductResponse;
  
  // Все переводы продукта (для редактирования)
  allTranslations?: TranslationDto[];
  
  // Колбек отправки - возвращает готовые данные для API
  onSubmit: (data: CreateProductDto | UpdateProductDto) => Promise<void>;
  
  // Колбек отмены
  onCancel: () => void;
  
  // Опциональные пропы для переопределения
  loading?: boolean;
  externalError?: string;
}

const defaultTranslations: TranslationsState = {
  ru: { name: '', description: '' },
  en: { name: '', description: '' },
};

export function ProductForm({
  mode = 'create',
  product,
  allTranslations,
  onSubmit,
  onCancel,
  loading: externalLoading,
  externalError,
}: ProductFormProps) {
  const { t, locale } = useI18n();
  const isEditMode = mode === 'edit';
  
  // Ref для отслеживания, были ли инициализированы данные продукта
  const productInitialized = useRef(false);
  
  // Effect 0: Reset initialization flag when product ID changes
  useEffect(() => {
    if (product?.id) {
      productInitialized.current = false;
    }
  }, [product?.id]);
  
  // Активный язык для редактирования
  const [activeLanguage, setActiveLanguage] = useState<string>('ru');
  
  // Переводы для всех языков
  const [translations, setTranslations] = useState<TranslationsState>(defaultTranslations);
  
  // Остальные поля формы
  const [type, setType] = useState<ProductType>(ProductType.BRUSH);
  const [fileUrl, setFileUrl] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Categories
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  // Media changes tracking
  const [mediaChanges, setMediaChanges] = useState<{
    updatedMedia: UpdateMediaItem[];
    deletedMediaIds: number[];
  }>({
    updatedMedia: [],
    deletedMediaIds: [],
  });
  
  // Licenses
  const [licenseTypes, setLicenseTypes] = useState<LicenseTypeResponse[]>([]);
  const [licenses, setLicenses] = useState<LicenseFormItem[]>([]);
  
  // Loading and error states
  const [internalLoading, setInternalLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState('');

  // Determine loading state
  const loading = externalLoading ?? internalLoading;

  // Current translation data for active language
  const currentTranslation = translations[activeLanguage as keyof TranslationsState];
  
  // Update translation for active language
  const updateTranslation = (field: 'name' | 'description', value: string) => {
    setTranslations(prev => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage as keyof TranslationsState],
        [field]: value,
      },
    }));
  };

  // Effect 1: Fetch categories and license types (runs first)
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetching data
        
        const [categoriesData, licenseTypesData] = await Promise.all([
          getCategories({ language: locale }),
          getLicenseTypes({ language: locale }),
        ]);
        
        // Data fetched
        
        setCategories(categoriesData || []);
        setLicenseTypes(licenseTypesData || []);
      } catch (err) {
        console.error('[ProductForm] Failed to fetch data:', err);
        setError('Failed to load categories and license types');
      } finally {
        setFetchingData(false);
      }
    }
    
    fetchData();
  }, [locale]);

  // Effect 2: Initialize product data (when product changes)
  useEffect(() => {
    if (isEditMode && product && !productInitialized.current) {
      // Initializing product data
      
      // Инициализируем переводы из allTranslations или из продукта
      const newTranslations: TranslationsState = { ...defaultTranslations };
      
      // Если есть allTranslations - используем их
      if (allTranslations && allTranslations.length > 0) {
        allTranslations.forEach((trans) => {
          const lang = trans.language?.toLowerCase() as 'ru' | 'en';
          if (lang === 'ru' || lang === 'en') {
            newTranslations[lang] = {
              name: trans.name || '',
              description: trans.description || '',
            };
          }
        });
      } else if (product.translations && product.translations.length > 0) {
        // Fallback - используем переводы из продукта
        product.translations.forEach((trans) => {
          const lang = trans.language?.toLowerCase() as 'ru' | 'en';
          if (lang === 'ru' || lang === 'en') {
            newTranslations[lang] = {
              name: trans.name || '',
              description: trans.description || '',
            };
          }
        });
      } else {
        // Нет переводов - используем базовые поля
        newTranslations.ru = {
          name: product.name || '',
          description: product.description || '',
        };
      }
      
      setTranslations(newTranslations);
      
      // Basic info
      setType(product.type || ProductType.BRUSH);
      setFileUrl(product.fileUrl || '');
      setIsActive(product.isActive ?? true);
      setIsFeatured(product.isFeatured ?? false);
      
      // Categories
      setSelectedCategories(product.categories?.map(c => c.id) || []);
      
      // Media
      if (product.media && product.media.length > 0) {
        const mediaItems = product.media.map(m => ({
          url: m.url,
          isCover: m.isCover,
          isNew: false,
          mediaType: m.mediaType,
          id: m.id,
        }));
        setMedia(mediaItems);
        // Media initialized
      }

      setMediaChanges({
        updatedMedia: [],
        deletedMediaIds: [],
      });
      
      productInitialized.current = true;
    }
  }, [isEditMode, product, allTranslations]);

  // Effect 3: Initialize licenses
  useEffect(() => {
    if (fetchingData) return;
    
    if (licenseTypes.length === 0) {
      // License types not loaded yet
      return;
    }
    
    // License types loaded

    if (isEditMode && product) {
      if (product.licenses && product.licenses.length > 0) {
        // Initializing licenses
        
        const initializedLicenses = product.licenses.map(l => ({
          id: l.id.toString(),
          licenseTypeId: l.licenseTypeId,
          price: l.price.toString(),
        }));
        
        setLicenses(initializedLicenses);
      }
    } else if (!isEditMode && licenses.length === 0) {
      setLicenses([{
        id: '1',
        licenseTypeId: licenseTypes[0].id,
        price: '',
      }]);
      // Created initial license
    }
  }, [fetchingData, licenseTypes, isEditMode, product]);

  // Add license row
  const addLicense = () => {
    setLicenses([
      ...licenses,
      {
        id: Date.now().toString(),
        licenseTypeId: licenseTypes[0]?.id || 0,
        price: '',
      },
    ]);
  };

  // Remove license row
  const removeLicense = (id: string) => {
    if (licenses.length > 1) {
      setLicenses(licenses.filter(l => l.id !== id));
    }
  };

  // Update license
  const updateLicense = (id: string, field: 'licenseTypeId' | 'price', value: string | number) => {
    setLicenses(licenses.map(l => 
      l.id === id ? { ...l, [field]: value } : l
    ));
  };

  // Handle media changes tracking
  const handleMediaChange = (changes: { updatedMedia: UpdateMediaItem[]; deletedMediaIds: number[] }) => {
    setMediaChanges(prev => ({
      updatedMedia: [
        ...prev.updatedMedia,
        ...changes.updatedMedia.filter(
          u => !prev.updatedMedia.some(p => p.id === u.id)
        ),
      ],
      deletedMediaIds: [
        ...prev.deletedMediaIds,
        ...changes.deletedMediaIds.filter(
          d => !prev.deletedMediaIds.includes(d)
        ),
      ],
    }));
  };

  // Handle category toggle
  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInternalLoading(true);

    try {
      const validLicenses = licenses
        .filter(l => l.licenseTypeId && l.price)
        .map(l => ({
          licenseTypeId: Number(l.licenseTypeId),
          price: Number(l.price),
        }));

      if (validLicenses.length === 0) {
        setError(t('admin.products.licenseRequired'));
        setInternalLoading(false);
        return;
      }

      // Формируем массив переводов
      const translationsToSend: TranslationDto[] = [
        {
          language: 'ru',
          name: translations.ru.name,
          description: translations.ru.description || undefined,
        },
        {
          language: 'en',
          name: translations.en.name,
          description: translations.en.description || undefined,
        },
      ];

      if (isEditMode) {
        const newMedia = media.filter(m => m.isNew);
        // Updating product
        
        const updateData: UpdateProductDto = {
          type,
          fileUrl,
          isActive,
          isFeatured,
          categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
          licenses: validLicenses,
          translations: translationsToSend,
          tempMediaUrls: newMedia.length > 0 
            ? newMedia.map(m => ({ url: m.url, isCover: m.isCover })) 
            : undefined,
          updatedMedia: mediaChanges.updatedMedia.length > 0
            ? mediaChanges.updatedMedia
            : undefined,
          deletedMediaIds: mediaChanges.deletedMediaIds.length > 0
            ? mediaChanges.deletedMediaIds
            : undefined,
        };
        
        // Update data prepared
        await onSubmit(updateData);
      } else {
        // Creating product

        const createData: CreateProductDto = {
          type,
          fileUrl,
          price: 0,
          isActive,
          isFeatured,
          categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
          licenses: validLicenses,
          translations: translationsToSend,
          tempMediaUrls: media.length > 0 ? media.map(m => ({ url: m.url, isCover: m.isCover })) : undefined,
        };
        await onSubmit(createData);
      }
    } catch (err: unknown) {
      console.error('[ProductForm] Failed to submit product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit product';
      setError(errorMessage);
    } finally {
      setInternalLoading(false);
    }
  };

  if (fetchingData) {
    return <Spinner size="lg" />;
  }

  const displayError = error || externalError || '';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <ErrorMessage message={displayError} />
      
      {/* Language Tabs */}
      <div className="flex justify-end">
        <LanguageTabs
          activeLanguage={activeLanguage}
          onChange={setActiveLanguage}
        />
      </div>
      
      {/* Translation Fields */}
      <BasicInfoSection
        name={currentTranslation.name}
        onNameChange={(value) => updateTranslation('name', value)}
        description={currentTranslation.description}
        onDescriptionChange={(value) => updateTranslation('description', value)}
        type={type}
        onTypeChange={setType}
      />
      
      <FileStockSection
        fileUrl={fileUrl}
        onFileUrlChange={setFileUrl}
        media={media}
        onMediaChange={setMedia}
        onMediaChangeWithTracking={handleMediaChange}
      />
      
      <CategorySelector
        categories={categories}
        selectedCategories={selectedCategories}
        onToggle={toggleCategory}
      />
      
      <LicenseManager
        licenses={licenses}
        licenseTypes={licenseTypes}
        onAdd={addLicense}
        onUpdate={updateLicense}
        onRemove={removeLicense}
      />
      
      <StatusSection
        isActive={isActive}
        onIsActiveChange={setIsActive}
        isFeatured={isFeatured}
        onIsFeaturedChange={setIsFeatured}
      />
      
      <FormButtons 
        mode={mode}
        loading={loading} 
        onCancel={onCancel} 
      />
    </form>
  );
}
