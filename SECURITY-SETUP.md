# Security Setup — Wridachic

This site now uses **real Supabase Auth** for the admin panel and **strict RLS** policies. Customer data, products, and orders are no longer exposed to the public.

You need to do **3 one-time steps** below. After that, security is fully active.

---

## Step 1 — Create the admin account in Supabase

1. Open **https://supabase.com/dashboard** → your project
2. Go to **Authentication → Users → Add user → Create new user**
3. Fill in:
   - **Email**: pick a real email you control (e.g. `othmane.anjada@gmail.com`)
   - **Password**: pick a strong password (16+ chars, mix letters/numbers/symbols)
   - ✅ check **"Auto Confirm User"**
4. Click **Create user**

> ⚠️ The password you set here is the new admin password. The old `wridachic2026` no longer works.

---

## Step 2 — Enable RLS with your admin email

1. Open `supabase-secure-rls.sql` in this project
2. Find the line:
   ```sql
   'admin@wridachic.com'
   ```
3. **Replace it** with the email you used in Step 1
4. In Supabase: **SQL Editor → New query → paste the whole file → Run**

You should see "Success. No rows returned." If you get an error, copy it and let me know.

---

## Step 3 — Test the new admin login

1. Visit `https://wridachic.com/#admin`
2. Enter the email + password from Step 1
3. You should land on the dashboard with the orders list
4. Try the **Supprimer** button on a test order — it should now actually delete

If login says "Ce compte n'a pas les permissions admin" → the email in the SQL doesn't match your account email. Re-check Step 2.

---

## What changed (technical)

### Before
- Hardcoded password `wridachic2026` in `bundle.js` — readable by anyone
- Anyone could open browser DevTools and read every customer's name, phone, email, address with one line of JS
- DELETE on orders was silently blocked (a different bug, but the lack of policy hid it)

### After
- Admin login = real Supabase Auth (email + password). Password is stored hashed by Supabase, never in client code.
- `is_admin()` SQL function checks current auth user against your admin-email allowlist.
- RLS policies on every table:
  - `orders` — read own only (or admin), write/delete admin only
  - `products` — read public, write admin only
  - `profiles` — read own only (or admin)
  - `wishlists` — own only
- Trying `_sb.from('orders').select('*')` from a logged-out browser console now returns `[]`. From a customer account, it returns only their own orders.

---

## Adding more admins later

Edit `supabase-secure-rls.sql`:
```sql
and email in (
  'first.admin@example.com',
  'second.admin@example.com'
)
```
Then re-run only the `is_admin()` block in SQL Editor (top section of the file).

---

## What is NOT done (out of scope for now)

- **Rate limiting on order creation** — anyone can still spam fake orders via the public INSERT policy. This is operational, not a privacy leak. If spam becomes a problem, add a CAPTCHA or move checkout to a Supabase Edge Function.
- **2FA on admin account** — Supabase supports it via TOTP. Recommended once you're set up: Authentication → Providers → Multi-Factor.
- **Audit log** — no record of who changed what. Can be added with a Postgres trigger if needed.
