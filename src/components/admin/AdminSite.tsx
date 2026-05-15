'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { DEFAULT_SETTINGS, type SiteSettingKey, type SiteSettings } from '@/lib/settings';

/**
 * Admin > Site tab: edit homepage settings stored in the `site_settings`
 * key/value table. Currently the three "Shop by mood" images, but the same
 * UI scales by adding more entries to SLOTS.
 */

interface Slot {
  key: SiteSettingKey;
  label: string;
  aspect: string;
  size: string;
  ratioLabel: string;
  help: string;
  group: string;
}

const SLOTS: Slot[] = [
  // ===== HERO =====
  {
    key: 'hero_big_image',
    label: 'Hero — Grande image',
    aspect: '3/4',
    size: '1200 × 1600 px',
    ratioLabel: 'Vertical 3:4',
    help: 'Image principale du hero, en haut à droite de la page d\'accueil.',
    group: 'Hero (en-tête de la page d\'accueil)',
  },
  {
    key: 'hero_small_image',
    label: 'Hero — Petite image',
    aspect: '4/5',
    size: '960 × 1200 px',
    ratioLabel: 'Vertical 4:5',
    help: 'Petite image qui chevauche la grande (en bas à gauche).',
    group: 'Hero (en-tête de la page d\'accueil)',
  },
  // ===== SHOP BY MOOD =====
  {
    key: 'shop_mood_main_image',
    label: 'Dresses & Sets',
    aspect: '4/5',
    size: '1200 × 1500 px',
    ratioLabel: 'Vertical 4:5',
    help: 'Grande carte à gauche dans « Shop by mood ».',
    group: 'Shop by mood (3 cartes)',
  },
  {
    key: 'shop_mood_top_image',
    label: 'Nouveautés',
    aspect: '1/1',
    size: '1000 × 1000 px',
    ratioLabel: 'Carré 1:1',
    help: 'Petite carte en haut à droite.',
    group: 'Shop by mood (3 cartes)',
  },
  {
    key: 'shop_mood_bottom_image',
    label: 'Best-sellers',
    aspect: '1/1',
    size: '1000 × 1000 px',
    ratioLabel: 'Carré 1:1',
    help: 'Petite carte en bas à droite.',
    group: 'Shop by mood (3 cartes)',
  },
];

