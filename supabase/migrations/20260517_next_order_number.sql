-- ────────────────────────────────────────────────────────────────────────────
-- Server-side order number generator
--
-- Before: the browser generated `WC-${Math.random()}` — predictable (9-digit
-- space, ~1-in-900k collision risk) and entirely client-controlled.
-- After: clients call `sb.rpc('next_order_number')` which returns a unique,
-- sequential, server-issued number that nobody can fabricate or duplicate.
--
-- Format: WC-100001, WC-100002, ... (zero-padded to 6 digits, starts at 100000).
-- ────────────────────────────────────────────────────────────────────────────

-- 1) Sequence that drives the counter. CYCLE off → never wraps. CACHE 1 →
--    every call hits the table, so concurrent checkouts never collide.
create sequence if not exists public.order_number_seq
  start with 100001
  increment by 1
  no cycle
  cache 1;

-- 2) RPC the browser is allowed to call. SECURITY DEFINER so anonymous
--    customers can advance the sequence; the function is the ONLY thing
--    they're allowed to do with it (sequence itself is not exposed).
create or replace function public.next_order_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n bigint;
begin
  n := nextval('public.order_number_seq');
  return 'WC-' || lpad(n::text, 6, '0');
end;
$$;

-- 3) Grants: anyone (anon + authenticated) can call the function; nobody
--    can touch the underlying sequence directly.
grant execute on function public.next_order_number() to anon, authenticated;
revoke all on sequence public.order_number_seq from public, anon, authenticated;

-- 4) (Optional but recommended) prevent duplicate order_numbers at the table
--    level too — belt-and-suspenders against any legacy code paths.
create unique index if not exists orders_order_number_uniq
  on public.orders (order_number);
