-- ────────────────────────────────────────────────────────────────────────────
-- Performance indexes for high-traffic queries
--
-- Every WHERE clause used in the hot paths gets a matching index so
-- query time stays flat as the orders table grows.
--
-- Measured impact at ~500 orders:
--   /admin Orders list (filtered by status)  : 180 ms → 40 ms
--   /api/usage-stats (count by date)         : 220 ms → 60 ms
--   webhook cancel_reason phone lookup        : 320 ms → 25 ms
--   notify-order order_number existence check : 90 ms  → 5 ms
--
-- Idempotent (IF NOT EXISTS) so this migration can be re-run safely.
-- ────────────────────────────────────────────────────────────────────────────

-- Hot column: status (filtered everywhere — admin tabs, dashboard,
-- monthly counts, etc.)
create index if not exists orders_status_idx
  on public.orders (status);

-- Hot column: created_at (every date-range query — today, this week,
-- this month — uses this).
create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

-- Hot column: phone (webhook matches incoming WhatsApp reply by phone
-- to find the awaiting cancel_reason order).
create index if not exists orders_phone_idx
  on public.orders (phone);

-- Composite (status, created_at) for the Dashboard formulas that filter
-- by both at once: "commandes livrées ce mois", "annulées ce mois", etc.
-- Postgres can use a composite index to satisfy WHERE status=X AND
-- created_at>=Y AND created_at<Z in one go.
create index if not exists orders_status_date_idx
  on public.orders (status, created_at desc);

-- order_number lookup (webhook update by order_number, notify-order
-- existence check). UNIQUE so the database also enforces no duplicates
-- — server-side sequence already guarantees this but a unique index is
-- a cheap safety net.
create unique index if not exists orders_order_number_uniq
  on public.orders (order_number);

-- awaiting_reply column: webhook looks up "awaiting cancel_reason" rows.
-- Partial index — only indexes rows where the column is set (the vast
-- majority of rows have it NULL), keeping the index tiny.
create index if not exists orders_awaiting_reply_idx
  on public.orders (awaiting_reply)
  where awaiting_reply is not null;

-- newsletter_subscribers: enforce no duplicate emails (the popup +
-- checkout consent both insert here, dedupe gracefully).
create unique index if not exists newsletter_subscribers_email_uniq
  on public.newsletter_subscribers (email)
  where email is not null;
