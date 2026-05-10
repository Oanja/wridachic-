'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  name_ar?: string | null;
  name_en?: string | null;
  cat: string;
  price: number;
  tag?: string | null;
  colors?: string[] | null;
  img_files?: string[] | null;
  description?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  sort_order?: number;
  active?: boolean;
}

interface Props {
  product: ProductRow | null;
  nextSortOrder: number;
  totalProducts: number;
  onClose: () => void;
  onSaved: () => void;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

export function ProductEditor({ product, nextSortOrder, totalProducts, onClose, onSaved }: Props) {
  const sb = getSupabaseBrowser();
  const isNew = !product;

  const [form, setForm] = useState({
    id: product?.id ?? `p${Date.now().toString().slice(-6)}`,
    slug: product?.slug ?? '',
    name: product?.name ?? '',
    name_ar: product?.name_ar ?? '',
    name_en: product?.name_en ?? '',
    cat: product?.cat ?? 'robes',
    price: String(product?.price ?? ''),
    tag: product?.tag ?? '',
    colors: product?.colors ?? [],
    img_files: product?.img_files ?? [],
    description: product?.description ?? '',
    description_ar: product?.description_ar ?? '',
    description_en: product?.description_en ?? '',
    sort_order: product?.sort_order ?? nextSortOrder,
    active: product?.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const [colorInput, setColorInput] = useState('');

  useEffect(() => {
    if (isNew && form.name && !form.slug) setForm((f) => ({ ...f, slug: slugify(form.name) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name]);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const addColor = () => {
    if (!colorInput) return;
    const c = colorInput.startsWith('#') ? colorInput : `#${colorInput}`;
    set('colors', [...form.colors, c]);
    setColorInput('');
  };
  const removeColor = (i: number) => set('colors', form.colors.filter((_, idx) => idx !== i));

  const uploadImage = async (file: File) => {
    setUploading(true); setErr('');
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${form.id}-${Date.now()}.${ext}`;
      const { error } = await sb.storage.from('product-images').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: pub } = sb.storage.from('product-images').getPublicUrl(path);
      set('img_files', [...form.img_files, pub.publicUrl]);
    } catch (e) {
      setErr('Upload: ' + (e instanceof Error ? e.message : String(e)));
    }
    setUploading(false);
  };

  const removeImage = (i: number) => set('img_files', form.img_files.filter((_, idx) => idx !== i));
  const moveImage = (i: number, dir: -1 | 1) => {
    const next = [...form.img_files];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set('img_files', next);
  };

  const save = async () => {
    setErr('');
    if (!form.name) return setErr('Nom requis');
    if (!form.slug) return setErr('Slug requis');
    if (!form.price || isNaN(Number(form.price))) return setErr('Prix invalide');
    setBusy(true);
    const payload = {
      id: form.id, slug: form.slug, name: form.name,
      name_ar: form.name_ar || null,
      name_en: form.name_en || null,
      cat: form.cat, price: Number(form.price), tag: form.tag || null,
      colors: form.colors, img: null,
      img_files: form.img_files,
      description: form.description || null,
      description_ar: form.description_ar || null,
      description_en: form.description_en || null,
      sort_order: Number(form.sort_order) || 0,
      active: form.active,
      updated_at: new Date().toISOString(),
    };
    const res = isNew
      ? await sb.from('products').insert(payload)
      : await sb.from('products').update(payload).eq('id', product!.id);
    setBusy(false);
    if (res.error) return setErr(res.error.message);
    onSaved();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid rgba(15,14,13,0.15)', background: '#fff',
    color: '#0F0E0D', fontSize: 14, fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, opacity: 0.7, display: 'block', marginBottom: 6, color: '#0F0E0D', fontWeight: 500 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="display" style={{ fontSize: 22 }}>{isNew ? 'Nouveau produit' : `Éditer : ${product?.name}`}</div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>ID: {form.id}</div>
        </div>
        <button onClick={onClose} style={{ padding: '8px 14px', border: '1px solid rgba(15,14,13,0.18)', background: '#fff', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>← Retour</button>
      </div>

      {err && <div style={{ background: 'rgba(255,138,128,0.12)', border: '1px solid rgba(255,138,128,0.3)', color: '#C62828', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>⚠ {err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nom (FR) *</label>
            <input style={inputStyle} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Robe Wrap Naturelle" />
          </div>
          <div>
            <label style={labelStyle}>Name (EN)</label>
            <input style={inputStyle} value={form.name_en} onChange={(e) => set('name_en', e.target.value)} placeholder="Ex: Natural Wrap Dress" />
          </div>
          <div>
            <label style={labelStyle}>Nom (AR)</label>
            <input style={inputStyle} value={form.name_ar} onChange={(e) => set('name_ar', e.target.value)} placeholder="رداء راب طبيعي" dir="rtl" />
          </div>
          <div>
            <label style={labelStyle}>Slug (URL) *</label>
            <input style={inputStyle} value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))} placeholder="robe-wrap-naturelle" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Catégorie *</label>
              <select style={inputStyle} value={form.cat} onChange={(e) => set('cat', e.target.value)}>
                <option value="prayer">Espace Prière</option>
                <option value="robes">Robes & Ensembles</option>
                <option value="basics">Denim / Basics</option>
                <option value="caftans">Caftans</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Prix (MAD) *</label>
              <input type="number" style={inputStyle} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="349" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Tag (optionnel)</label>
            <select style={inputStyle} value={form.tag} onChange={(e) => set('tag', e.target.value)}>
              <option value="">— aucun —</option>
              <option value="new">Nouveau</option>
              <option value="best">Best-seller</option>
              <option value="sale">Promo</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Description (FR)</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Description (EN)</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.description_en} onChange={(e) => set('description_en', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Description (AR)</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.description_ar} onChange={(e) => set('description_ar', e.target.value)} dir="rtl" />
          </div>
          <div>
            <label style={labelStyle}>Couleurs disponibles</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {form.colors.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(15,14,13,0.06)', padding: '4px 10px', borderRadius: 999 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.15)' }} />
                  <span style={{ fontSize: 10, fontFamily: 'monospace' }}>{c}</span>
                  <button onClick={() => removeColor(i)} style={{ background: 'transparent', color: '#C62828', fontSize: 12, padding: 0, lineHeight: 1, border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              {form.colors.length === 0 && <span style={{ fontSize: 11, opacity: 0.4 }}>Aucune couleur</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
              <input
                type="color"
                value={colorInput && /^#[0-9A-F]{6}$/i.test(colorInput) ? colorInput : '#C85C3F'}
                onChange={(e) => setColorInput(e.target.value)}
                style={{ width: 52, height: 42, padding: 2, borderRadius: 10, border: '1px solid rgba(15,14,13,0.15)', background: '#fff', cursor: 'pointer' }}
              />
              <input
                style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                placeholder="#C4746B"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }}
              />
              <button onClick={addColor} style={{ padding: '0 16px', background: 'var(--clay)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Ajouter</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Images du produit</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
              {form.img_files.map((url, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: 'rgba(15,14,13,0.06)' }}>
                  <Image src={url} alt="" fill sizes="110px" style={{ objectFit: 'cover' }} unoptimized />
                  <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 2 }}>
                    <button disabled={i === 0} onClick={() => moveImage(i, -1)} style={{ padding: '2px 6px', fontSize: 10, background: '#fff', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 6, cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.4 : 1 }}>←</button>
                    <button disabled={i === form.img_files.length - 1} onClick={() => moveImage(i, 1)} style={{ padding: '2px 6px', fontSize: 10, background: '#fff', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 6, cursor: i === form.img_files.length - 1 ? 'not-allowed' : 'pointer', opacity: i === form.img_files.length - 1 ? 0.4 : 1 }}>→</button>
                    <button onClick={() => removeImage(i)} style={{ padding: '2px 6px', fontSize: 10, background: '#fff', color: '#C62828', border: '1px solid rgba(198,40,40,0.3)', borderRadius: 6, cursor: 'pointer' }}>✕</button>
                  </div>
                  {i === 0 && <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'var(--clay)', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 4 }}>PRINCIPALE</div>}
                </div>
              ))}
              <label style={{ aspectRatio: '1', borderRadius: 10, border: '2px dashed rgba(15,14,13,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 24, opacity: 0.4 }}>+</span>
                <span style={{ fontSize: 9, opacity: 0.5 }}>{uploading ? 'Upload...' : 'Ajouter'}</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} disabled={uploading} />
              </label>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(15,14,13,0.1)', paddingTop: 14 }}>
            <label style={labelStyle}>Ordre d&apos;affichage</label>
            <input type="number" min={1} max={totalProducts + 1} style={inputStyle} value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} />
            <div style={{ fontSize: 10, opacity: 0.5, marginTop: 6 }}>1 = en premier · {totalProducts} = en dernier</div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: 12, borderRadius: 10, background: 'rgba(15,14,13,0.04)' }}>
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 14 }}>Produit visible sur le site</span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(15,14,13,0.1)', flexWrap: 'wrap' }}>
        <button onClick={save} disabled={busy || uploading} style={{ padding: '12px 24px', fontSize: 13, background: 'var(--clay)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', opacity: busy || uploading ? 0.5 : 1 }}>
          {busy ? 'Enregistrement...' : (isNew ? '✓ Créer le produit' : '✓ Enregistrer')}
        </button>
        <button onClick={onClose} style={{ padding: '12px 24px', fontSize: 13, background: '#fff', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 8, cursor: 'pointer' }}>Annuler</button>
      </div>
    </div>
  );
}
