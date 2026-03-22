import api from './api';
import type { CartItem, AddToCartPayload } from '../types/cart/cart.types';

// Тип для гостевого элемента корзины
interface GuestCartItem {
  id: number;
  productLicenseId: number;
  quantity: number;
}

export const cartApi = {
  /**
   * Получить корзину пользователя
   */
  async getCart(): Promise<CartItem[]> {
    const response = await api.get<CartItem[]>('/cart');
    return response.data;
  },

  /**
   * Добавить товар в корзину пользователя
   */
  async addItem(payload: AddToCartPayload): Promise<CartItem> {
    const response = await api.post<CartItem>('/cart/items', payload);
    return response.data;
  },

  /**
   * Обновить количество товара в корзине пользователя
   */
  async updateItemQuantity(itemId: number, quantity: number): Promise<CartItem> {
    const response = await api.patch<CartItem>(`/cart/items/${itemId}`, { quantity });
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
  async getGuestCart(guestId: string): Promise<GuestCartItem[]> {
    const response = await api.get<GuestCartItem[]>('/cart/guest', {
      headers: { 'x-guest-id': guestId },
    });
    return response.data;
  },

  /**
   * Добавить товар в гостевую корзину
   */
  async addGuestItem(guestId: string, payload: AddToCartPayload): Promise<GuestCartItem> {
    const response = await api.post<GuestCartItem>('/cart/guest/items', payload, {
      headers: { 'x-guest-id': guestId },
    });
    return response.data;
  },

  /**
   * Обновить количество товара в гостевой корзине
   */
  async updateGuestItemQuantity(guestId: string, itemId: number, quantity: number): Promise<GuestCartItem> {
    const response = await api.patch<GuestCartItem>(`/cart/guest/items/${itemId}`, { quantity }, {
      headers: { 'x-guest-id': guestId },
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
    const response = await api.post<CartItem[]>('/cart/sync', { items: guestItems });
    return response.data;
  },
};
