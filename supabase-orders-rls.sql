-- ════════════════════════════════════════════════
-- WRIDACHIC — Fix orders RLS policies
-- Run this ONCE in Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- ════════════════════════════════════════════════

-- Enable RLS (idempotent)
alter table orders enable row level security;

-- Drop any old policies so we start clean
drop policy if exists "orders_read_all"   on orders;
drop policy if exists "orders_insert_all" on orders;
drop policy if exists "orders_update_all" on orders;
drop policy if exists "orders_delete_all" on orders;
drop policy if exists "orders_write_all"  on orders;

-- Public can READ (admin UI lists them)
create policy "orders_read_all" on orders
  for select using (true);

-- Public can INSERT (customers create orders at checkout)
create policy "orders_insert_all" on orders
  for insert with check (true);

-- Public can UPDATE (admin changes status: nouveau → confirmé → expédié → livré)
create policy "orders_update_all" on orders
  for update using (true) with check (true);

-- Public can DELETE (admin deletes orders)
create policy "orders_delete_all" on orders
  for delete using (true);

-- ✓ Done!
-- Note: "Public" here means anyone with the anon key can do these actions.
-- See SECURITY.md for the trade-off and how to harden if needed.
