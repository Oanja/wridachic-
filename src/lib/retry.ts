/**
 * Tiny exponential-backoff retry helper.
 *
 * Use cases:
 *  - Resend (email) sometimes returns 5xx during their incidents.
 *  - WhatsApp Cloud API throttles bursts.
 *  - Supabase has the occasional cold-start hiccup.
 *
 * The helper retries up to N times, doubling the wait between attempts,
 * and only retries when the result indicates a *transient* failure
 * (network error, 5xx, rate-limit). Permanent errors (4xx auth, bad
 * template name) are returned immediately so we don't waste cycles.
 */

export interface RetryOptions {
  attempts?: number;
  /** Base delay in ms; each retry doubles it (200, 400, 800, …). */
  baseDelayMs?: number;
  /** Decide whether a failed result deserves another try. */
  shouldRetry?: (result: unknown, attempt: number) => boolean;
  /** Tag used in the optional onAttempt log. */
  label?: string;
  /** Per-attempt callback — useful for telemetry. */
  onAttempt?: (info: { attempt: number; ok: boolean; reason?: string }) => void;
}

const DEFAULTS: Required<Omit<RetryOptions, 'shouldRetry' | 'label' | 'onAttempt'>> = {
  attempts: 3,
  baseDelayMs: 250,
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Default retry predicate for our { ok, reason } result shape: retries
 * any failure whose `reason` looks transient — HTTP 5xx, ECONNRESET,
 * timeouts, rate-limits. Anything else (auth, bad request) bails out.
 */
function defaultShouldRetry(result: unknown): boolean {
  if (typeof result !== 'object' || result === null) return false;
  const r = result as { ok?: boolean; reason?: string };
  if (r.ok) return false;
  const reason = (r.reason || '').toLowerCase();
  return (
    reason.includes('5') &&  // crude 5xx match
    (reason.includes('http 5') || reason.includes('status 5') || /\b5\d\d\b/.test(reason))
  ) ||
    reason.includes('timeout') ||
    reason.includes('econnreset') ||
    reason.includes('econnrefused') ||
    reason.includes('rate') ||
    reason.includes('429') ||
    reason.includes('network') ||
    reason.includes('fetch failed');
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const attempts = opts.attempts ?? DEFAULTS.attempts;
  const baseDelay = opts.baseDelayMs ?? DEFAULTS.baseDelayMs;
  const shouldRetry = opts.shouldRetry ?? defaultShouldRetry;

  let lastResult: T | undefined;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    let result: T;
    try {
      result = await fn();
    } catch (e) {
      result = { ok: false, reason: e instanceof Error ? e.message : String(e) } as T;
    }
    lastResult = result;

    const r = result as unknown as { ok?: boolean; reason?: string };
    opts.onAttempt?.({ attempt, ok: !!r.ok, reason: r.reason });

    if (r.ok || !shouldRetry(result, attempt)) return result;
    if (attempt < attempts) {
      await sleep(baseDelay * Math.pow(2, attempt - 1));
    }
  }
  return lastResult as T;
}
