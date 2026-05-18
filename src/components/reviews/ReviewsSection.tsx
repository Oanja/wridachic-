'use client';

import { useEffect, useState } from 'react';
import { StarRating } from './StarRating';
import { pick } from '@/lib/i18n';
import { useApp } from '@/store/AppContext';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  customer_name: string;
  created_at: string;
}

interface ReviewsData {
  ok: boolean;
  avg_rating: number | null;
  total: number;
  reviews: Review[];
}

/**
 * Full reviews block for the product detail page.
 *
 * Renders three things on top of each other:
 *   1. Aggregate (average + count + bar)
 *   2. "Laisser un avis" form (collapsed by default, expands on click)
 *   3. List of approved reviews (most recent first)
 *
 * Submitting a review just shows a thank-you — the review is queued for
 * admin moderation, so we never refetch the list after submission (would
 * surprise the user if "their" review didn't appear immediately).
 */
export function ReviewsSection({ productId }: { productId: string }) {
  const { lang } = useApp();
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [hp, setHp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/reviews?product_id=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setData(j); })
      .catch(() => { if (!cancelled) setData({ ok: false, avg_rating: null, total: 0, reviews: [] }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (name.trim().length < 2) {
      setError(pick(lang, 'Merci d\'indiquer ton prénom.', 'Please add your first name.', 'كتبي اسمك من فضلك.'));
      return;
    }
    setError(''); setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, rating, comment, customer_name: name, hp }),
      });
      const json = await res.json();
      if (json.ok) {
        setSubmitted(true);
        setFormOpen(false);
        // Optimistic UX — clear the form fields.
        setComment(''); setName(''); setRating(5);
      } else {
        setError(pick(lang, 'Une erreur s\'est produite.', 'Something went wrong.', 'وقع خطأ، عاودي.'));
      }
    } catch {
      setError(pick(lang, 'Erreur réseau.', 'Network error.', 'مشكل فالشبكة.'));
    }
    setSubmitting(false);
  };

  return (
    <section style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--line)' }}>
      <h2 className="display" style={{ fontSize: 'clamp(24px, 4vw, 32px)', marginBottom: 18 }}>
        {pick(lang, 'Avis clientes', 'Customer reviews', 'آراء العميلات')}
      </h2>

      {/* Aggregate */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        {data && data.total > 0 ? (
          <>
            <StarRating value={Number(data.avg_rating) || 0} size={24} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {Number(data.avg_rating).toFixed(1)} / 5
              </div>
              <div style={{ fontSize: 13, opacity: 0.6 }}>
                {data.total} {pick(lang, data.total > 1 ? 'avis' : 'avis', data.total > 1 ? 'reviews' : 'review', 'رأي')}
              </div>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 14, opacity: 0.6 }}>
            {loading
              ? pick(lang, 'Chargement…', 'Loading…', 'كنحملو…')
              : pick(lang, 'Aucun avis pour le moment. Sois la première !', 'No reviews yet. Be the first!', 'مكاينش أراء بعد. كوني الأولى!')}
          </div>
        )}
        <button
          onClick={() => { setFormOpen((v) => !v); setSubmitted(false); }}
          className="btn2 btn2-outline"
          style={{ marginLeft: 'auto' }}
        >
          {formOpen
            ? pick(lang, 'Fermer', 'Close', 'إغلاق')
            : pick(lang, '✍️ Laisser un avis', '✍️ Leave a review', '✍️ اكتبي رأي')}
        </button>
      </div>

      {/* Thank-you toast */}
      {submitted && (
        <div style={{ background: '#C8E6C9', border: '1px solid #4CAF50', borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 16 }}>
          ✅ {pick(lang,
            'Merci ! Ton avis a été reçu — il apparaîtra après validation.',
            'Thanks! Your review was received — it will appear after validation.',
            'شكراً! وصلنا رأيك، غادي يبان مور التحقق.')}
        </div>
      )}

      {/* Submission form */}
      {formOpen && !submitted && (
        <form onSubmit={submit} style={{ background: 'var(--paper-2)', padding: 18, borderRadius: 14, marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <label className="mono" style={{ fontSize: 12, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, display: 'block', marginBottom: 8 }}>
              {pick(lang, 'Ta note', 'Your rating', 'تنقيطك')} *
            </label>
            <StarRating value={rating} size={32} onChange={setRating} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="mono" style={{ fontSize: 12, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              {pick(lang, 'Ton prénom', 'Your first name', 'اسمك')} *
            </label>
            <input
              className="input2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="mono" style={{ fontSize: 12, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              {pick(lang, 'Ton commentaire', 'Your comment', 'تعليقك')}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              rows={4}
              style={{ width: '100%', padding: 12, border: '1.5px solid rgba(15,14,13,0.22)', borderRadius: 12, fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }}
            />
          </div>
          {/* Honeypot — invisible to humans, irresistible to bots */}
          <div aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>
            <label>Site web</label>
            <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
          </div>
          {error && <div style={{ color: 'var(--clay)', fontSize: 12, marginBottom: 12 }}>{error}</div>}
          <button type="submit" className="btn2 btn2-dark" disabled={submitting}>
            {submitting
              ? '…'
              : pick(lang, '✓ Envoyer mon avis', '✓ Send my review', '✓ صيفطي رأيي')}
          </button>
        </form>
      )}

      {/* List */}
      {data && data.reviews.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.reviews.map((r) => (
            <article key={r.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: 14 }}>{r.customer_name}</strong>
                <span className="mono" style={{ fontSize: 11, opacity: 0.55 }}>
                  {new Date(r.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <StarRating value={r.rating} size={16} />
              {r.comment && (
                <p style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.comment}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
