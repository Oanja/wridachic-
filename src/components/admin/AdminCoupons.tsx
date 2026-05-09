'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { CouponEditor, type CouponRow } from './CouponEditor';

interface FullCoupon extends CouponRow {
  created_at?: string;
  used?: boolean;
  used_by?: string | null;
  issued_to_name?: string | null;
  issued_to_phone?: string | null;
  issued_to_city?: string | null;
  issued_order?: string | null;
}

export function AdminCoupons() {
  const sb = getSupabaseBrowser();
  const [list, setList] = useState<FullCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2400); };

  const load = async () => {
    setLoading(true);
    const { data, error } = await sb.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) showToast('⚠ ' + error.message);
    else setList((data ?? []) as FullCoupon[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const toggleActive = async (c: FullCoupon) => {
    const { error } = await sb.from('coupons').update({ active: !c.active }).eq('code', c.code);
    if (error) return showToast('⚠ ' + error.message);
    setList((prev) => prev.map((x) => (x.code === c.code ? { ...x, active: !x.active } : x)));
    showToast(c.active ? '✓ Désactivé' : '✓ Activé');
  };

  const remove = async (c: FullCoupon) => {
    if (!confirm(`Supprimer le coupon "${c.code}" ?`)) return;
    const { error } = await sb.from('coupons').delete().eq('code', c.code);
    if (error) return showToast('⚠ ' + error.message);
    setList((prev) => prev.filter((x) => x.code !== c.code));
    showToast('✓ Supprimé');
  };

  if (editing) {
    const editingCoupon = editing === 'new' ? null : list.find((c) => c.code === editing) ?? null;
    return (
      <CouponEditor
        coupon={editingCoupon}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); showToast('✓ Enregistré'); }}
      />
    );
  }

  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, padding: '12px 20px', background: '#0F0E0D', color: '#fff', borderRadius: 999, fontSize: 12, zIndex: 200 }}>{toast}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace' }}>{list.length} coupon{list.length > 1 ? 's' : ''}</div>
        <button onClick={() => setEditing('new')} style={{ padding: '10px 18px', background: 'var(--clay)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Nouveau coupon</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }}>Chargement…</div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }}>Aucun coupon. Clique &quot;+ Nouveau coupon&quot; pour commencer.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((c) => {
            const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
            const status = !c.active ? { label: 'INACTIF', color: '#999' }
              : isExpired ? { label: 'EXPIRÉ', color: '#C62828' }
              : c.usage_type === 'single_use' && c.used ? { label: 'UTILISÉ', color: '#888' }
              : { label: 'ACTIF', color: '#4CAF50' };
            return (
              <div key={c.code} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.4fr auto', gap: 16, alignItems: 'center', background: '#fff', border: '1px solid rgba(15,14,13,0.08)', borderLeft: `4px solid ${status.color}`, borderRadius: 12, padding: '16px 18px' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--clay)', letterSpacing: '0.04em', fontFamily: 'monospace' }}>{c.code}</div>
                  <div style={{ fontSize: 9, marginTop: 4, padding: '2px 8px', borderRadius: 999, background: status.color + '22', color: status.color, display: 'inline-block', fontWeight: 600, fontFamily: 'monospace' }}>{status.label}</div>
                  {c.note && <div style={{ fontSize: 11, opacity: 0.55, marginTop: 6 }}>{c.note}</div>}
                </div>
                <div style={{ fontSize: 12, fontFamily: 'monospace' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>
                    {c.type === 'percent' ? `−${c.value}%` : `−${c.value} MAD`}
                  </div>
                  <div style={{ opacity: 0.55, fontSize: 10, marginTop: 2 }}>{c.usage_type === 'single_use' ? 'Mrra wahda' : 'Réutilisable'}</div>
                </div>
                <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.6, fontFamily: 'monospace' }}>
                  {c.issued_to_name && (
                    <div style={{ marginBottom: 6, padding: '6px 8px', background: 'rgba(196,116,107,0.08)', borderRadius: 6, textAlign: 'left' }}>
                      <div style={{ fontSize: 9, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Offert à</div>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.issued_to_name}</div>
                      {c.issued_to_phone && (
                        <a href={`https://wa.me/212${c.issued_to_phone.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--clay)', textDecoration: 'underline' }}>
                          📱 {c.issued_to_phone}
                        </a>
                      )}
                      {c.issued_to_city && <div style={{ fontSize: 10, opacity: 0.6 }}>📍 {c.issued_to_city}</div>}
                      {c.issued_order && <div style={{ fontSize: 9, opacity: 0.5 }}>Cmd: {c.issued_order}</div>}
                    </div>
                  )}
                  <div>Expire: {fmtDate(c.expires_at)}</div>
                  {c.used && <div style={{ color: 'var(--clay)' }}>Utilisé par: {c.used_by ?? '—'}</div>}
                  {c.assigned_to_user_id && <div style={{ fontSize: 9, opacity: 0.5 }}>Réservé à un compte</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={() => setEditing(c.code)} style={{ padding: '7px 11px', fontSize: 11, background: '#fff', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 8, cursor: 'pointer' }}>Modifier</button>
                  <button onClick={() => toggleActive(c)} style={{ padding: '7px 11px', fontSize: 11, background: '#fff', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 8, cursor: 'pointer' }}>{c.active ? 'Désactiver' : 'Activer'}</button>
                  <button onClick={() => remove(c)} style={{ padding: '7px 11px', fontSize: 11, background: '#fff', color: '#C62828', border: '1px solid rgba(198,40,40,0.3)', borderRadius: 8, cursor: 'pointer' }}>Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
