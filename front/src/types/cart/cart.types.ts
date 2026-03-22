export interface CartItem {
  id: number;
  productId: number;
  licenseTypeId: number;
  quantity: number;
  product?: {
    id: number;
    name: string;
    price: number;
    slug: string;
    media?: Array<{ url: string; is_main: boolean }>;
  };
  licenseType?: {
    id: number;
    name: string;
  };
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

export interface AddToCartPayload {
  productId: number;
  licenseTypeId: number;
  quantity: number;
}

// Guest cart item (stored in cookies)
export interface GuestCartItem {
  id: number;
  productLicenseId: number;
  quantity: number;
}
