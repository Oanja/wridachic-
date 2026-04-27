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

- **Audit log** — no record of who changed what. Can be added with a Postgres trigger if needed.
- **CSP headers** — recommended at the CDN level (Cloudflare → Rules → Transform Rules → Add `Content-Security-Policy` response header).

---

## How to enable 2FA on the admin account (recommended)

Two-factor auth means even if someone steals your admin password, they still need your phone to log in.

### One-time setup in Supabase

1. **Supabase Dashboard → Authentication → Providers**
2. Scroll to **Multi-Factor Authentication (MFA)** → toggle **Enable TOTP** on
3. Save

### Activate it on your admin account

1. Open the site, go to `#admin`, log in normally with your email + password
2. Open Supabase Dashboard → **Authentication → Users**
3. Find your admin user → click the row → **"Enroll TOTP factor"**
4. Scan the QR code with **Google Authenticator** / **Authy** / **1Password**
5. Enter the 6-digit code to confirm

> ⚠️ **Important:** Once enrolled, the next time you log in to admin, Supabase will require the 6-digit TOTP code. The current login form in this site does NOT yet handle the TOTP step. If you enable 2FA, you'll need to update the admin login UI to accept the code (Supabase JS docs: `_sb.auth.mfa.challengeAndVerify()`). Ask Claude to add this when you're ready.

For now, the practical 2FA workaround: **use a long, unique password manager–generated password** for the admin account. Combined with the strict RLS policies, this is "good enough" for a small store.
