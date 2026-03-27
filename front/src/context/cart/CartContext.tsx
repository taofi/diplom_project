'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '@/lib/api-cart';
import { useAuth } from '@/context/auth/AuthContext';
import { getGuestId, setGuestId } from '@/lib/cookies';
import type { CartItem, AddToCartPayload } from '@/types/cart/cart.types';

// Константы для localStorage
const GUEST_CART_KEY = 'guest_cart';

// Функция для генерации уникального guestId
function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Функция для получения или создания guestId
function getOrCreateGuestId(): string {
  let guestId = getGuestId();
  if (!guestId) {
    guestId = generateGuestId();
    setGuestId(guestId);
  }
  return guestId;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  isLoading: boolean;
  isGuest: boolean;
  addItem: (payload: AddToCartPayload) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Получение корзины из localStorage
function getLocalCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(GUEST_CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Сохранение корзины в localStorage
function setLocalCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
}

// Очистка корзины в localStorage
function clearLocalCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_CART_KEY);
}

// Проверка, содержит ли объект данные (не пустой)
function hasValidData(obj: unknown): boolean {
  return obj !== null && obj !== undefined && (typeof obj === 'object' ? Object.keys(obj).length > 0 : true);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [localCartLoaded, setLocalCartLoaded] = useState(false);
  
  const { isAuthenticated } = useAuth();

  // Определяем, гость ли мы
  const isGuest = !isAuthenticated;

  // Загрузка корзины из localStorage при инициализации (для гостей)
  useEffect(() => {
    if (!isAuthenticated && !localCartLoaded) {
      const localItems = getLocalCart();
      setItems(localItems);
      // Подсчитываем общее количество с учётом quantity
      const totalCount = localItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
      setCount(totalCount);
      setLocalCartLoaded(true);
    }
  }, [isAuthenticated, localCartLoaded]);

  // Загрузка корзины с сервера
  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        // Не загружаем с сервера если корзина пустая (оптимизация)
        // Сначала проверим, есть ли локальные данные (могут быть не синхронизированы)
        const localItems = getLocalCart();
        
        if (localItems.length > 0) {
          // Есть локальные данные - синхронизируем с сервером
          for (const item of localItems) {
            await cartApi.addItem({
              productId: item.productId,
              licenseTypeId: item.licenseTypeId
            });
          }
          // Очищаем localStorage после синхронизации
          clearLocalCart();
        }
        
        // Загружаем корзину пользователя с сервера
        const cartItems = await cartApi.getCart();
        setItems(cartItems);
        // Подсчитываем общее количество с учётом quantity
        const totalCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCount(totalCount);
      } else {
        // Для гостей - получаем guestId и загружаем с сервера
        const guestId = getOrCreateGuestId();
        
        // Сначала проверим, есть ли локальные данные (могут быть не синхронизированы)
        const localItems = getLocalCart();
        
        if (localItems.length > 0) {
          // Есть локальные данные - синхронизируем с сервером
          for (const item of localItems) {
            await cartApi.addGuestItem(guestId, {
              productId: item.productId,
              licenseTypeId: item.licenseTypeId
            });
          }
          // Очищаем localStorage после синхронизации
          clearLocalCart();
        }
        
        // Загружаем гостевую корзину с сервера
        const cartItems = await cartApi.getGuestCart(guestId);
        setItems(cartItems);
        // Подсчитываем общее количество с учётом quantity
        const totalCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCount(totalCount);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      // Для гостей просто сбрасываем на пустую корзину
      if (!isAuthenticated) {
        setItems([]);
        setCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Загружаем корзину при изменении auth статуса
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else if (localCartLoaded) {
      // Для гостей - используем guestId и загружаем с сервера
      const guestId = getOrCreateGuestId();
      cartApi.getGuestCart(guestId)
        .then(cartItems => {
          setItems(cartItems);
          const totalCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
          setCount(totalCount);
        })
        .catch(error => {
          console.error('Failed to fetch guest cart:', error);
          // Fallback - читаем из localStorage
          const localItems = getLocalCart();
          setItems(localItems);
          const totalCount = localItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
          setCount(totalCount);
        });
    }
  }, [isAuthenticated, localCartLoaded, refreshCart]);

  // Синхронизация корзины при входе (для обратной совместимости)
  const syncCart = useCallback(async () => {
    try {
      // Получаем корзину из localStorage
      const localItems = getLocalCart();
      
      if (localItems.length > 0) {
        // Синхронизируем с сервером - добавляем каждый товар
        for (const item of localItems) {
          await cartApi.addItem({
            productId: item.productId,
            licenseTypeId: item.licenseTypeId
          });
        }
        
        // Очищаем localStorage
        clearLocalCart();
      }
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  }, []);

  // Эффект для синхронизации при входе
  useEffect(() => {
    if (isAuthenticated && localCartLoaded) {
      syncCart();
    }
  }, [isAuthenticated, localCartLoaded, syncCart]);

  const addItem = async (payload: AddToCartPayload) => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        await cartApi.addItem(payload);
        // Обновляем корзину с сервера
        const cartItems = await cartApi.getCart();
        setItems(cartItems);
        // Подсчитываем общее количество с учётом quantity
        const totalCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCount(totalCount);
      } else {
        // Для гостей - добавляем на сервер
        const guestId = getOrCreateGuestId();
        const newItem = await cartApi.addGuestItem(guestId, payload);
        
        // Обновляем корзину с сервера (чтобы получить полные данные с переводами)
        const cartItems = await cartApi.getGuestCart(guestId);
        setItems(cartItems);
        // Подсчитываем общее количество с учётом quantity
        const totalCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCount(totalCount);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (quantity <= 0) return;
    
    // Сохраняем предыдущее состояние для возможности отката
    const previousItems = [...items];
    const previousCount = count;
    
    // Оптимистичное обновление - сразу обновляем UI
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity };
      }
      return item;
    });
    const newCount = updatedItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setItems(updatedItems);
    setCount(newCount);
    
    // Для гостей также обновляем localStorage
    if (!isAuthenticated) {
      setLocalCart(updatedItems);
    }
    
    try {
      if (isAuthenticated) {
        // Отправляем запрос на сервер
        const serverItem = await cartApi.updateItemQuantity(itemId, quantity);
        
        // Обновляем элемент данными с сервера
        // Мерджим данные: quantity с сервера, остальное - из локального состояния
        // (сервер может возвращать пустые product/licenseType)
        const finalItems = updatedItems.map(item => {
          if (item.id === itemId) {
            // Если сервер вернул валидные данные, используем их, иначе - локальные
            const serverProductValid = hasValidData(serverItem.product);
            const serverLicenseValid = hasValidData(serverItem.licenseType);
            return {
              ...item,
              quantity: serverItem.quantity,
              product: serverProductValid ? serverItem.product : item.product,
              licenseType: serverLicenseValid ? serverItem.licenseType : item.licenseType,
            };
          }
          return item;
        });
        
        // Пересчитываем общее количество
        const finalCount = finalItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setItems(finalItems);
        setCount(finalCount);
      } else {
        // Для гостей - отправляем запрос на сервер
        const guestId = getOrCreateGuestId();
        const serverItem = await cartApi.updateGuestItemQuantity(guestId, itemId, quantity);
        
        // Обновляем элемент данными с сервера
        const finalItems = updatedItems.map(item => {
          if (item.id === itemId) {
            const serverProductValid = hasValidData(serverItem.product);
            const serverLicenseValid = hasValidData(serverItem.licenseType);
            return {
              ...item,
              quantity: serverItem.quantity,
              product: serverProductValid ? serverItem.product : item.product,
              licenseType: serverLicenseValid ? serverItem.licenseType : item.licenseType,
            };
          }
          return item;
        });
        
        // Пересчитываем общее количество
        const finalCount = finalItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setItems(finalItems);
        setCount(finalCount);
      }
      // Для гостей уже обновили выше
    } catch (error) {
      // Откат состояния при ошибке
      console.error('Failed to update quantity:', error);
      setItems(previousItems);
      setCount(previousCount);
      if (!isAuthenticated) {
        setLocalCart(previousItems);
      }
      throw error;
    }
  };

  const removeItem = async (itemId: number) => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        await cartApi.removeItem(itemId);
        await refreshCart();
      } else {
        // Для гостей - удаляем через API
        const guestId = getOrCreateGuestId();
        await cartApi.removeGuestItem(guestId, itemId);
        
        // Обновляем корзину с сервера
        const cartItems = await cartApi.getGuestCart(guestId);
        setItems(cartItems);
        // Подсчитываем общее количество с учётом quantity
        const totalCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCount(totalCount);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearCartItems = async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        await cartApi.clearCart();
        setItems([]);
        setCount(0);
      } else {
        // Для гостей - очищаем через API
        const guestId = getOrCreateGuestId();
        await cartApi.clearGuestCart(guestId);
        setItems([]);
        setCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        isLoading,
        isGuest,
        addItem,
        updateQuantity,
        removeItem,
        clearCart: clearCartItems,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
