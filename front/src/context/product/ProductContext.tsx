'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type {
  ProductResponse,
  ProductListResponse,
  ProductQueryParams,
  CreateProductDto,
  UpdateProductDto,
  ProductType,
} from '@/types/product';
import { useAuth } from '@/context/auth/AuthContext';
import * as productApi from '@/lib/api-product';

// Типы для состояния пагинации
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Типы для фильтров
interface ProductFilters {
  search?: string;
  type?: ProductType;
  categoryId?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: number;
}

// Тип контекста
interface ProductContextType {
  // Состояние
  products: ProductResponse[];
  currentProduct: ProductResponse | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  filters: ProductFilters;

  // Функции для получения данных
  fetchProducts: (params?: ProductQueryParams) => Promise<void>;
  fetchProductById: (id: number, language?: string) => Promise<void>;
  fetchMyProducts: (params?: ProductQueryParams) => Promise<void>;

  // CRUD операции
  createProduct: (data: CreateProductDto, language?: string) => Promise<ProductResponse>;
  updateProduct: (id: number, data: UpdateProductDto, language?: string) => Promise<ProductResponse>;
  deleteProduct: (id: number) => Promise<void>;

  // Активация/деактивация
  activateProduct: (id: number) => Promise<void>;
  deactivateProduct: (id: number) => Promise<void>;

  // Управление фильтрами
  setFilters: (filters: ProductFilters) => void;
  clearFilters: () => void;
  updateFilters: (filters: Partial<ProductFilters>) => void;

  // Управление состоянием
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCurrentProduct: () => void;
  
  // Информация о роли
  isAdmin: boolean;
  isAuthor: boolean;
  isAdminOrAuthor: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Начальное состояние пагинации
const initialPagination: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};

// Начальное состояние фильтров
const initialFilters: ProductFilters = {};

interface ProductProviderProps {
  children: ReactNode;
}

