export interface ProductDto {
  id: string;
  vendor: string; // vendor id
  category: string; // category id
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  thumbnail: { url: string; publicId?: string };
  images: Array<{ url: string; publicId?: string; alt?: string; order?: number }>;
  stock: number;
  isFeatured: boolean;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  rating: { average: number; count: number };
  salesCount: number;
  createdAt: string;
  updatedAt?: string;
}
