'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/lib/supabase/client';
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
  addToCart: (item: CartItem) => void;
  buyNow: (item: CartItem) => void;
  updateQty: (index: number, qty: number) => void;
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
  const addToCart = useCallback((item: CartItem) => setCart((c) => [...c, item]), []);
  const buyNow = useCallback((item: CartItem) => setCart([item]), []);
  const updateQty = useCallback((index: number, qty: number) =>
    setCart((c) => c.map((it, i) => (i === index ? { ...it, qty } : it))), []);
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
    cart, cartCount, addToCart, buyNow, updateQty, removeItem, clearCart,
    wishlist, toggleWish,
    user, setUser, authReady, authOpen, openAuth, closeAuth, authPrefill, logout,
    toast, showToast,
  }), [lang, setLang, cart, cartCount, addToCart, buyNow, updateQty, removeItem, clearCart,
       wishlist, toggleWish, user, authReady, authOpen, openAuth, closeAuth, authPrefill, logout, toast, showToast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
