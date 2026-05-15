'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

const STATUS_COLORS: Record<string, string> = {
  nouveau: '#C85C3F', confirmé: '#4A90D9', expédié: '#7B68EE', livré: '#4CAF50',
  annulé: '#C62828', 'modification demandée': '#D89B2B',
};
const STATUS_LABELS = ['nouveau', 'confirmé', 'modification demandée', 'annulé', 'expédié', 'livré'];

interface Order {
  id: string;
  order_number: string;
  status: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  total: number;
  created_at: string;
  items?: Array<{ name: string; qty: number; size: string; color: string }>;
  cancel_reason?: string | null;
}

export function AdminOrders() {
  const sb = getSupabaseBrowser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await sb.from('orders').select('*').order('created_at', { ascending: false });
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const updateStatus = async (id: string, status: string) => {
    await sb.from('orders').update({ status }).eq('id', id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Supprimer cette commande définitivement ?')) return;
    const { data: deleted, error } = await sb.from('orders').delete().eq('id', id).select();
    if (error) { alert('Erreur Supabase : ' + error.message); return; }
    if (!deleted || deleted.length === 0) { alert('Suppression bloquée par RLS.'); return; }
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className="adm-stats-grid">
        {STATUS_LABELS.map((s) => {
          const list = orders.filter((o) => o.status === s);
          const total = list.reduce((acc, o) => acc + (o.total || 0), 0);
          return (
            <div key={s} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', borderLeft: `3px solid ${STATUS_COLORS[s]}` }}>
              <div style={{ fontSize: 11, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s}</div>
              <div className="display" style={{ fontSize: 34, marginTop: 6, lineHeight: 1 }}>{list.length}</div>
              <div style={{ fontSize: 12, opacity: 0.55, marginTop: 6 }}>{total} MAD</div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }}>Chargement...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }}>Aucune commande pour l&apos;instant.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map((o) => (
            <div key={o.id} className="adm-order-card" style={{ background: '#fff', border: '1px solid rgba(15,14,13,0.1)', borderLeft: `4px solid ${STATUS_COLORS[o.status] ?? '#999'}`, borderRadius: 14, padding: '18px 20px' }}>
              <div className="adm-order-grid">
                <div className="adm-order-num">
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--clay)' }}>{o.order_number}</div>
                  <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>{fmt(o.created_at)}</div>
                  <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 999, fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', background: (STATUS_COLORS[o.status] ?? '#999') + '22', color: STATUS_COLORS[o.status] ?? '#999' }}>{o.status}</div>
                </div>
                <div className="adm-order-customer">
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{o.full_name}</div>
                  <div style={{ fontSize: 11, opacity: 0.55, marginTop: 3 }}>{o.phone}</div>
                  <div style={{ fontSize: 11, opacity: 0.4 }}>{o.email}</div>
                  <div style={{ fontSize: 11, opacity: 0.4 }}>{o.address}, {o.city}</div>
                </div>
                <div className="adm-order-items">
                  {(o.items ?? []).map((it, i) => (
                    <div key={i} style={{ fontSize: 11, opacity: 0.7, marginBottom: 3 }}>
                      {it.name} × {it.qty} — {it.size}
                      <span style={{ display: 'inline-block', width: 10, height: 10, background: it.color, borderRadius: '50%', verticalAlign: 'middle', marginLeft: 6, border: '1px solid rgba(15,14,13,0.2)' }} />
                    </div>
                  ))}
                  <div style={{ marginTop: 6, fontWeight: 700 }}>{o.total} MAD</div>
                  {o.cancel_reason && (
                    <div style={{ marginTop: 10, padding: '8px 10px', background: '#FDECE8', borderLeft: '3px solid #C62828', borderRadius: 6, fontSize: 11, lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 700, color: '#C62828', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 9, marginBottom: 3 }}>
                        Raison d&apos;annulation
                      </div>
                      <div style={{ color: '#0F0E0D' }}>&ldquo;{o.cancel_reason}&rdquo;</div>
                    </div>
                  )}
                </div>
                <div className="adm-order-actions">
                  {STATUS_LABELS.map((s) => (
                    <button key={s} onClick={() => updateStatus(o.id, s)} style={{
                      padding: '6px 14px', borderRadius: 999, fontSize: 10, cursor: 'pointer',
                      background: o.status === s ? STATUS_COLORS[s] : '#fff',
                      color: o.status === s ? '#fff' : 'rgba(15,14,13,0.6)',
                      border: `1px solid ${o.status === s ? STATUS_COLORS[s] : 'rgba(15,14,13,0.18)'}`,
                      textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
                    }}>{s}</button>
                  ))}
                  <button onClick={() => deleteOrder(o.id)} style={{
                    padding: '6px 14px', borderRadius: 999, fontSize: 10, cursor: 'pointer',
                    background: '#fff', color: '#C62828',
                    border: '1px solid rgba(198,40,40,0.3)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
                    marginTop: 8,
                  }}>✕ Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export { STATUS_LABELS, STATUS_COLORS };
export type { Order };
