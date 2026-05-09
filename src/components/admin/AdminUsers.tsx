'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

interface UserRow {
  id: string;
  email: string;
  full_name?: string | null;
  created_at: string;
}

interface OrderForStats {
  user_id?: string | null;
  total?: number;
}

export function AdminUsers() {
  const sb = getSupabaseBrowser();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [orders, setOrders] = useState<OrderForStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: u }, { data: o }] = await Promise.all([
        sb.from('profiles').select('*').order('created_at', { ascending: false }),
        sb.from('orders').select('user_id,total'),
      ]);
      setUsers((u ?? []) as UserRow[]);
      setOrders((o ?? []) as OrderForStats[]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userStats = (uid: string) => {
    const userOrders = orders.filter((o) => o.user_id === uid);
    return {
      count: userOrders.length,
      total: userOrders.reduce((s, o) => s + (o.total ?? 0), 0),
    };
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: '2-digit' });

  if (loading) return <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }}>Chargement…</div>;
  if (users.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }}>
        Aucun utilisateur. Crée la table `profiles` dans Supabase.
      </div>
    );
  }

  return (
    <>
      <div style={{ background: '#fff', border: '1px solid rgba(15,14,13,0.1)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
          ℹ Liste en lecture seule. Pour modifier ou supprimer → Supabase Dashboard
        </span>
        <a
          href="https://supabase.com/dashboard/project/guoapqclmskyoubyivuv/auth/users"
          target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 10, color: 'var(--clay)', textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'monospace' }}
        >→ Ouvrir Supabase Auth ↗</a>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {users.map((u) => {
          const stats = userStats(u.id);
          const seed = (u.full_name ?? u.email ?? '?').trim();
          const initials = seed.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
          const colors = ['#C8746B', '#4A90D9', '#7B68EE', '#4CAF50', '#E89B40', '#9C5CA9'];
          const hash = (u.id ?? u.email ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          const color = colors[hash % colors.length];
          return (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto auto', gap: 14, alignItems: 'center', background: '#fff', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(15,14,13,0.08)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 18, fontWeight: 600, color: '#fff', background: color }}>{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.full_name || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Sans nom</span>}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, opacity: 0.6, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 10, opacity: 0.4, marginTop: 4 }}>Inscrit le {fmtDate(u.created_at)}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 10, background: 'rgba(15,14,13,0.04)', border: '1px solid rgba(15,14,13,0.08)', minWidth: 78 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{stats.count}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Cmds</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 10, background: 'rgba(15,14,13,0.04)', border: '1px solid rgba(15,14,13,0.08)', minWidth: 78 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, lineHeight: 1, color: 'var(--clay)' }}>{stats.total}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>MAD</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
