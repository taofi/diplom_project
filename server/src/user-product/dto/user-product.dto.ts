
export class UserProductResponse {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  licenseTypeId: number;
  licenseTypeName: string;
  price: number;
  purchasedAt: Date;
  fileUrl: string;
  sellerId: number;
  count: number;
}


