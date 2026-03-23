import api from './api';
import Cookies from 'js-cookie';

interface CheckoutPayload {
  guestEmail?: string;
  promoCodeId?: number;
}

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  licenseTypeId: number;
  licenseTypeName: string;
  price: number;
  quantity: number;
}

export interface OrderResponse {
  id: number;
  userId: number | null;
  guestEmail: string | null;
  totalAmount: number;
  discountAmount: number;
  status: string;
  items: OrderItem[];
  createdAt: string;
}

export interface CheckoutResponse {
  order: OrderResponse;
  success: boolean;
}

// Получаем текущий язык из куки
function getLocale(): string {
  return Cookies.get('locale') || 'ru';
}

// Получаем guestId из куки
function getGuestId(): string | undefined {
  return Cookies.get('guest_cart_id');
}

export const checkoutApi = {
  /**
   * Оформить заказ
   */
  async checkout(payload: CheckoutPayload): Promise<CheckoutResponse> {
    const locale = getLocale();
    const guestId = getGuestId();

    const headers: Record<string, string> = {
      'Accept-Language': locale,
    };

    if (guestId) {
      headers['x-guest-id'] = guestId;
    }

    const response = await api.post<CheckoutResponse>('/checkout', payload, {
      headers,
    });

    return response.data;
  },
};
