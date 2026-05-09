'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

interface Subscriber {
  id?: string;
  email?: string | null;
  phone?: string | null;
  created_at?: string;
}

export function AdminNewsletter() {
  const sb = getSupabaseBrowser();
  const [list, setList] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('wridachic — nouveauté');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'email' | 'phone'>('all');
  const [toast, setToast] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; error?: string } | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    (async () => {
      const { data } = await sb.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
      setList((data ?? []) as Subscriber[]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = list.filter((s) => {
    if (filter === 'email') return !!s.email;
    if (filter === 'phone') return !!s.phone;
    return true;
  });

  const stats = {
    total: list.length,
    withEmail: list.filter((s) => s.email).length,
    withPhone: list.filter((s) => s.phone).length,
  };

  const copyAll = (kind: 'email' | 'phone') => {
    const vals = list.map((s) => s[kind]).filter(Boolean) as string[];
    navigator.clipboard.writeText(vals.join('\n')).then(
      () => showToast(`✓ ${vals.length} ${kind}s copiés`),
      () => showToast('⚠ Impossible de copier'),
    );
  };

  const waLink = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '').replace(/^0/, '');
    const intl = cleaned.startsWith('212') ? cleaned : `212${cleaned}`;
    return `https://wa.me/${intl}${message ? '?text=' + encodeURIComponent(message) : ''}`;
  };
  const mailLink = (email: string) =>
    `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

  const sendBulk = async () => {
    const targets = list.map((s) => s.email).filter(Boolean) as string[];
    if (targets.length === 0) { showToast('⚠ Aucun e-mail à envoyer'); return; }
    if (!subject.trim() || !message.trim()) { showToast('⚠ Sujet et message requis'); return; }
    if (!confirm(`Envoyer à ${targets.length} personne(s) ?`)) return;

    setSending(true); setSendResult(null);
    try {
      const html = message
        .split('\n')
        .map((l) => l.trim()
          ? `<p style="margin:0 0 14px;line-height:1.6;font-family:-apple-system,'Segoe UI',sans-serif;color:#0F0E0D">${l.replace(/</g, '&lt;')}</p>`
          : '<br/>')
        .join('');
      const wrapped = `<div style="max-width:560px;margin:0 auto;padding:24px;background:#FAF6F1">${html}<p style="margin-top:28px;font-size:12px;color:rgba(15,14,13,0.5);font-family:-apple-system,'Segoe UI',sans-serif">— wridachic · <a href="https://wridachic.com" style="color:#C8746B">wridachic.com</a></p></div>`;

      const { data, error } = await sb.functions.invoke('send-newsletter', {
        body: { subject: subject.trim(), html: wrapped, recipients: targets },
      });
      if (error) throw error;
      setSendResult({ sent: data?.sent ?? 0, failed: data?.failed ?? 0 });
    } catch (e) {
      setSendResult({ sent: 0, failed: targets.length, error: e instanceof Error ? e.message : String(e) });
    }
    setSending(false);
  };

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, padding: '12px 20px', background: '#0F0E0D', color: '#fff', borderRadius: 999, fontSize: 12, zIndex: 200 }}>{toast}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
        {([
          ['Total inscrits', stats.total, '#0F0E0D'],
          ['Avec e-mail', stats.withEmail, '#4A90D9'],
          ['Avec téléphone', stats.withPhone, '#4CAF50'],
        ] as const).map(([l, v, c]) => (
          <div key={l} style={{ background: '#fff', border: '1px solid rgba(15,14,13,0.08)', borderLeft: `3px solid ${c}`, borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace' }}>{l}</div>
            <div className="display" style={{ fontSize: 28, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid rgba(15,14,13,0.08)', borderRadius: 12, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
          Sujet (e-mail uniquement)
        </div>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="ex: Nouvelle collection -10% cette semaine" style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 10, fontFamily: 'inherit', fontSize: 14, marginBottom: 12 }} />

        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
          Message
        </div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ex: Salam ! Nouvelle collection dispo cette semaine — −10% sur tout avec le code SPRING. wridachic.com" rows={5} style={{ width: '100%', padding: 12, border: '1px solid rgba(15,14,13,0.18)', borderRadius: 10, fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }} />

        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={sendBulk} disabled={sending || !message.trim() || !subject.trim() || stats.withEmail === 0} style={{ padding: '10px 18px', background: 'var(--clay)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: sending || !message.trim() || !subject.trim() || stats.withEmail === 0 ? 0.5 : 1 }}>
            {sending ? '⏳ Envoi en cours…' : `📨 Envoyer à toutes (${stats.withEmail})`}
          </button>
          <span style={{ fontSize: 10, opacity: 0.55, fontFamily: 'monospace' }}>via Resend · domaine vérifié requis</span>
        </div>
        {sendResult && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, fontSize: 12, fontFamily: 'monospace', background: sendResult.failed === 0 ? 'rgba(76,175,80,0.12)' : 'rgba(198,40,40,0.08)', color: sendResult.failed === 0 ? '#3D7A2C' : '#C62828' }}>
            ✓ {sendResult.sent} envoyés · ✕ {sendResult.failed} échoués
            {sendResult.error && <div style={{ marginTop: 4, opacity: 0.85 }}>Erreur: {sendResult.error}</div>}
          </div>
        )}

        <div style={{ fontSize: 10, opacity: 0.55, marginTop: 14, paddingTop: 12, borderTop: '1px dashed rgba(15,14,13,0.1)', fontFamily: 'monospace' }}>
          Ou envoie individuellement: clique 📱 WhatsApp ou ✉ Email à côté de chaque inscrite.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={() => copyAll('email')} style={{ padding: '7px 11px', fontSize: 12, background: '#fff', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 8, cursor: 'pointer' }}>📋 Copier tous les e-mails</button>
          <button onClick={() => copyAll('phone')} style={{ padding: '7px 11px', fontSize: 12, background: '#fff', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 8, cursor: 'pointer' }}>📋 Copier tous les téléphones</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {([
          ['all', `Tous (${stats.total})`],
          ['email', `E-mail (${stats.withEmail})`],
          ['phone', `Téléphone (${stats.withPhone})`],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{
            padding: '6px 14px', borderRadius: 999, fontSize: 11, fontFamily: 'monospace',
            background: filter === id ? '#0F0E0D' : '#fff',
            color: filter === id ? '#fff' : '#0F0E0D',
            border: '1px solid rgba(15,14,13,0.18)', cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }}>Aucune inscrite pour ce filtre.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((s) => (
            <div key={s.id ?? s.email ?? s.phone} style={{ background: '#fff', border: '1px solid rgba(15,14,13,0.08)', borderRadius: 10, padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                {s.email && <div style={{ fontSize: 13, fontWeight: 500 }}>{s.email}</div>}
                {s.phone && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2, fontFamily: 'monospace' }}>📱 {s.phone}</div>}
                <div style={{ fontSize: 9, opacity: 0.45, marginTop: 4, fontFamily: 'monospace' }}>
                  {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {s.phone && (
                  <a href={waLink(s.phone)} target="_blank" rel="noopener noreferrer" style={{ padding: '7px 11px', fontSize: 11, background: '#25D366', color: '#fff', border: '1px solid #25D366', borderRadius: 8, textDecoration: 'none' }}>📱 WhatsApp</a>
                )}
                {s.email && (
                  <a href={mailLink(s.email)} style={{ padding: '7px 11px', fontSize: 11, background: '#fff', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 8, textDecoration: 'none' }}>✉ Email</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
