import api from './api';
import { User } from '@/context/auth/types';
import { setAccessToken, setRefreshToken, setUserData } from './cookies';
import type { CartItem } from '@/types/cart/cart.types';

interface SendCodeResponse {
  success: boolean;
  message?: string;
  expiresIn?: number;
}

interface VerifyCodeResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
}

// Преобразовать элемент корзины в формат для отправки на сервер
function cartItemToDto(item: CartItem): { productId: number; licenseTypeId: number } {
  return {
    productId: item.productId,
    licenseTypeId: item.licenseTypeId,
  };
}

// Получаем текущий язык из куки
function getLocale(): string {
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === 'locale') {
        return value;
      }
    }
  }
  return 'ru';
}

export const checkoutVerificationApi = {
  /**
   * Отправить код верификации на email
   */
  async sendVerificationCode(email: string): Promise<SendCodeResponse> {
    const locale = getLocale();
    const response = await api.post<SendCodeResponse>('/auth/checkout/send-code', {
      email,
      locale,
    });
    return response.data;
  },

  /**
   * Подтвердить код и создать аккаунт
   * @param cartItems - элементы корзины для синхронизации
   */
  async verifyCode(email: string, code: string, cartItems?: CartItem[]): Promise<VerifyCodeResponse> {
    const payload: { email: string; code: string; cart?: { productId: number; licenseTypeId: number }[] } = {
      email,
      code,
    };
    
    // Добавляем корзину, если есть товары
    if (cartItems && cartItems.length > 0) {
      payload.cart = cartItems.map(cartItemToDto);
    }
    
    const response = await api.post<VerifyCodeResponse>('/auth/checkout/verify-code', payload);
    return response.data;
  },

  /**
   * Подтвердить код и автоматически залогинить
   * @param cartItems - элементы корзины для синхронизации
   */
  async verifyAndLogin(email: string, code: string, cartItems?: CartItem[]): Promise<VerifyCodeResponse> {
    const response = await this.verifyCode(email, code, cartItems);
    
    if (response.success && response.user && response.accessToken && response.refreshToken) {
      // Сохранить токены
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setUserData(response.user);
    }
    
    return response;
  },
};