-- ────────────────────────────────────────────────────────────────────────────
-- Per-order marketing consent audit trail
--
-- We need a verifiable record on EACH order of whether the customer
-- opted in to marketing emails at checkout time. This protects us legally
-- (GDPR-style) and lets us segment future campaigns.
--
-- True  → ticked the box AND provided an email
-- False → unticked, OR no email provided
-- Null  → legacy orders placed before this column existed
-- ────────────────────────────────────────────────────────────────────────────

alter table public.orders
  add column if not exists marketing_consent boolean default false;

-- Backfill legacy rows to "false" so reporting queries don't get nulls.
update public.orders
   set marketing_consent = false
 where marketing_consent is null;
