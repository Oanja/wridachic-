'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { StarRating } from '@/components/reviews/StarRating';

/**
 * Admin moderation queue for customer reviews.
 *
 * Lists pending + approved + rejected reviews with quick actions:
 *   - Approve  → makes the review visible on the product page
 *   - Reject   → keeps it for audit but hides from the storefront
 *   - Delete   → permanently removes
 *
 * Uses the supabase BROWSER client (anon key) because the admin tab is
 * already auth-gated by AdminPage.tsx, and our RLS policy gives admins
 * full CRUD via the is_admin() check.
 */

interface Review {
  id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  customer_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const STATUS_LABELS: Record<Review['status'], { fr: string; color: string }> = {
  pending:  { fr: 'En attente',  color: '#FFE0B2' },
  approved: { fr: 'Approuvé',    color: '#C8E6C9' },
  rejected: { fr: 'Refusé',      color: '#FFCDD2' },
};

export function AdminReviews() {
  const sb = getSupabaseBrowser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<'all' | Review['status']>('pending');
  const [loading, setLoading] = useState(true);
  // editingId tracks which review is in inline-edit mode. Only one row
  // can be edited at a time to keep the UI predictable.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let q = sb.from('product_reviews')
      .select('id, product_id, rating, comment, customer_name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setReviews(data || []);
    setLoading(false);
  }, [sb, filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: Review['status']) => {
    // Optimistic UI — flip the row immediately, revert on failure.
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await sb.from('product_reviews').update({ status }).eq('id', id);
    if (error) {
      alert('Erreur: ' + error.message);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cet avis définitivement ?')) return;
    setReviews((prev) => prev.filter((r) => r.id !== id));
    const { error } = await sb.from('product_reviews').delete().eq('id', id);
    if (error) {
      alert('Erreur: ' + error.message);
      load();
    }
  };

  const startEdit = (r: Review) => {
    setEditingId(r.id);
    setEditName(r.customer_name);
    setEditRating(r.rating);
    setEditComment(r.comment || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName(''); setEditRating(5); setEditComment('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const updates = {
      customer_name: editName.trim(),
      rating: editRating,
      comment: editComment.trim() || null,
    };
    if (!updates.customer_name || updates.customer_name.length < 2) {
      alert('Le nom doit faire au moins 2 caractères.');
      return;
    }
    // Optimistic UI
    setReviews((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...updates } : r)));
    const { error } = await sb.from('product_reviews').update(updates).eq('id', editingId);
    if (error) {
      alert('Erreur: ' + error.message);
      load();
    }
    cancelEdit();
  };

  const counts = {
    pending:  reviews.filter((r) => r.status === 'pending').length,
    approved: reviews.filter((r) => r.status === 'approved').length,
    rejected: reviews.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="display" style={{ fontSize: 22 }}>Avis clientes</div>
          <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>Modère les avis reçus avant qu&apos;ils n&apos;apparaissent sur les fiches produits.</div>
        </div>
        <button onClick={load} className="adm-pill">↻ Actualiser</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="adm-pill"
            style={{
              background: filter === f ? 'var(--ink)' : '#fff',
              color: filter === f ? 'var(--paper)' : 'var(--ink)',
            }}
          >
            {f === 'all' ? 'Tous' : STATUS_LABELS[f].fr}
            {f !== 'all' && (
              <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>· {counts[f]}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ opacity: 0.5, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>...</div>
      ) : reviews.length === 0 ? (
        <div style={{ opacity: 0.5, fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
          Aucun avis dans cette catégorie.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map((r) => {
            const isEditing = editingId === r.id;
            return (
            <div key={r.id} style={{ background: '#fff', border: '1px solid rgba(15,14,13,0.1)', borderLeft: `4px solid ${STATUS_LABELS[r.status].color}`, borderRadius: 12, padding: 14 }}>
              {isEditing ? (
                /* ───── Inline edit mode ───── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Nom du client</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={100}
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid rgba(15,14,13,0.22)', borderRadius: 8, fontSize: 13, marginTop: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: 4 }}>Note</label>
                    <StarRating value={editRating} size={22} onChange={setEditRating} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Commentaire</label>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      maxLength={2000}
                      rows={4}
                      style={{ width: '100%', padding: 10, border: '1.5px solid rgba(15,14,13,0.22)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', marginTop: 4 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveEdit} className="adm-pill" style={{ background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' }}>💾 Enregistrer</button>
                    <button onClick={cancelEdit} className="adm-pill">Annuler</button>
                  </div>
                </div>
              ) : (
                /* ───── Read-only display ───── */
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.customer_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <StarRating value={r.rating} size={14} />
                        <span className="mono" style={{ fontSize: 11, opacity: 0.55 }}>
                          · {r.product_id} · {new Date(r.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: STATUS_LABELS[r.status].color, fontWeight: 600 }}>
                      {STATUS_LABELS[r.status].fr}
                    </span>
                  </div>
                  {r.comment && (
                    <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12, whiteSpace: 'pre-wrap', opacity: 0.85 }}>
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {r.status !== 'approved' && (
                      <button onClick={() => updateStatus(r.id, 'approved')} className="adm-pill" style={{ background: '#C8E6C9', borderColor: '#4CAF50' }}>✓ Approuver</button>
                    )}
                    {r.status !== 'rejected' && (
                      <button onClick={() => updateStatus(r.id, 'rejected')} className="adm-pill" style={{ background: '#FFE0B2', borderColor: '#FF9800' }}>✗ Refuser</button>
                    )}
                    <button onClick={() => startEdit(r)} className="adm-pill" style={{ background: '#E1F5FE', borderColor: '#1976D2' }}>✏️ Modifier</button>
                    <button onClick={() => remove(r.id)} className="adm-pill" style={{ background: '#FFCDD2', borderColor: '#C62828', marginLeft: 'auto' }}>🗑 Supprimer</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
