-- Track when an order was marked delivered, mirroring the existing
-- `shipped_at` column. Lets us compute delivery duration metrics later
-- (avg "shipped → delivered" lead time per city / month).

alter table public.orders
  add column if not exists delivered_at timestamptz;
