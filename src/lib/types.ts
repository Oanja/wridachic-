export type Lang = 'fr' | 'ar' | 'en';

export type ProductTag = 'new' | 'sale' | 'best' | undefined;

export interface Product {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  nameEn?: string;
  cat: string;
  price: number;
  oldPrice?: number;
  tag?: ProductTag;
  colors: string[];
  sizes?: string[];
  img: string;
  imgFiles: string[];
  description?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  composition?: string;
  entretien?: string;
  details?: string;
  mannequin?: string;
  /** Available units in stock. null/undefined = unlimited (no tracking). 0 = sold out. */
  stock?: number | null;
  /** Unit cost (purchase price) — admin-only, used for profit calculation. */
  cost?: number | null;
  /** Aggregated rating from approved reviews. 0 = no reviews yet. */
  rating?: number;
  /** Count of approved reviews. 0 = none. */
  reviewCount?: number;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  nameEn?: string;
  desc: string;
  img: string;
}

export interface CartItem extends Product {
  size: string;
  color: string;
  qty: number;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
}
