export type FashionCategory = 'all' | 'women' | 'men' | 'kids' | 'footwear' | 'accessories';

export interface StorefrontProduct {
  id: number;
  name: string;
  brand: string;
  category: FashionCategory;
  categoryLabel: string;
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  available_quantity: number;
  rating: number;
  reviewCount: number;
  images: string[];
  description: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  details: string[];
  isNewArrival?: boolean;
  isBestSeller?: boolean;
}

export interface CartItem {
  product: StorefrontProduct;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface CustomerShippingAddress {
  fullName: string;
  phone: string;
  pincode: string;
  addressLine: string;
  city: string;
  state: string;
}
