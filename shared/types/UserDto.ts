export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: { url: string; publicId?: string };
  role: 'customer' | 'seller' | 'admin';
  isEmailVerified: boolean;
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt?: string;
}
