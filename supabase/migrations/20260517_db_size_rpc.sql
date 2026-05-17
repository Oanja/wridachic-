-- ────────────────────────────────────────────────────────────────────────────
-- Live database size reporting
--
-- Supabase doesn't expose a REST endpoint for the current DB size, but
-- Postgres has the built-in pg_database_size() — we just need a SECURITY
-- DEFINER function so the service-role connection can call it without
-- requiring direct catalog privileges.
--
-- The Admin Système panel calls this via supabase-js .rpc('get_db_size')
-- to replace the previous "rows × 5KB" estimate with the real number
-- that matches what Settings → Usage shows in the Supabase dashboard.
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.get_db_size()
returns bigint
language sql
security definer
set search_path = public
as $$
  select pg_database_size(current_database())::bigint;
$$;

-- Only the service role (used by /api/usage-stats on the server) is
-- allowed to call this — anon/authenticated users have no business
-- reading the DB size of the whole project.
revoke execute on function public.get_db_size() from public, anon, authenticated;
grant execute on function public.get_db_size() to service_role;
