-- ────────────────────────────────────────────────────────────────────────────
-- Customer product reviews
--
-- All reviews land as `pending` and are invisible to customers until an
-- admin flips them to `approved` from the new Reviews tab in /admin.
-- This protects the storefront from spam, fake competitor reviews, and
-- abusive language while still letting any visitor submit a review with
-- one click (no account required — matches Morocco DTC norms).
--
-- Tables
--   product_reviews    individual reviews
--
-- RLS
--   public anon read  → only `approved` rows
--   public anon write → can INSERT (rating 1-5, status forced to pending)
--   admins            → full CRUD via is_admin()
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.product_reviews (
  id            uuid primary key default gen_random_uuid(),
  product_id    text not null,
  user_id       uuid references auth.users(id) on delete set null,
  rating        int2 not null check (rating between 1 and 5),
  comment       text,
  -- Display name shown next to the review. We capture it explicitly
  -- instead of reading from auth.users because guests (no account) are
  -- allowed to leave reviews too.
  customer_name text not null,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now()
);

create index if not exists product_reviews_product_idx on public.product_reviews(product_id);
create index if not exists product_reviews_status_idx on public.product_reviews(status);
create index if not exists product_reviews_created_idx on public.product_reviews(created_at desc);

alter table public.product_reviews enable row level security;

-- Drop existing policies to make this migration safely re-runnable.
drop policy if exists "anyone reads approved reviews"  on public.product_reviews;
drop policy if exists "anyone can submit a review"     on public.product_reviews;
drop policy if exists "admin full access on reviews"   on public.product_reviews;

-- READ: only approved reviews are visible to anyone.
create policy "anyone reads approved reviews"
  on public.product_reviews for select
  using (status = 'approved');

-- INSERT: anyone can leave a review, but only as pending. The CHECK on
-- the column already enforces rating 1-5 and status default.
create policy "anyone can submit a review"
  on public.product_reviews for insert
  with check (status = 'pending' and length(coalesce(customer_name, '')) between 1 and 100);

-- ADMIN: full read/write access for moderation. Relies on the existing
-- is_admin() helper used elsewhere in the codebase.
create policy "admin full access on reviews"
  on public.product_reviews for all
  using (public.is_admin())
  with check (public.is_admin());

-- Helper RPC: aggregate rating for one product. Used by the storefront
-- to show the average star and the count next to the product name.
-- SECURITY DEFINER so it can read across `pending`/`approved` and only
-- expose the aggregate (we never want to leak the count of `pending`).
create or replace function public.product_rating_summary(p_product_id text)
returns table(avg_rating numeric, total int)
language sql
security definer
set search_path = public
as $$
  select
    round(avg(rating)::numeric, 2) as avg_rating,
    count(*)::int as total
  from public.product_reviews
  where product_id = p_product_id and status = 'approved';
$$;

grant execute on function public.product_rating_summary(text) to anon, authenticated;
