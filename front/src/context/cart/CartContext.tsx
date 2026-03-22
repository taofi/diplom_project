'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { cartApi } from '@/lib/api-cart';
import { useAuth } from '@/context/auth/AuthContext';
import type { CartItem, AddToCartPayload } from '@/types/cart/cart.types';

// Константы для куки
const GUEST_CART_ID_KEY = 'guest_cart_id';
const GUEST_CART_EXPIRY = 30; // дней

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

// Генерация UUID
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback для старых браузеров
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Получение или создание guestCartId
function getOrCreateGuestCartId(): string {
  let guestCartId = Cookies.get(GUEST_CART_ID_KEY);
  if (!guestCartId) {
    guestCartId = generateUUID();
    Cookies.set(GUEST_CART_ID_KEY, guestCartId, {
      path: '/',
      sameSite: 'strict',
      expires: GUEST_CART_EXPIRY,
    });
  }
  return guestCartId;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [guestCartId, setGuestCartId] = useState<string | null>(null);
  
  const { isAuthenticated } = useAuth();

  // Определяем, гость ли мы
  const isGuest = !isAuthenticated;

  // Инициализация guestCartId для неавторизованных пользователей
  useEffect(() => {
    if (!isAuthenticated) {
      const id = getOrCreateGuestCartId();
      setGuestCartId(id);
    } else {
      setGuestCartId(null);
    }
  }, [isAuthenticated]);

  // Загрузка корзины
  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        // Загружаем корзину пользователя
        const cartItems = await cartApi.getCart();
        setItems(cartItems);
        // Теперь каждый товар = 1
        setCount(cartItems.length);
      } else if (guestCartId) {
        // Загружаем гостевую корзину
        const guestItems = await cartApi.getGuestCart(guestCartId);
        setItems(guestItems);
        // Теперь каждый товар = 1
        setCount(guestItems.length);
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
  }, [isAuthenticated, guestCartId]);

  // Загружаем корзину при изменении auth статуса или guestId
  useEffect(() => {
    if (isAuthenticated || guestCartId) {
      refreshCart();
    }
  }, [refreshCart, isAuthenticated, guestCartId]);

  // Синхронизация корзины при входе
  const syncCart = useCallback(async (guestId: string) => {
    try {
      // Получаем гостевую корзину
      const guestItems = await cartApi.getGuestCart(guestId);
      
      if (guestItems.length > 0) {
        // Синхронизируем с сервером - добавляем каждый товар в пользовательскую корзину
        for (const item of guestItems) {
          await cartApi.addItem({
            productId: item.productId,
            licenseTypeId: item.licenseTypeId
          });
        }
        
        // Очищаем гостевую корзину
        await cartApi.clearGuestCart(guestId);
        
        // Удаляем куку
        Cookies.remove(GUEST_CART_ID_KEY);
      }
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  }, []);

  // Эффект для синхронизации при входе
  useEffect(() => {
    if (isAuthenticated && guestCartId) {
      syncCart(guestCartId);
    }
  }, [isAuthenticated, guestCartId, syncCart]);

  const addItem = async (payload: AddToCartPayload) => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        await cartApi.addItem(payload);
      } else if (guestCartId) {
        await cartApi.addGuestItem(guestCartId, payload);
      }
      await refreshCart();
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
      } else if (guestCartId) {
        await cartApi.updateGuestItemQuantity(guestCartId, itemId, quantity);
      }
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        await cartApi.removeItem(itemId);
      } else if (guestCartId) {
        await cartApi.removeGuestItem(guestCartId, itemId);
      }
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  };

  const clearCartItems = async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        await cartApi.clearCart();
      } else if (guestCartId) {
        await cartApi.clearGuestCart(guestCartId);
      }
      await refreshCart();
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
