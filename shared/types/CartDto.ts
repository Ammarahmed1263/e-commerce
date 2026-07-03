export interface CartDto {
  id: string;
  user: string; // user id
  items: Array<{
    product: string; // product id
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  summary: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    couponDiscount: number;
    total: number;
    currency: string;
    itemCount: number;
  };
  coupon?: {
    code: string;
    discount: number;
    couponId: string;
  };
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}
