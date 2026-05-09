import type { Coupon } from './types';

const COUPON_KEY = 'wc2-coupon';

export const readCoupon = (): Coupon | null => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(sessionStorage.getItem(COUPON_KEY) || 'null'); } catch { return null; }
};

export const writeCoupon = (c: Coupon | null): void => {
  if (typeof window === 'undefined') return;
  if (c) sessionStorage.setItem(COUPON_KEY, JSON.stringify(c));
  else sessionStorage.removeItem(COUPON_KEY);
};

export const computeDiscount = (subtotal: number, coupon: Coupon | null): number => {
  if (!coupon) return 0;
  if (coupon.type === 'percent') return Math.round(subtotal * (coupon.value / 100));
  if (coupon.type === 'fixed') return Math.min(subtotal, Number(coupon.value) || 0);
  return 0;
};

export const AUTO_DISCOUNT_THRESHOLD = 2;
export const AUTO_DISCOUNT_PCT = 10;

export const computeAutoDiscount = (subtotal: number, itemsCount: number): number =>
  itemsCount >= AUTO_DISCOUNT_THRESHOLD ? Math.round(subtotal * (AUTO_DISCOUNT_PCT / 100)) : 0;
