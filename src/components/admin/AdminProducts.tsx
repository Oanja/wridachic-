'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { ProductEditor } from './ProductEditor';

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  name_ar?: string | null;
  cat: string;
  price: number;
  tag?: string | null;
  colors?: string[] | null;
  img?: string | null;
  img_files?: string[] | null;
  description?: string | null;
  description_ar?: string | null;
  sort_order?: number;
  active?: boolean;
}

export function AdminProducts() {
  const sb = getSupabaseBrowser();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const load = async () => {
    setLoading(true);
    const { data, error } = await sb.from('products').select('*').order('sort_order', { ascending: true });
    if (error) showToast('⚠ ' + error.message);
    else setProducts((data ?? []) as ProductRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const move = async (id: string, dir: -1 | 1) => {
    const idx = products.findIndex((p) => p.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= products.length) return;
    const a = products[idx];
    const b = products[swap];
    const next = [...products];
    next[idx] = b; next[swap] = a;
    setProducts(next);
    await sb.from('products').update({ sort_order: b.sort_order }).eq('id', a.id);
    await sb.from('products').update({ sort_order: a.sort_order }).eq('id', b.id);
    showToast('✓ Ordre mis à jour');
  };

  const toggleActive = async (p: ProductRow) => {
    const { error } = await sb.from('products').update({ active: !p.active }).eq('id', p.id);
    if (error) return showToast('⚠ ' + error.message);
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)));
    showToast(p.active ? '✓ Produit masqué' : '✓ Produit activé');
  };

  const remove = async (p: ProductRow) => {
    if (!confirm(`Supprimer "${p.name}" définitivement ?`)) return;
    const { error } = await sb.from('products').delete().eq('id', p.id);
    if (error) return showToast('⚠ ' + error.message);
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
    showToast('✓ Produit supprimé');
  };

  if (editing) {
    const editingProduct = editing === 'new' ? null : products.find((p) => p.id === editing) ?? null;
    return (
      <ProductEditor
        product={editingProduct}
        nextSortOrder={Math.max(0, ...products.map((p) => p.sort_order ?? 0)) + 1}
        totalProducts={products.length}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); showToast('✓ Enregistré'); }}
      />
    );
  }

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', background: '#2E7D32', color: '#fff', padding: '10px 20px', borderRadius: 999, fontSize: 13, zIndex: 999 }}>{toast}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 11, opacity: 0.5, fontFamily: 'monospace' }}>{products.length} PRODUITS</div>
        <button onClick={() => setEditing('new')} style={{ padding: '8px 14px', background: 'var(--clay)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Ajouter un produit</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }}>Chargement...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }}>Aucun produit. Clique &quot;+ Ajouter&quot; pour commencer.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {products.map((p, i) => {
            const thumb = p.img_files?.[0] ?? (p.img ? `/assets/${p.img}.jpg` : null);
            return (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 14, alignItems: 'center', background: '#fff', padding: 12, borderRadius: 12, border: '1px solid rgba(15,14,13,0.1)', opacity: p.active ? 1 : 0.45 }}>
                {thumb ? (
                  <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 10, overflow: 'hidden', background: 'rgba(15,14,13,0.06)' }}>
                    <Image src={thumb} alt="" fill sizes="64px" style={{ objectFit: 'cover' }} unoptimized />
                  </div>
                ) : <div style={{ width: 64, height: 64, borderRadius: 10, background: 'rgba(15,14,13,0.06)' }} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name} {!p.active && <span style={{ fontSize: 10, opacity: 0.6 }}>(masqué)</span>}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>
                    {p.cat.toUpperCase()} · {p.price} MAD {p.tag && `· ${p.tag}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button disabled={i === 0} onClick={() => move(p.id, -1)} style={{ padding: '7px 11px', fontSize: 11, background: '#fff', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 8, cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                  <button disabled={i === products.length - 1} onClick={() => move(p.id, 1)} style={{ padding: '7px 11px', fontSize: 11, background: '#fff', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 8, cursor: i === products.length - 1 ? 'not-allowed' : 'pointer', opacity: i === products.length - 1 ? 0.3 : 1 }}>↓</button>
                  <button onClick={() => setEditing(p.id)} style={{ padding: '7px 11px', fontSize: 11, background: '#fff', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 8, cursor: 'pointer' }}>✎ Éditer</button>
                  <button onClick={() => toggleActive(p)} style={{ padding: '7px 11px', fontSize: 11, background: '#fff', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 8, cursor: 'pointer' }}>{p.active ? '◯ Masquer' : '● Activer'}</button>
                  <button onClick={() => remove(p)} style={{ padding: '7px 11px', fontSize: 11, background: '#fff', color: '#C62828', border: '1px solid rgba(198,40,40,0.3)', borderRadius: 8, cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
