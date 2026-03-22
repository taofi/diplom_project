export interface CartItem {
  id: number;
  productId: number;
  licenseTypeId: number;
  product: {
    id: number;
    name: string;
    price: number;
    slug: string;
    coverImage: string | null;
  };
  licenseType: {
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
}

// Guest cart item (stored in cookies)
export interface GuestCartItem {
  id: number;
  productLicenseId: number;
}
