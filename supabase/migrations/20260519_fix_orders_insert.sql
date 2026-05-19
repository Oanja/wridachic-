-- Patch: the first lockdown migration's INSERT policy used
--   with check (coalesce(status, 'nouveau') = 'nouveau')
-- which somehow rejects legitimate checkout inserts even when the
-- client sends status = 'nouveau'. Replace with an explicit policy
-- that also names the target roles and allows status to be NULL
-- (so the column DEFAULT can fill it in).

drop policy if exists "orders_insert_guest" on public.orders;

create policy "orders_insert_guest"
on public.orders
for insert
to anon, authenticated
with check (status is null or status = 'nouveau');
