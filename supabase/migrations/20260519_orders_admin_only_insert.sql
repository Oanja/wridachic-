-- Tighten orders RLS now that checkout goes through /api/checkout/place
-- which uses the service-role key. No legitimate browser client should
-- INSERT directly anymore — only the server route, which bypasses RLS
-- entirely via service_role.
--
-- Effect: even if an attacker bypasses the new /api/checkout/place
-- endpoint, they cannot insert ANY row using the anon key (where they
-- previously could insert at least a status='nouveau' shell).
--
-- Apply in Supabase SQL Editor after deploying the server-side
-- checkout endpoint.

drop policy if exists "orders_insert_guest" on public.orders;

-- No INSERT policy at all = only the service role (which bypasses RLS)
-- can insert. The /api/checkout/place route uses the service role, so
-- legitimate checkouts continue to work; anon-key forgery cannot.
