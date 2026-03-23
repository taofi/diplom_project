'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '@/lib/api-cart';
import { useAuth } from '@/context/auth/AuthContext';
import type { CartItem, AddToCartPayload } from '@/types/cart/cart.types';

// Константы для localStorage
const GUEST_CART_KEY = 'guest_cart';

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
      setCount(localItems.length);
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
        setCount(cartItems.length);
      } else {
        // Для гостей - читаем из localStorage
        const localItems = getLocalCart();
        setItems(localItems);
        setCount(localItems.length);
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
      // Для гостей - просто читаем из localStorage
      const localItems = getLocalCart();
      setItems(localItems);
      setCount(localItems.length);
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
        setCount(cartItems.length);
      } else {
        // Для гостей - добавляем в localStorage
        const currentItems = getLocalCart();
        // Проверяем, не добавлен ли уже этот товар
        const exists = currentItems.some(
          item => item.productId === payload.productId && item.licenseTypeId === payload.licenseTypeId
        );
        if (!exists) {
          // Создаём минимальный объект товара для localStorage
          // product и licenseType будут загружены с сервера при синхронизации
          const newItem = {
            id: Date.now(), // Временный ID
            productId: payload.productId,
            licenseTypeId: payload.licenseTypeId,
          } as CartItem;
          const newItems = [...currentItems, newItem];
          setLocalCart(newItems);
          setItems(newItems);
          setCount(newItems.length);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    // Больше не поддерживается - quantity всегда 1
    // Оставляем для совместимости, но игнорируем
    if (quantity <= 1) return;
    
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        await cartApi.updateItemQuantity(itemId, quantity);
        await refreshCart();
      }
      // Для гостей quantity не поддерживается
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        await cartApi.removeItem(itemId);
        await refreshCart();
      } else {
        // Для гостей - удаляем из localStorage
        const currentItems = getLocalCart();
        const newItems = currentItems.filter(item => item.id !== itemId);
        setLocalCart(newItems);
        setItems(newItems);
        setCount(newItems.length);
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
        // Для гостей - очищаем localStorage
        clearLocalCart();
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
