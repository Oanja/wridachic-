export type Lang = 'fr' | 'ar' | 'en';

export type ProductTag = 'new' | 'sale' | 'best' | undefined;

export interface Product {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  cat: string;
  price: number;
  oldPrice?: number;
  tag?: ProductTag;
  colors: string[];
  img: string;
  imgFiles: string[];
  description?: string;
  descriptionAr?: string;
  composition?: string;
  entretien?: string;
  details?: string;
  mannequin?: string;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
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
