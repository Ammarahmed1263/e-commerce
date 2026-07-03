export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  image: { url: string; publicId?: string };
  parent?: string; // parent category id
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}
