'use client';

import { useState, type ReactNode } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

interface CouponRow {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  usage_type?: 'single_use' | 'reusable';
  expires_at?: string | null;
  assigned_to_user_id?: string | null;
  note?: string | null;
  active?: boolean;
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 10, opacity: 0.55, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>{label}</div>
    {children}
  </div>
);

interface Props {
  coupon: CouponRow | null;
  onClose: () => void;
  onSaved: () => void;
}

export function CouponEditor({ coupon, onClose, onSaved }: Props) {
  const sb = getSupabaseBrowser();
  const isNew = !coupon;
  const [code, setCode] = useState(coupon?.code ?? '');
  const [type, setType] = useState<'percent' | 'fixed'>(coupon?.type ?? 'percent');
  const [value, setValue] = useState<number | string>(coupon?.value ?? 10);
  const [usageType, setUsageType] = useState<'single_use' | 'reusable'>(coupon?.usage_type ?? 'reusable');
  const [expiresAt, setExpiresAt] = useState(coupon?.expires_at ? coupon.expires_at.slice(0, 10) : '');
  const [assignedToUserId, setAssignedToUserId] = useState(coupon?.assigned_to_user_id ?? '');
  const [note, setNote] = useState(coupon?.note ?? '');
  const [active, setActive] = useState(coupon?.active !== false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!code.trim() || !value) { setErr('Code et valeur requis'); return; }
    setErr(''); setSaving(true);
    const payload = {
      code: code.trim().toUpperCase(),
      type, value: Number(value), usage_type: usageType, active, note: note || null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      assigned_to_user_id: assignedToUserId.trim() || null,
    };
    const res = isNew
      ? await sb.from('coupons').insert(payload)
      : await sb.from('coupons').update(payload).eq('code', coupon!.code);
    setSaving(false);
    if (res.error) return setErr(res.error.message);
    onSaved();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1px solid rgba(15,14,13,0.18)',
    borderRadius: 10, fontFamily: 'inherit', fontSize: 14, background: '#fff', color: '#0F0E0D',
  };

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(15,14,13,0.08)', borderRadius: 14, padding: 24, maxWidth: 640 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="display" style={{ fontSize: 22 }}>{isNew ? 'Nouveau coupon' : `Modifier ${coupon?.code}`}</div>
        <button onClick={onClose} style={{ padding: '8px 14px', border: '1px solid rgba(15,14,13,0.18)', background: '#fff', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>← Retour</button>
      </div>

      <Field label="Code">
        <input value={code} onChange={(e) => setCode(e.target.value)} disabled={!isNew} style={{ ...inputStyle, fontFamily: 'monospace', textTransform: 'uppercase', opacity: isNew ? 1 : 0.6 }} placeholder="EX: SUMMER10" />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as 'percent' | 'fixed')} style={inputStyle}>
            <option value="percent">Pourcentage (%)</option>
            <option value="fixed">Montant fixe (MAD)</option>
          </select>
        </Field>
        <Field label={type === 'percent' ? 'Valeur (%)' : 'Valeur (MAD)'}>
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)} style={inputStyle} min={1} max={type === 'percent' ? 100 : 99999} />
        </Field>
      </div>

      <Field label="Usage">
        <select value={usageType} onChange={(e) => setUsageType(e.target.value as 'single_use' | 'reusable')} style={inputStyle}>
          <option value="single_use">Single-use (mrra wahda fakat)</option>
          <option value="reusable">Réutilisable (plusieurs fois)</option>
        </select>
      </Field>

      <Field label="Date d'expiration (optionnel)">
        <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} style={inputStyle} />
      </Field>

      <Field label="Statut">
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span style={{ fontSize: 14 }}>{active ? 'Actif' : 'Inactif'}</span>
        </label>
      </Field>

      {usageType === 'reusable' && (
        <Field label="Réservé au compte (UUID utilisateur — optionnel)">
          <input value={assignedToUserId} onChange={(e) => setAssignedToUserId(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12 }} placeholder="ex: 4f8a-... (laisse vide pour usage public)" />
        </Field>
      )}

      <Field label="Note interne (optionnel)">
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} placeholder="ex: Influenceuse @sara" />
      </Field>

      {err && <div style={{ color: '#C62828', fontSize: 12, marginBottom: 12 }}>⚠ {err}</div>}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px 24px', background: 'var(--clay)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
          {saving ? '…' : (isNew ? 'Créer' : 'Enregistrer')}
        </button>
        <button onClick={onClose} style={{ padding: '12px 24px', background: '#fff', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
      </div>
    </div>
  );
}

export type { CouponRow };
