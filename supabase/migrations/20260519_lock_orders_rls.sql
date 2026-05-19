-- ⚠️ CRITICAL SECURITY FIX — 2026-05-19
--
-- Until this migration is applied, the `orders` table is fully open
-- to the anon role: ANY browser visitor can SELECT/UPDATE/DELETE all
-- rows using the public anon key (which is bundled in the JS by design).
--
-- That means any visitor to wridachic.com can dump every customer's
-- name, phone, email, and address — and tamper with order statuses.
-- This is a PII/GDPR breach.
--
-- Apply this in Supabase SQL Editor immediately.
--
-- ──────────────────────────────────────────────────────────────────

-- 1) ORDERS: owner-or-admin reads, admin-only writes, guests can still INSERT
alter table public.orders enable row level security;

-- Wipe any prior loose policies (names vary; drop the common ones).
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='orders' loop
    execute format('drop policy if exists %I on public.orders', pol.policyname);
  end loop;
end $$;

-- SELECT: only the authenticated owner (matched by user_id) or an admin.
-- Guests who placed an order without an account simply cannot re-read it
-- through the anon key — they get the confirmation email + WhatsApp
-- instead, and the admin sees everything via service-role server routes.
create policy "orders_select_own_or_admin"
on public.orders for select
using (
  (auth.uid() is not null and user_id = auth.uid())
  or public.is_admin()
);

-- INSERT: anyone can place an order, but status must start at 'nouveau'
-- (so a malicious caller can't insert a fake "livré" order to skew stats).
create policy "orders_insert_guest"
on public.orders for insert
with check (coalesce(status, 'nouveau') = 'nouveau');

-- UPDATE / DELETE: admins only. All status flips go through
-- /api/orders/mark-shipped, /api/orders/mark-delivered, etc., which
-- use the service-role key server-side anyway.
create policy "orders_update_admin"
on public.orders for update
using (public.is_admin())
with check (public.is_admin());

create policy "orders_delete_admin"
on public.orders for delete
using (public.is_admin());

-- ──────────────────────────────────────────────────────────────────

-- 2) WISHLISTS: only the owner can read or modify their own wishlist.
alter table public.wishlists enable row level security;

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='wishlists' loop
    execute format('drop policy if exists %I on public.wishlists', pol.policyname);
  end loop;
end $$;

create policy "wishlists_own_select"
on public.wishlists for select
using (auth.uid() = user_id);

create policy "wishlists_own_insert"
on public.wishlists for insert
with check (auth.uid() = user_id);

create policy "wishlists_own_update"
on public.wishlists for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "wishlists_own_delete"
on public.wishlists for delete
using (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────

-- 3) PRODUCT_REVIEWS: public can see APPROVED only; admins see all.
-- Guests can submit new reviews (they get 'pending' status by default).
alter table public.product_reviews enable row level security;

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='product_reviews' loop
    execute format('drop policy if exists %I on public.product_reviews', pol.policyname);
  end loop;
end $$;

create policy "reviews_public_approved"
on public.product_reviews for select
using (status = 'approved' or public.is_admin());

create policy "reviews_public_insert"
on public.product_reviews for insert
with check (coalesce(status, 'pending') = 'pending');

create policy "reviews_admin_update"
on public.product_reviews for update
using (public.is_admin())
with check (public.is_admin());

create policy "reviews_admin_delete"
on public.product_reviews for delete
using (public.is_admin());

-- ──────────────────────────────────────────────────────────────────
-- After running this, verify with:
--   set role anon;
--   select count(*) from public.orders;   -- expect: 0 (RLS blocks)
--   reset role;