export function ProductProvider({ children }: ProductProviderProps) {
  // Получаем данные пользователя из контекста авторизации
  const { user, isAuthenticated } = useAuth();
  
  // Состояние продуктов
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [currentProduct, setCurrentProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination);
  const [filters, setFiltersState] = useState<ProductFilters>(initialFilters);
  
  // Проверка роли пользователя
  const isAdmin = user?.roles?.includes('admin') ?? false;
  const isAuthor = user?.roles?.includes('author') ?? false;
  const isAdminOrAuthor = isAdmin || isAuthor;

  // Функция для получения списка продуктов
  const fetchProducts = useCallback(async (params?: ProductQueryParams) => {
    setLoading(true);
    setError(null);

    try {
      // Объединяем переданные параметры с текущими фильтрами
      const mergedParams: ProductQueryParams = {
        ...filters,
        ...params,
        language: params?.language || 'ru',
      };

      let response: ProductListResponse;

      // Если пользователь авторизован и имеет роль author (но не admin),
      // получаем только его продукты
      // Если admin - получаем все продукты
      if (isAuthenticated && isAuthor && !isAdmin) {
        // Для автора получаем его продукты через /products/my
        response = await productApi.getMyProducts(mergedParams);
      } else {
        // Для админа или неавторизованного пользователя - все продукты
        response = await productApi.getProducts(mergedParams);
      }

      setProducts(response.data || []);
      setPagination({
        total: response.meta?.total || 0,
        page: response.meta?.page || 1,
        limit: response.meta?.limit || 10,
        totalPages: response.meta?.totalPages || 1,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, isAuthenticated, isAuthor, isAdmin]);

  // Функция для получения продукта по ID
  const fetchProductById = useCallback(async (id: number, language?: string) => {
    setLoading(true);
    setError(null);

    try {
      const product = await productApi.getProductById(id, language);
      setCurrentProduct(product);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product';
      setError(errorMessage);
      console.error('Failed to fetch product:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для получения моих продуктов (для продавца)
  const fetchMyProducts = useCallback(async (params?: ProductQueryParams) => {
    setLoading(true);
    setError(null);

    try {
      const mergedParams: ProductQueryParams = {
        ...filters,
        ...params,
        language: params?.language || 'ru',
      };

      const response: ProductListResponse = await productApi.getMyProducts(mergedParams);

      setProducts(response.data || []);
      setPagination({
        total: response.meta?.total || 0,
        page: response.meta?.page || 1,
        limit: response.meta?.limit || 10,
        totalPages: response.meta?.totalPages || 1,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch my products';
      setError(errorMessage);
      console.error('Failed to fetch my products:', err);
    }
  }, [filters]);

  // Функция для создания продукта
  const createProduct = useCallback(async (data: CreateProductDto, language?: string): Promise<ProductResponse> => {
    setLoading(true);
    setError(null);

    try {
      const product = await productApi.createProduct(data, language);
      // Добавляем новый продукт в начало списка
      setProducts(prev => [product, ...prev]);
      return product;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      setError(errorMessage);
      console.error('Failed to create product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для обновления продукта
  const updateProduct = useCallback(async (id: number, data: UpdateProductDto, language?: string): Promise<ProductResponse> => {
    setLoading(true);
    setError(null);

    try {
      const product = await productApi.updateProduct(id, data, language);
      // Обновляем продукт в списке
      setProducts(prev => prev.map(p => p.id === id ? product : p));
      // Обновляем текущий продукт если это он
      if (currentProduct?.id === id) {
        setCurrentProduct(product);
      }
      return product;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      setError(errorMessage);
      console.error('Failed to update product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentProduct]);

  // Функция для удаления продукта
  const deleteProduct = useCallback(async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await productApi.deleteProduct(id);
      // Удаляем продукт из списка
      setProducts(prev => prev.filter(p => p.id !== id));
      // Очищаем текущий продукт если это он
      if (currentProduct?.id === id) {
        setCurrentProduct(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      setError(errorMessage);
      console.error('Failed to delete product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentProduct]);

  // Функция для активации продукта
  const activateProduct = useCallback(async (id: number): Promise<void> => {
    try {
      const product = await productApi.activateProduct(id);
      setProducts(prev => prev.map(p => p.id === id ? product : p));
      if (currentProduct?.id === id) {
        setCurrentProduct(product);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate product';
      setError(errorMessage);
      console.error('Failed to activate product:', err);
      throw err;
    }
  }, [currentProduct]);

  // Функция для деактивации продукта
  const deactivateProduct = useCallback(async (id: number): Promise<void> => {
    try {
      const product = await productApi.deactivateProduct(id);
      setProducts(prev => prev.map(p => p.id === id ? product : p));
      if (currentProduct?.id === id) {
        setCurrentProduct(product);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate product';
      setError(errorMessage);
      console.error('Failed to deactivate product:', err);
      throw err;
    }
  }, [currentProduct]);

  // Функция для установки фильтров
  const setFilters = useCallback((newFilters: ProductFilters) => {
    setFiltersState(newFilters);
  }, []);

  // Функция для очистки фильтров
  const clearFilters = useCallback(() => {
    setFiltersState(initialFilters);
  }, []);

  // Функция для частичного обновления фильтров
  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Функция для установки состояния загрузки
  const setLoadingState = useCallback((loading: boolean) => {
    setLoading(loading);
  }, []);

  // Функция для установки ошибки
  const setErrorState = useCallback((error: string | null) => {
    setError(error);
  }, []);

  // Функция для очистки текущего продукта
  const clearCurrentProduct = useCallback(() => {
    setCurrentProduct(null);
  }, []);

  const value: ProductContextType = {
    // Состояние
    products,
    currentProduct,
    loading,
    error,
    pagination,
    filters,

    // Функции для получения данных
    fetchProducts,
    fetchProductById,
    fetchMyProducts,

    // CRUD операции
    createProduct,
    updateProduct,
    deleteProduct,

    // Активация/деактивация
    activateProduct,
    deactivateProduct,

    // Управление фильтрами
    setFilters,
    clearFilters,
    updateFilters,

    // Управление состоянием
    setLoading: setLoadingState,
    setError: setErrorState,
    clearCurrentProduct,
    
    // Информация о роли
    isAdmin,
    isAuthor,
    isAdminOrAuthor,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}

// Дополнительные экспорты для удобства
export type {
  ProductContextType,
  ProductFilters,
  PaginationMeta,
};
