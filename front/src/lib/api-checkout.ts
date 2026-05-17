import api from './api';
import Cookies from 'js-cookie';

interface CheckoutPayload {
  guestEmail?: string;
  promoCodeId?: number;
}

export interface CheckoutSessionResponse {
  url: string;
  orderId: number;
}

function getLocale(): string {
  return Cookies.get('locale') || 'ru';
}

function getGuestId(): string | undefined {
  return Cookies.get('guest_cart_id');
}

export const checkoutApi = {
  /**
   * Create Stripe Checkout Session
   */
  async createCheckoutSession(payload: CheckoutPayload): Promise<CheckoutSessionResponse> {
    const locale = getLocale();
    const guestId = getGuestId();

    const headers: Record<string, string> = {
      'Accept-Language': locale,
    };

    if (guestId) {
      headers['x-guest-id'] = guestId;
    }

    const response = await api.post<CheckoutSessionResponse>('/checkout/session', payload, {
      headers,
    });

    return response.data;
  },
};
