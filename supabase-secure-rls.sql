-- ════════════════════════════════════════════════════════════════
-- WRIDACHIC — Secure RLS policies (replaces previous public-write)
-- ════════════════════════════════════════════════════════════════
--
--  HOW TO USE:
--   1. Replace the email below with YOUR admin email
--   2. Sign up an account with that email at /#account on the site
--      (or via Supabase Auth dashboard)
--   3. Paste this whole file into Supabase SQL Editor → Run
--
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────
-- 1) is_admin() helper — checks if caller is admin
-- ────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and email in (
        -- ⚠️ Admin emails — add/remove here, then re-run this SQL block:
        'othmaneanjada@gmail.com',
        'salmasissa1997@gmail.com'
      )
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;


-- ────────────────────────────────────────────────
-- 2) ORDERS — customer can read own, admin can do all
-- ────────────────────────────────────────────────
-- Add user_id column if missing (links order to logged-in customer)
alter table orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table orders enable row level security;

drop policy if exists "orders_read_all"   on orders;
drop policy if exists "orders_insert_all" on orders;
drop policy if exists "orders_update_all" on orders;
drop policy if exists "orders_delete_all" on orders;
drop policy if exists "orders_write_all"  on orders;
drop policy if exists "orders_select_self_or_admin" on orders;
drop policy if exists "orders_insert_public"       on orders;
drop policy if exists "orders_update_admin"        on orders;
drop policy if exists "orders_delete_admin"        on orders;

-- SELECT: own orders, OR admin sees all
create policy "orders_select_self_or_admin" on orders
  for select using (
    public.is_admin()
    or (auth.uid() is not null and user_id = auth.uid())
  );

-- INSERT: checkout from anyone (anon + auth). user_id, if set, must match the caller.
create policy "orders_insert_public" on orders
  for insert with check (
    user_id is null
    or user_id = auth.uid()
    or public.is_admin()
  );

-- UPDATE: admin only (status changes)
create policy "orders_update_admin" on orders
  for update using (public.is_admin()) with check (public.is_admin());

-- DELETE: admin only
create policy "orders_delete_admin" on orders
  for delete using (public.is_admin());


-- ────────────────────────────────────────────────
-- 3) PRODUCTS — public read, admin write
-- ────────────────────────────────────────────────
alter table products enable row level security;

drop policy if exists "products_read_all"   on products;
drop policy if exists "products_write_all"  on products;
drop policy if exists "products_insert_admin" on products;
drop policy if exists "products_update_admin" on products;
drop policy if exists "products_delete_admin" on products;

create policy "products_read_all" on products
  for select using (true);

create policy "products_insert_admin" on products
  for insert with check (public.is_admin());

create policy "products_update_admin" on products
  for update using (public.is_admin()) with check (public.is_admin());

create policy "products_delete_admin" on products
  for delete using (public.is_admin());


-- ────────────────────────────────────────────────
-- 4) PROFILES — own profile, admin sees all
-- ────────────────────────────────────────────────
alter table profiles enable row level security;

drop policy if exists "profiles_read_self_or_admin" on profiles;
drop policy if exists "profiles_update_self_or_admin" on profiles;
drop policy if exists "profiles_insert_self" on profiles;

create policy "profiles_read_self_or_admin" on profiles
  for select using (
    public.is_admin() or id = auth.uid()
  );

create policy "profiles_insert_self" on profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_self_or_admin" on profiles
  for update using (
    public.is_admin() or id = auth.uid()
  ) with check (
    public.is_admin() or id = auth.uid()
  );


-- ────────────────────────────────────────────────
-- 5) WISHLISTS — own only (auto-detects column name: user_id OR uid)
-- ────────────────────────────────────────────────
do $$
declare
  col_name text;
begin
  -- Skip if table doesn't exist
  if not exists (select 1 from information_schema.tables
                 where table_schema='public' and table_name='wishlists') then
    raise notice 'wishlists table not found — skipping policies';
    return;
  end if;

  -- Detect which column holds the user reference
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='wishlists' and column_name='user_id') then
    col_name := 'user_id';
  elsif exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='wishlists' and column_name='uid') then
    col_name := 'uid';
  else
    raise notice 'wishlists has neither user_id nor uid — skipping policies';
    return;
  end if;

  execute 'alter table wishlists enable row level security';

  execute 'drop policy if exists "wishlists_select_own" on wishlists';
  execute 'drop policy if exists "wishlists_insert_own" on wishlists';
  execute 'drop policy if exists "wishlists_update_own" on wishlists';
  execute 'drop policy if exists "wishlists_delete_own" on wishlists';

  execute format('create policy "wishlists_select_own" on wishlists
    for select using (%I = auth.uid())', col_name);
  execute format('create policy "wishlists_insert_own" on wishlists
    for insert with check (%I = auth.uid())', col_name);
  execute format('create policy "wishlists_update_own" on wishlists
    for update using (%I = auth.uid()) with check (%I = auth.uid())', col_name, col_name);
  execute format('create policy "wishlists_delete_own" on wishlists
    for delete using (%I = auth.uid())', col_name);
end $$;


-- ────────────────────────────────────────────────
-- 6) STORAGE — public read, admin-only write/update/delete
-- ────────────────────────────────────────────────
-- Replace the old open policies (anyone could upload/replace/delete images)
drop policy if exists "product_images_read"   on storage.objects;
drop policy if exists "product_images_write"  on storage.objects;
drop policy if exists "product_images_update" on storage.objects;
drop policy if exists "product_images_delete" on storage.objects;

-- Public read (so customers see product photos)
create policy "product_images_read" on storage.objects
  for select using (bucket_id = 'product-images');

-- Admin only: insert / update / delete
create policy "product_images_write" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());


-- ────────────────────────────────────────────────
-- ✓ Done!
-- ────────────────────────────────────────────────
-- Verify after running:
--   select public.is_admin();   -- run while logged in; should return true for admin
