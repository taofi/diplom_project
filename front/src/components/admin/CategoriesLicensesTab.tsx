'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  getCategoryProductsCount 
} from '@/lib/api-category';
import { 
  getLicenseTypes, 
  createLicenseType, 
  updateLicenseType, 
  deleteLicenseType,
  getLicenseTypeProductsCount 
} from '@/lib/api-license-type';
import type { CategoryResponse, CreateCategoryDto } from '@/types/category';
import type { LicenseTypeResponse, CreateLicenseTypeDto } from '@/types/license-type';
import { Button, Spinner, ConfirmModal, Input } from '@/components/ui';

type SubTabType = 'categories' | 'licenses';

export function CategoriesLicensesTab({ hideSubTabs = false, activeSubTab: initialActiveSubTab }: { hideSubTabs?: boolean; activeSubTab?: SubTabType }) {
  const { t, locale } = useI18n();
   
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>(initialActiveSubTab || 'categories');
  
  // Categories state
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<number, number>>({});
  
  // License types state
  const [licenseTypes, setLicenseTypes] = useState<LicenseTypeResponse[]>([]);
  const [licenseTypesLoading, setLicenseTypesLoading] = useState(true);
  const [licenseTypeCounts, setLicenseTypeCounts] = useState<Record<number, number>>({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CategoryResponse | LicenseTypeResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; type: 'category' | 'license' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state - support both languages at once
  const [formNameRu, setFormNameRu] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Get all translations as an object
  const getTranslationsMap = (translations: { locale: string; name: string }[] | undefined): Record<string, string> => {
    if (!translations) return { ru: '', en: '' };
    const map: Record<string, string> = { ru: '', en: '' };
    translations.forEach(t => {
      map[t.locale] = t.name;
    });
    return map;
  };

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const data = await getCategories({ language: locale });
      setCategories(data || []);
      
      // Fetch counts for each category
      const counts: Record<number, number> = {};
      for (const cat of data || []) {
        try {
          counts[cat.id] = await getCategoryProductsCount(cat.id);
        } catch {
          counts[cat.id] = 0;
        }
      }
      setCategoryCounts(counts);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  }, [locale]);

  // Fetch license types
  const fetchLicenseTypes = useCallback(async () => {
    setLicenseTypesLoading(true);
    try {
      const data = await getLicenseTypes({ language: locale });
      setLicenseTypes(data || []);
      
      // Fetch counts for each license type
      const counts: Record<number, number> = {};
      for (const lt of data || []) {
        try {
          counts[lt.id] = await getLicenseTypeProductsCount(lt.id);
        } catch {
          counts[lt.id] = 0;
        }
      }
      setLicenseTypeCounts(counts);
    } catch (err) {
      console.error('Failed to fetch license types:', err);
    } finally {
      setLicenseTypesLoading(false);
    }
  }, [locale]);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
    fetchLicenseTypes();
  }, [fetchCategories, fetchLicenseTypes]);

  // Open add/edit modal
  const handleOpenModal = (item?: CategoryResponse | LicenseTypeResponse) => {
    if (item) {
      setEditingItem(item);
      // Load ALL translations for both languages
      const translations = 'translations' in item ? item.translations : undefined;
      const translationsMap = getTranslationsMap(translations as { locale: string; name: string }[]);
      setFormNameRu(translationsMap.ru || '');
      setFormNameEn(translationsMap.en || '');
      setFormDescription('description' in item ? (item.description || '') : '');
    } else {
      setEditingItem(null);
      setFormNameRu('');
      setFormNameEn('');
      setFormDescription('');
    }
    setModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setFormNameRu('');
    setFormNameEn('');
    setFormDescription('');
  };

  // Submit form
  const handleSubmit = async () => {
    if (!formNameRu.trim() && !formNameEn.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (activeSubTab === 'categories') {
        // For new category: create with first language, then update with second
        // For editing: update both languages
        if (editingItem) {
          // Editing - update both languages
          if (formNameRu.trim()) {
            await updateCategory(editingItem.id, { name: formNameRu }, 'ru');
          }
          if (formNameEn.trim()) {
            await updateCategory(editingItem.id, { name: formNameEn }, 'en');
          }
        } else {
          // Creating new category
          let categoryId: number | undefined;
          if (formNameRu.trim()) {
            const result = await createCategory({ name: formNameRu }, 'ru');
            categoryId = result.id;
          }
          if (formNameEn.trim()) {
            if (categoryId) {
              // Already created with RU, just add EN translation
              await updateCategory(categoryId, { name: formNameEn }, 'en');
            } else {
              // Create with EN as primary
              await createCategory({ name: formNameEn }, 'en');
            }
          }
        }
        fetchCategories();
      } else {
        // License types - same logic
        if (editingItem) {
          if (formNameRu.trim()) {
            await updateLicenseType(editingItem.id, { name: formNameRu }, 'ru');
          }
          if (formNameEn.trim()) {
            await updateLicenseType(editingItem.id, { name: formNameEn }, 'en');
          }
        } else {
          let licenseId: number | undefined;
          if (formNameRu.trim()) {
            const result = await createLicenseType({ name: formNameRu }, 'ru');
            licenseId = result.id;
          }
          if (formNameEn.trim()) {
            if (licenseId) {
              await updateLicenseType(licenseId, { name: formNameEn }, 'en');
            } else {
              await createLicenseType({ name: formNameEn }, 'en');
            }
          }
        }
        fetchLicenseTypes();
      }
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open delete confirmation
  const handleOpenDelete = (id: number, type: 'category' | 'license') => {
    setItemToDelete({ id, type });
    setDeleteModalOpen(true);
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'category') {
        await deleteCategory(itemToDelete.id);
        fetchCategories();
      } else {
        await deleteLicenseType(itemToDelete.id);
        fetchLicenseTypes();
      }
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  return (
    <div>
       {/* Sub-tabs */}
       {!hideSubTabs && (
         <div className="border-b border-gray-200 mb-6">
           <nav className="-mb-px flex space-x-8">
             <button
               onClick={() => setActiveSubTab('categories')}
               className={`
                 py-3 px-1 border-b-2 font-medium text-sm transition-colors
                 ${
                   activeSubTab === 'categories'
                     ? 'border-blue-500 text-blue-600'
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 }
               `}
             >
               {t('admin.categories.title')}
             </button>
             <button
               onClick={() => setActiveSubTab('licenses')}
               className={`
                 py-3 px-1 border-b-2 font-medium text-sm transition-colors
                 ${
                   activeSubTab === 'licenses'
                     ? 'border-blue-500 text-blue-600'
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 }
               `}
             >
               {t('admin.licenseTypes.title')}
             </button>
           </nav>
         </div>
       )}

      {/* Categories Tab */}
      {activeSubTab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{t('admin.categories.title')}</h2>
            <Button onClick={() => handleOpenModal()}>
              {t('admin.categories.add')}
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t('admin.categories.noCategories')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.categories.name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.categories.productsCount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cat.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cat.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {categoryCounts[cat.id] || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(cat)}
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleOpenDelete(cat.id, 'category')}
                        >
                          {t('common.delete')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* License Types Tab */}
      {activeSubTab === 'licenses' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{t('admin.licenseTypes.title')}</h2>
            <Button onClick={() => handleOpenModal()}>
              {t('admin.licenseTypes.add')}
            </Button>
          </div>

          {licenseTypesLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : licenseTypes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t('admin.licenseTypes.noLicenseTypes')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.licenseTypes.name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.licenseTypes.productsCount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {licenseTypes.map((lt) => (
                    <tr key={lt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lt.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lt.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {licenseTypeCounts[lt.id] || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(lt)}
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleOpenDelete(lt.id, 'license')}
                        >
                          {t('common.delete')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem 
                ? (activeSubTab === 'categories' ? t('admin.categories.edit') : t('admin.licenseTypes.edit'))
                : (activeSubTab === 'categories' ? t('admin.categories.add') : t('admin.licenseTypes.add'))
              }
            </h3>
            
            {/* Show both language fields at once */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.categories.name')} (RU)
                </label>
                <Input
                  name="nameRu"
                  value={formNameRu}
                  onChange={setFormNameRu}
                  placeholder={t('admin.categories.name')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.categories.name')} (EN)
                </label>
                <Input
                  name="nameEn"
                  value={formNameEn}
                  onChange={setFormNameEn}
                  placeholder={t('admin.categories.name')}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={handleCloseModal}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit} loading={isSubmitting}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('common.delete')}
        message={
          activeSubTab === 'categories'
            ? t('admin.categories.deleteConfirm')
            : t('admin.licenseTypes.deleteConfirm')
        }
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
