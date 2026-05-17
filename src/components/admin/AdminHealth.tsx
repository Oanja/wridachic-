'use client';

import { useEffect, useState } from 'react';

interface ServiceStatus { ok: boolean; latencyMs?: number; detail?: string }
interface Quota { used: number; limit?: number; usedMb?: number; limitMb?: number; pct: number; ok: boolean; source?: 'resend-api' | 'meta-api' | 'supabase-rpc' | 'estimate' }

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

// Quota labels include a hint at what's actually being measured. WhatsApp
// in particular is an *estimate* (1 conversation per order) because we
// don't poll the Meta Graph API — the user can cross-check the real
// number at business.facebook.com/wa/manage/phone-numbers.
const QUOTA_LABELS: Record<string, { label: string; note?: string }> = {
  resendEmailsToday: {
    label: '📧 E-mails envoyés (24h)',
    note: 'Plan Resend free : 100/jour · Compte réel depuis Resend API',
  },
  whatsappConvosThisMonth: {
    label: '📱 WhatsApp — conversations (ce mois)',
    note: '1 000/mois gratuites · Compte réel depuis Meta Graph API',
  },
  supabaseDb: {
    label: '🗄️ Base de données — taille réelle',
    note: 'Plan Supabase free : 500 MB · pg_database_size() live',
  },
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
                  <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {labelInfo.label}
                    {(q.source === 'resend-api' || q.source === 'meta-api' || q.source === 'supabase-rpc') && (
                      <span title={
                        q.source === 'resend-api' ? 'Chiffre temps réel via Resend API'
                        : q.source === 'meta-api' ? 'Chiffre temps réel via Meta WhatsApp Graph API'
                        : 'Chiffre temps réel via Supabase RPC (pg_database_size)'
                      } style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, background: 'rgba(76,175,80,0.15)', color: '#2E7D32', fontWeight: 700, letterSpacing: '0.04em' }}>
                        ● LIVE
                      </span>
                    )}
                  </div>
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

      {/* Quick links to external dashboards for the "real" numbers we
          can't fetch ourselves without extra API tokens. */}
      <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 10, padding: 12, marginTop: 20, fontSize: 12, lineHeight: 1.6 }}>
        💡 <strong>Pour les chiffres exacts</strong> (au lieu des estimations) :
        <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
          <li>WhatsApp : <a href="https://business.facebook.com/wa/manage/phone-numbers/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--clay)', textDecoration: 'underline' }}>Meta WhatsApp Manager → Insights</a></li>
          <li>E-mails : <a href="https://resend.com/emails" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--clay)', textDecoration: 'underline' }}>Resend → Emails</a></li>
          <li>Base de données : <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--clay)', textDecoration: 'underline' }}>Supabase → Settings → Usage</a></li>
        </ul>
      </div>

      <div style={{ fontSize: 11, opacity: 0.45, textAlign: 'center', marginTop: 16 }}>
        Surveillance automatique chaque jour à 9 h via Vercel Cron — tu reçois une alerte Telegram dès qu&apos;un service tombe ou qu&apos;un quota dépasse 80 %.
      </div>
    </div>
  );
}
