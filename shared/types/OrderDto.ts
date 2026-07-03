export interface OrderDto {
  id: string;
  user: string; // user id
  items: Array<{
    product: string; // product id
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  paymentInfo: {
    method: string;
    transactionId: string;
    amount: number;
    currency: string;
  };
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}