export function AdminSite() {
  const sb = getSupabaseBrowser();
  const [values, setValues] = useState<SiteSettings>({ ...DEFAULT_SETTINGS });
  const [uploading, setUploading] = useState<SiteSettingKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await sb.from('site_settings').select('key, value');
      const next = { ...DEFAULT_SETTINGS };
      for (const row of (data ?? []) as Array<{ key: string; value: string }>) {
        if (row.key in next && row.value) next[row.key as SiteSettingKey] = row.value;
      }
      setValues(next);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = async (slot: SiteSettingKey, file: File) => {
    setUploading(slot); setMsg('');
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `site/${slot}-${Date.now()}.${ext}`;
      const { error } = await sb.storage.from('product-images').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: pub } = sb.storage.from('product-images').getPublicUrl(path);
      setValues((v) => ({ ...v, [slot]: pub.publicUrl }));
    } catch (e) {
      setMsg('Upload échoué : ' + (e instanceof Error ? e.message : String(e)));
    }
    setUploading(null);
  };

  const reset = (slot: SiteSettingKey) => {
    setValues((v) => ({ ...v, [slot]: DEFAULT_SETTINGS[slot] }));
  };

  const save = async () => {
    setBusy(true); setMsg('');
    try {
      const rows = SLOTS.map(({ key }) => ({ key, value: values[key], updated_at: new Date().toISOString() }));
      const { error } = await sb.from('site_settings').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
      setMsg('✓ Enregistré. Le site sera mis à jour dans les 5 min (ISR).');
    } catch (e) {
      setMsg('Erreur : ' + (e instanceof Error ? e.message : String(e)));
    }
    setBusy(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div className="display" style={{ fontSize: 22 }}>Apparence du site</div>
        <div style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>
          Images affichées dans la section « Shop by mood » de la page d&apos;accueil.
        </div>
      </div>

      {msg && (
        <div style={{ padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13, background: msg.startsWith('✓') ? 'rgba(76,175,80,0.12)' : 'rgba(255,138,128,0.12)', color: msg.startsWith('✓') ? '#2E7D32' : '#C62828', border: '1px solid ' + (msg.startsWith('✓') ? 'rgba(76,175,80,0.3)' : 'rgba(255,138,128,0.3)') }}>
          {msg}
        </div>
      )}

      <div style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 20, fontSize: 12, background: '#FFF8F0', border: '1px solid var(--clay)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--clay)' }}>💡 Conseils images :</strong>{' '}
        Pour de meilleurs résultats, utilisez les dimensions indiquées sur chaque carte (badge orange).
        Format <strong>JPG</strong> ou <strong>WebP</strong>, poids <strong>&lt; 500 KB</strong>.
        Pour réduire le poids sans perte de qualité :{' '}
        <a href="https://squoosh.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--clay)', textDecoration: 'underline', fontWeight: 600 }}>squoosh.app</a>
        {' · '}
        <a href="https://tinypng.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--clay)', textDecoration: 'underline', fontWeight: 600 }}>tinypng.com</a>
      </div>

      {Array.from(new Set(SLOTS.map((s) => s.group))).map((groupName) => (
        <div key={groupName} style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--clay)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {groupName}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {SLOTS.filter((s) => s.group === groupName).map((slot) => {
          const current = values[slot.key];
          const isCustom = current !== DEFAULT_SETTINGS[slot.key];
          return (
            <div key={slot.key} style={{ background: '#fff', border: '1px solid rgba(15,14,13,0.1)', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{slot.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', background: 'var(--clay)', color: '#fff', padding: '3px 8px', borderRadius: 999, fontWeight: 700, letterSpacing: '0.04em' }}>
                  📐 {slot.size}
                </span>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', background: 'rgba(15,14,13,0.08)', padding: '3px 8px', borderRadius: 999, fontWeight: 600 }}>
                  {slot.ratioLabel}
                </span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 10 }}>{slot.help}</div>

              <div style={{ position: 'relative', aspectRatio: slot.aspect, borderRadius: 10, overflow: 'hidden', background: 'rgba(15,14,13,0.06)', marginBottom: 10 }}>
                {current && (
                  <Image
                    src={current}
                    alt=""
                    fill
                    sizes="280px"
                    style={{ objectFit: 'cover' }}
                    unoptimized={current.startsWith('http')}
                  />
                )}
                {isCustom && (
                  <div style={{ position: 'absolute', top: 6, left: 6, background: 'var(--clay)', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Personnalisée
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <label style={{ flex: 1, minWidth: 120, padding: '8px 12px', borderRadius: 8, background: 'var(--clay)', color: '#fff', fontSize: 12, textAlign: 'center', cursor: uploading === slot.key ? 'wait' : 'pointer', fontWeight: 600 }}>
                  {uploading === slot.key ? 'Upload...' : '📤 Changer'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) upload(slot.key, f);
                    }}
                    disabled={uploading !== null}
                  />
                </label>
                {isCustom && (
                  <button
                    onClick={() => reset(slot.key)}
                    style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', color: 'rgba(15,14,13,0.6)', border: '1px solid rgba(15,14,13,0.2)', fontSize: 12, cursor: 'pointer' }}
                  >
                    ↺ Défaut
                  </button>
                )}
              </div>
            </div>
          );
        })}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, paddingTop: 18, borderTop: '1px solid rgba(15,14,13,0.1)', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={save}
          disabled={busy || uploading !== null}
          style={{ padding: '12px 24px', fontSize: 13, background: 'var(--clay)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', opacity: busy ? 0.5 : 1 }}
        >
          {busy ? 'Enregistrement...' : '✓ Enregistrer'}
        </button>
        <span style={{ fontSize: 11, opacity: 0.5 }}>
          Les changements apparaissent sur le site sous 5 min (cache ISR).
        </span>
      </div>
    </div>
  );
}
