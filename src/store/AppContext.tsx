'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { productPayload, trackMetaEvent } from '@/lib/metaPixel';
import type { CartItem, Lang } from '@/lib/types';

interface Toast {
  msg: string;
  type: 'ok' | 'err';
}

interface AppContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;

  cart: CartItem[];
  cartCount: number;
  /** Hard cap on per-line quantity — matches server validation. */
  maxQtyPerLine: number;
  addToCart: (item: CartItem) => void;
  buyNow: (item: CartItem) => void;
  updateQty: (index: number, qty: number) => void;
  /** Change size/color in place; auto-merges if the new variant already exists. */
  updateVariant: (index: number, patch: { size?: string; color?: string }) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;

  wishlist: string[];
  toggleWish: (id: string) => void;

  user: User | null;
  setUser: (u: User | null) => void;
  /** false until the initial Supabase getSession() resolves; gates auth-aware UI to prevent flicker */
  authReady: boolean;
  authOpen: boolean;
  openAuth: (prefill?: { email?: string; mode?: 'login' | 'signup' }) => void;
  closeAuth: () => void;
  authPrefill: { email: string; mode: 'login' | 'signup' };
  logout: () => Promise<void>;

  toast: Toast | null;
  showToast: (t: Toast) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const safeRead = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export function AppProvider({ children, defaultLang = 'fr' }: { children: ReactNode; defaultLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(defaultLang);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authPrefill, setAuthPrefill] = useState<{ email: string; mode: 'login' | 'signup' }>({ email: '', mode: 'login' });
  const [toast, setToast] = useState<Toast | null>(null);

  // Hydrate persisted state on mount.
  // Lang precedence: explicit user choice (localStorage) → browser preference
  // (navigator.language / languages) → server-rendered default.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wc2-lang') as Lang | null;
      if (saved === 'fr' || saved === 'ar' || saved === 'en') {
        setLangState(saved);
      } else {
        // First visit: pick from browser. ar* → ar, en* → en, else → fr.
        const candidates: string[] = [
          ...(navigator.languages ?? []),
          navigator.language,
        ].filter(Boolean);
        const detected = candidates
          .map((l) => l.toLowerCase().split('-')[0])
          .find((l) => l === 'fr' || l === 'ar' || l === 'en') as Lang | undefined;
        if (detected) setLangState(detected);
      }
    }
    setCart(safeRead<CartItem[]>('wc2-cart', []));
    setWishlist(safeRead<string[]>('wc2-wishlist', []));
  }, []);

  // Persist lang + body class
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('wc2-lang', lang);
    document.body.className = lang === 'ar' ? 'ar' : '';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('wc2-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('wc2-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Restore Supabase session + sync wishlist from cloud
  useEffect(() => {
    const sb = getSupabaseBrowser();
    sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        loadWishFromCloud(data.session.user.id);
      }
      setAuthReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadWishFromCloud(session.user.id);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWishFromCloud = async (uid: string) => {
    const sb = getSupabaseBrowser();
    const { data } = await sb.from('wishlists').select('product_ids').eq('user_id', uid).maybeSingle();
    if (data?.product_ids) setWishlist(data.product_ids as string[]);
  };

  const saveWishToCloud = async (uid: string, ids: string[]) => {
    const sb = getSupabaseBrowser();
    await sb.from('wishlists').upsert({ user_id: uid, product_ids: ids }, { onConflict: 'user_id' });
  };

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  // Two items are "the same line" if they share product id + size + color.
  // We dedupe on this triple so a customer who picks the same variant twice
  // sees their qty go up, not two separate cart rows.
  const MAX_QTY_PER_LINE = 20;
  const sameVariant = (a: { id: string; size: string; color: string }, b: { id: string; size: string; color: string }) =>
    a.id === b.id && a.size === b.size && a.color === b.color;

  const addToCart = useCallback((item: CartItem) => {
    setCart((c) => {
      const idx = c.findIndex((it) => sameVariant(it, item));
      if (idx >= 0) {
        // Same variant already in cart — merge quantities instead of
        // adding a duplicate row. Cap at 20 (matches the server limit).
        return c.map((it, i) =>
          i === idx ? { ...it, qty: Math.min(MAX_QTY_PER_LINE, it.qty + item.qty) } : it,
        );
      }
      return [...c, item];
    });
    trackMetaEvent('AddToCart', productPayload(item, item.qty));
  }, []);
  // "Acheter maintenant" used to REPLACE the cart with just this one
  // item which surprised customers — they'd add 5 items, click Acheter
  // on a 6th, and watch the previous 5 disappear. Then we swung to
  // "always append" but that surprised customers the OTHER way: they'd
  // add 2 of a dress, change their mind and click Acheter on the SAME
  // dress, and the cart would show 4 (2 + 2) instead of just going to
  // checkout with the 2 already there.
  //
  // Final behaviour: dedupe on (id, size, color) — if the same variant
  // is already in the cart, don't add another row, just go to checkout
  // with what's there. If it's a different product or a different
  // size/color, append normally.
  // "Acheter maintenant" (Buy Now). Mirrors Zara / ASOS behaviour:
  //   - If the exact variant is NOT in the cart → add it.
  //   - If it IS already there → increment the qty by what the user
  //     just picked (so picking "3" while you already had "2" gives
  //     you 5, not 2 and not 3). Capped at MAX_QTY_PER_LINE.
  // Then navigate to checkout (the navigation happens in the caller).
  const buyNow = useCallback((item: CartItem) => {
    let wasNew = true;
    setCart((c) => {
      const idx = c.findIndex((it) => sameVariant(it, item));
      if (idx >= 0) {
        wasNew = false;
        return c.map((it, i) =>
          i === idx ? { ...it, qty: Math.min(MAX_QTY_PER_LINE, it.qty + item.qty) } : it,
        );
      }
      return [...c, item];
    });
    // Fire AddToCart for the qty we actually contributed (whether the
    // line was new or we merged into an existing one). This keeps the
    // Meta funnel honest — every "Buy Now" click adds something.
    trackMetaEvent('AddToCart', productPayload(item, item.qty));
    // Avoid lint warning about an unused var — wasNew is captured for
    // future telemetry if we ever want to split "new vs merged" events.
    void wasNew;
  }, []);
  const updateQty = useCallback((index: number, qty: number) =>
    setCart((c) => c.map((it, i) =>
      i === index ? { ...it, qty: Math.max(1, Math.min(MAX_QTY_PER_LINE, qty)) } : it,
    )), []);
  // Change size/color of an existing line. If the patched variant
  // already exists as another line, MERGE them (sum quantities, capped)
  // and drop the original line — keeps the cart visually clean.
  const updateVariant = useCallback((index: number, patch: { size?: string; color?: string }) => {
    setCart((c) => {
      if (index < 0 || index >= c.length) return c;
      const original = c[index];
      const patched = { ...original, ...patch };
      // Find an existing line elsewhere with the new variant.
      const dupIdx = c.findIndex((it, i) => i !== index && sameVariant(it, patched));
      if (dupIdx >= 0) {
        // Merge into existing line, drop the original.
        const mergedQty = Math.min(MAX_QTY_PER_LINE, c[dupIdx].qty + original.qty);
        return c
          .map((it, i) => (i === dupIdx ? { ...it, qty: mergedQty } : it))
          .filter((_, i) => i !== index);
      }
      // No dup → patch in place.
      return c.map((it, i) => (i === index ? patched : it));
    });
  }, []);
  const removeItem = useCallback((index: number) =>
    setCart((c) => c.filter((_, i) => i !== index)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const toggleWish = useCallback((id: string) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setWishlist((w) => {
      const next = w.includes(id) ? w.filter((x) => x !== id) : [...w, id];
      saveWishToCloud(user.id, next);
      return next;
    });
  }, [user]);

  const openAuth = useCallback((prefill?: { email?: string; mode?: 'login' | 'signup' }) => {
    if (prefill) setAuthPrefill({ email: prefill.email ?? '', mode: prefill.mode ?? 'login' });
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
    setAuthPrefill({ email: '', mode: 'login' });
  }, []);

  const logout = useCallback(async () => {
    const sb = getSupabaseBrowser();
    await sb.auth.signOut();
    setUser(null);
    setToast({ msg: lang !== 'ar' ? '✓ Tu es déconnectée. À bientôt !' : '✓ تم تسجيل الخروج. إلى اللقاء!', type: 'ok' });
  }, [lang]);

  const showToast = useCallback((t: Toast) => setToast(t), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const value = useMemo<AppContextValue>(() => ({
    lang, setLang,
    cart, cartCount, maxQtyPerLine: MAX_QTY_PER_LINE,
    addToCart, buyNow, updateQty, updateVariant, removeItem, clearCart,
    wishlist, toggleWish,
    user, setUser, authReady, authOpen, openAuth, closeAuth, authPrefill, logout,
    toast, showToast,
  }), [lang, setLang, cart, cartCount, addToCart, buyNow, updateQty, updateVariant, removeItem, clearCart,
       wishlist, toggleWish, user, authReady, authOpen, openAuth, closeAuth, authPrefill, logout, toast, showToast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
