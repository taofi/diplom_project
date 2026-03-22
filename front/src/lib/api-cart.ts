import api from './api';
import type { CartItem, AddToCartPayload } from '../types/cart/cart.types';
import Cookies from 'js-cookie';

// Получаем текущий язык из куки
function getLocale(): string {
  return Cookies.get('locale') || 'ru';
}

// Тип для гостевого элемента корзины
interface GuestCartItem {
  id: number;
  productLicenseId: number;
}

export const cartApi = {
  /**
   * Получить корзину пользователя
   */
  async getCart(): Promise<CartItem[]> {
    const locale = getLocale();
    const response = await api.get<CartItem[]>('/cart', {
      headers: { 'Accept-Language': locale },
    });
    return response.data;
  },

  /**
   * Добавить товар в корзину пользователя
   */
  async addItem(payload: AddToCartPayload): Promise<CartItem> {
    const locale = getLocale();
    const response = await api.post<CartItem>('/cart/items', payload, {
      headers: { 'Accept-Language': locale },
    });
    return response.data;
  },

  /**
   * Обновить количество товара в корзине пользователя
   * (больше не используется - quantity всегда 1)
   */
  async updateItemQuantity(itemId: number, quantity: number): Promise<CartItem> {
    const locale = getLocale();
    const response = await api.patch<CartItem>(`/cart/items/${itemId}`, { quantity }, {
      headers: { 'Accept-Language': locale },
    });
    return response.data;
  },

  /**
   * Удалить товар из корзины пользователя
   */
  async removeItem(itemId: number): Promise<void> {
    await api.delete(`/cart/items/${itemId}`);
  },

  /**
   * Очистить корзину пользователя
   */
  async clearCart(): Promise<void> {
    await api.delete('/cart');
  },

  /**
   * Получить количество товаров в корзине пользователя
   */
  async getCartCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/cart/count');
    return response.data;
  },

  // ============ Guest Cart Methods ============

  /**
   * Получить гостевую корзину
   */
  async getGuestCart(guestId: string): Promise<CartItem[]> {
    const locale = getLocale();
    const response = await api.get<CartItem[]>('/cart/guest', {
      headers: { 
        'x-guest-id': guestId,
        'Accept-Language': locale,
      },
    });
    return response.data;
  },

  /**
   * Добавить товар в гостевую корзину
   */
  async addGuestItem(guestId: string, payload: AddToCartPayload): Promise<CartItem> {
    const locale = getLocale();
    const response = await api.post<CartItem>('/cart/guest/items', payload, {
      headers: { 
        'x-guest-id': guestId,
        'Accept-Language': locale,
      },
    });
    return response.data;
  },

  /**
   * Обновить количество товара в гостевой корзине
   */
  async updateGuestItemQuantity(guestId: string, itemId: number, quantity: number): Promise<CartItem> {
    const locale = getLocale();
    const response = await api.patch<CartItem>(`/cart/guest/items/${itemId}`, { quantity }, {
      headers: { 
        'x-guest-id': guestId,
        'Accept-Language': locale,
      },
    });
    return response.data;
  },

  /**
   * Удалить товар из гостевой корзины
   */
  async removeGuestItem(guestId: string, itemId: number): Promise<void> {
    await api.delete(`/cart/guest/items/${itemId}`, {
      headers: { 'x-guest-id': guestId },
    });
  },

  /**
   * Очистить гостевую корзину
   */
  async clearGuestCart(guestId: string): Promise<void> {
    await api.delete('/cart/guest', {
      headers: { 'x-guest-id': guestId },
    });
  },

  /**
   * Получить количество товаров в гостевой корзине
   */
  async getGuestCartCount(guestId: string): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/cart/guest/count', {
      headers: { 'x-guest-id': guestId },
    });
    return response.data;
  },

  /**
   * Синхронизировать гостевую корзину с пользовательской
   */
  async syncCart(guestItems: GuestCartItem[]): Promise<CartItem[]> {
    const locale = getLocale();
    const response = await api.post<CartItem[]>('/cart/sync', { items: guestItems }, {
      headers: { 'Accept-Language': locale },
    });
    return response.data;
  },
};
