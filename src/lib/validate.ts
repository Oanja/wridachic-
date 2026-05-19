/**
 * Server-side input validation helpers.
 *
 * Deliberately permissive on phone numbers — Moroccan customers enter
 * them in many formats (0612345678, +212612345678, 06 12 34 56 78, etc.)
 * and rejecting any of them would lose orders. We just cap length to
 * stop someone shipping a 1 MB payload as "phone".
 *
 * The HTML-stripping is defence-in-depth: React escapes everything by
 * default on the website, but order details flow into:
 *   - Resend HTML emails (admin + customer)
 *   - Telegram messages (parse_mode HTML)
 *   - Google Sheets cells
 * — and any of those could render injected tags if we let them through.
 */

const HTML_TAG_RE = /<[^>]*>/g;
// Very lightweight email shape check. RFC-perfect regex is multi-line
// and rejects valid edge cases; this catches obvious garbage like
// "not-an-email" or "user@" without false-negatives on real addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strip HTML tags + collapse whitespace + cap length. */
export function cleanText(value: unknown, maxLen: number): string {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  const stripped = raw.replace(HTML_TAG_RE, ' ').replace(/\s+/g, ' ').trim();
  return stripped.slice(0, maxLen);
}

/** Like cleanText but allows newlines (for addresses / comments). */
export function cleanMultiline(value: unknown, maxLen: number): string {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  // Strip tags, keep newlines, collapse runs of spaces inside lines.
  const stripped = raw
    .replace(HTML_TAG_RE, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return stripped.slice(0, maxLen);
}

/** Returns the cleaned email if it looks valid, or '' otherwise. */
export function cleanEmail(value: unknown, maxLen = 254): string {
  const t = cleanText(value, maxLen).toLowerCase();
  if (!t) return '';
  return EMAIL_RE.test(t) ? t : '';
}

/** Keep digits, +, spaces, dashes, parentheses; cap length. Does NOT enforce country format. */
export function cleanPhone(value: unknown, maxLen = 20): string {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  const cleaned = raw.replace(/[^\d+\-\s()]/g, '').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, maxLen);
}

/** Standard caps for our order/review tables. */
export const FIELD_LIMITS = {
  fullName: 100,
  phone: 20,
  email: 254,
  address: 500,
  city: 80,
  payment: 32,
  couponCode: 32,
  reviewComment: 1000,
  reviewName: 80,
} as const;
