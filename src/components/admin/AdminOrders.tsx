'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type RangeKey = 'today' | '7d' | '30d' | 'all';
const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Aujourd'hui",
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  all: 'Tout',
};

function startOfRange(range: RangeKey): number | null {
  const now = new Date();
  if (range === 'today') {
    const d = new Date(now); d.setHours(0, 0, 0, 0); return d.getTime();
  }
  if (range === '7d') return now.getTime() - 7 * 86400000;
  if (range === '30d') return now.getTime() - 30 * 86400000;
  return null;
}

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

// Auto-refresh interval (ms). 30s strikes a balance between fresh data and
// Supabase rate-limit politeness. Set to 0 to disable.
const AUTO_REFRESH_MS = 30000;

export function AdminOrders() {
  const sb = getSupabaseBrowser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<RangeKey>('7d');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const { data } = await sb.from('orders').select('*').order('created_at', { ascending: false });
    setOrders((data ?? []) as Order[]);
    setLastFetch(new Date());
    setLoading(false);
    setRefreshing(false);
  }, [sb]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh every AUTO_REFRESH_MS while the tab is visible
  useEffect(() => {
    if (!autoRefresh) return;
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchOrders(true);
      }
    };
    const id = window.setInterval(tick, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, fetchOrders]);

  // Stats are scoped to the time range (today / 7d / 30d / all)
  const statsOrders = useMemo(() => {
    const cutoff = startOfRange(range);
    if (cutoff === null) return orders;
    return orders.filter((o) => new Date(o.created_at).getTime() >= cutoff);
  }, [orders, range]);

  // The displayed list = stats range ∩ status filter ∩ search query
  const visibleOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return statsOrders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.order_number?.toLowerCase().includes(q) ||
        o.full_name?.toLowerCase().includes(q) ||
        o.phone?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.city?.toLowerCase().includes(q)
      );
    });
  }, [statsOrders, statusFilter, search]);

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
    setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  // Bulk actions
  const bulkUpdateStatus = async (status: string) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Passer ${ids.length} commande(s) au statut "${status}" ?`)) return;
    await sb.from('orders').update({ status }).in('id', ids);
    setOrders((prev) => prev.map((o) => (selected.has(o.id) ? { ...o, status } : o)));
    setSelected(new Set());
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Supprimer définitivement ${ids.length} commande(s) ?`)) return;
    const { error } = await sb.from('orders').delete().in('id', ids);
    if (error) { alert('Erreur Supabase : ' + error.message); return; }
    setOrders((prev) => prev.filter((o) => !selected.has(o.id)));
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === visibleOrders.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleOrders.map((o) => o.id)));
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const totalCount = statsOrders.length;
  const totalRevenue = statsOrders
    .filter((o) => o.status !== 'annulé')
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const selectedCount = selected.size;
  const allVisibleSelected = visibleOrders.length > 0 && selected.size === visibleOrders.length;

  return (
    <>
      {/* ────────── TOP BAR: période + refresh ────────── */}
      <div className="adm-topbar">
        <div className="adm-period-row">
          <span className="adm-label">Période :</span>
          {(Object.keys(RANGE_LABELS) as RangeKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setRange(k)}
              className={`adm-pill ${range === k ? 'on' : ''}`}
            >
              {RANGE_LABELS[k]}
            </button>
          ))}
        </div>
        <div className="adm-refresh-row">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, opacity: 0.7, cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto-refresh (30s)
          </label>
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="adm-pill"
            title="Rafraîchir les données"
          >
            {refreshing ? '↻ ...' : '↻ Rafraîchir'}
          </button>
          {lastFetch && (
            <span style={{ fontSize: 10, opacity: 0.5 }}>
              MAJ : {fmtTime(lastFetch)}
            </span>
          )}
        </div>
        <div className="adm-total-pill">
          <strong style={{ color: 'var(--clay)' }}>{totalCount}</strong> commandes ·{' '}
          <strong style={{ color: 'var(--clay)' }}>{totalRevenue} MAD</strong> de chiffre
        </div>
      </div>

      {/* ────────── STATUS CARDS (clickable filters) ────────── */}
      <div className="adm-stats-grid">
        <button
          onClick={() => setStatusFilter('all')}
          className={`adm-stat-card ${statusFilter === 'all' ? 'on' : ''}`}
          style={{ borderLeft: '3px solid #0F0E0D' }}
        >
          <div className="adm-stat-name">Toutes</div>
          <div className="display adm-stat-num">{totalCount}</div>
          <div className="adm-stat-meta">{totalRevenue} MAD</div>
        </button>

        {STATUS_LABELS.map((s) => {
          const list = statsOrders.filter((o) => o.status === s);
          const total = list.reduce((acc, o) => acc + (o.total || 0), 0);
          const pct = totalCount ? Math.round((list.length / totalCount) * 100) : 0;
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(active ? 'all' : s)}
              className={`adm-stat-card ${active ? 'on' : ''}`}
              style={{ borderLeft: `3px solid ${STATUS_COLORS[s]}` }}
            >
              <div className="adm-stat-name">{s}</div>
              <div className="display adm-stat-num">{list.length}</div>
              <div className="adm-stat-meta">{total} MAD{totalCount > 0 ? ` · ${pct}%` : ''}</div>
            </button>
          );
        })}
      </div>

      {/* ────────── SEARCH BAR ────────── */}
      <div className="adm-search-row">
        <input
          type="search"
          placeholder="🔍 Rechercher (numéro, nom, téléphone, email, ville)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="adm-search-input"
        />
        {(search || statusFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); }}
            className="adm-pill"
          >
            ✕ Effacer filtres
          </button>
        )}
        <span style={{ fontSize: 12, opacity: 0.55 }}>
          {visibleOrders.length} affichée(s)
        </span>
      </div>

      {/* ────────── BULK ACTIONS BAR (only when selection) ────────── */}
      {selectedCount > 0 && (
        <div className="adm-bulk-bar">
          <strong>{selectedCount} sélectionnée(s)</strong>
          <span style={{ fontSize: 11, opacity: 0.6 }}>Changer statut :</span>
          {STATUS_LABELS.map((s) => (
            <button
              key={s}
              onClick={() => bulkUpdateStatus(s)}
              className="adm-pill"
              style={{
                background: STATUS_COLORS[s] + '22',
                color: STATUS_COLORS[s],
                border: `1px solid ${STATUS_COLORS[s]}`,
              }}
            >
              {s}
            </button>
          ))}
          <button onClick={bulkDelete} className="adm-pill" style={{ background: '#C62828', color: '#fff', border: '1px solid #C62828' }}>
            ✕ Supprimer
          </button>
          <button onClick={() => setSelected(new Set())} className="adm-pill" style={{ marginLeft: 'auto' }}>
            Annuler
          </button>
        </div>
      )}

      {/* ────────── ORDERS LIST ────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }}>Chargement...</div>
      ) : visibleOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }}>
          Aucune commande {statusFilter !== 'all' || search ? 'ne correspond à ce filtre.' : 'pour l’instant.'}
        </div>
      ) : (
        <>
          {/* Select-all row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', fontSize: 11, opacity: 0.7 }}>
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAll}
              style={{ cursor: 'pointer' }}
            />
            <span>{allVisibleSelected ? 'Tout désélectionner' : 'Tout sélectionner'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {visibleOrders.map((o) => (
              <div
                key={o.id}
                className="adm-order-card"
                style={{
                  background: '#fff',
                  border: selected.has(o.id) ? '1px solid var(--clay)' : '1px solid rgba(15,14,13,0.1)',
                  borderLeft: `4px solid ${STATUS_COLORS[o.status] ?? '#999'}`,
                  borderRadius: 14,
                  padding: '18px 20px',
                  boxShadow: selected.has(o.id) ? '0 0 0 2px rgba(200,92,63,0.15)' : 'none',
                }}
              >
                <div className="adm-order-grid">
                  <div className="adm-order-num">
                    <label style={{ display: 'flex', gap: 6, alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selected.has(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        style={{ marginTop: 3, cursor: 'pointer' }}
                      />
                      <span>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--clay)' }}>{o.order_number}</div>
                        <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>{fmt(o.created_at)}</div>
                        <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 999, fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', background: (STATUS_COLORS[o.status] ?? '#999') + '22', color: STATUS_COLORS[o.status] ?? '#999' }}>{o.status}</div>
                      </span>
                    </label>
                  </div>
                  <div className="adm-order-customer">
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{o.full_name}</div>
                    <div style={{ fontSize: 11, opacity: 0.55, marginTop: 3 }}>
                      <a href={`tel:${o.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{o.phone}</a>
                      {' · '}
                      <a href={`https://wa.me/${o.phone?.replace(/^0/, '212')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none' }}>WA</a>
                    </div>
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
        </>
      )}
    </>
  );
}

export { STATUS_LABELS, STATUS_COLORS };
export type { Order };
