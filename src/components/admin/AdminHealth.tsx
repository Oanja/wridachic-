'use client';

import { useEffect, useState } from 'react';

interface ServiceStatus { ok: boolean; latencyMs?: number; detail?: string }
interface Quota { used: number; limit?: number; usedMb?: number; limitMb?: number; pct: number; ok: boolean }

interface HealthData {
  ok: boolean;
  timestamp: string;
  services: Record<string, ServiceStatus>;
}
interface UsageData {
  timestamp: string;
  orders: { today: number; thisMonth: number; allTime: number };
  quotas: Record<string, Quota>;
}

const SERVICE_LABELS: Record<string, string> = {
  supabase: 'Base de données (Supabase)',
  resend: 'E-mails (Resend)',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp Cloud API',
};

const QUOTA_LABELS: Record<string, { label: string; note?: string }> = {
  resendEmailsToday: { label: 'E-mails Resend (aujourd\'hui)', note: 'limite : 100/jour' },
  whatsappConvosThisMonth: { label: 'Conversations WhatsApp (ce mois)', note: 'limite : 1 000/mois' },
  supabaseDb: { label: 'Base de données (Supabase)', note: 'limite : 500 MB' },
};

export function AdminHealth() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [h, u] = await Promise.all([
        fetch('/api/health').then((r) => r.json()),
        fetch('/api/usage-stats').then((r) => r.json()),
      ]);
      setHealth(h); setUsage(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="display" style={{ fontSize: 22 }}>État du système</div>
          <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>
            Vérifie en direct les services externes & les quotas free-tier.
          </div>
        </div>
        <button onClick={load} disabled={loading} className="adm-pill">
          {loading ? '↻ ...' : '↻ Actualiser'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,138,128,0.12)', border: '1px solid rgba(198,40,40,0.3)', color: '#C62828', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {/* SERVICES */}
      <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clay)', marginBottom: 12 }}>
        Services externes
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 28 }}>
        {health && Object.entries(health.services).map(([key, svc]) => (
          <div key={key} style={{ background: '#fff', border: '1px solid rgba(15,14,13,0.1)', borderLeft: `4px solid ${svc.ok ? '#4CAF50' : '#C62828'}`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{SERVICE_LABELS[key] || key}</div>
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: svc.ok ? 'rgba(76,175,80,0.15)' : 'rgba(198,40,40,0.15)', color: svc.ok ? '#2E7D32' : '#C62828', fontWeight: 600 }}>
                {svc.ok ? '✓ OK' : '✕ DOWN'}
              </span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.55, fontFamily: 'JetBrains Mono, monospace' }}>
              {svc.ok ? `${svc.latencyMs} ms` : svc.detail?.slice(0, 80)}
            </div>
          </div>
        ))}
      </div>

      {/* USAGE QUOTAS */}
      <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clay)', marginBottom: 12 }}>
        Quotas free-tier
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {usage && Object.entries(usage.quotas).map(([key, q]) => {
          const color = q.pct < 60 ? '#4CAF50' : q.pct < 80 ? '#D89B2B' : '#C62828';
          const labelInfo = QUOTA_LABELS[key] || { label: key };
          return (
            <div key={key} style={{ background: '#fff', border: '1px solid rgba(15,14,13,0.1)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{labelInfo.label}</div>
                  {labelInfo.note && <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>{labelInfo.note}</div>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color }}>{q.pct}%</div>
              </div>
              <div style={{ background: 'rgba(15,14,13,0.06)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${q.pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                {q.usedMb !== undefined ? `${q.usedMb} MB / ${q.limitMb} MB` : `${q.used} / ${q.limit}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* ORDER STATS */}
      {usage && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clay)', marginBottom: 12 }}>
            Commandes
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
            <div style={{ background: '#fff', border: '1px solid rgba(15,14,13,0.1)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Aujourd&apos;hui</div>
              <div className="display" style={{ fontSize: 34, marginTop: 6 }}>{usage.orders.today}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid rgba(15,14,13,0.1)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Ce mois</div>
              <div className="display" style={{ fontSize: 34, marginTop: 6 }}>{usage.orders.thisMonth}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid rgba(15,14,13,0.1)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Total</div>
              <div className="display" style={{ fontSize: 34, marginTop: 6 }}>{usage.orders.allTime}</div>
            </div>
          </div>
        </>
      )}

      <div style={{ fontSize: 11, opacity: 0.45, textAlign: 'center', marginTop: 20 }}>
        Surveillance automatique toutes les 6h via Vercel Cron — tu reçois une alerte Telegram dès qu&apos;un service tombe ou qu&apos;un quota dépasse 80%.
      </div>
    </div>
  );
}
