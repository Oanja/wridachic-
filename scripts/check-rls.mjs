// Final RLS verification suite.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) { console.log('Missing env'); process.exit(1); }

const pub = createClient(url, anon, { auth: { persistSession: false } });

const base = {
  full_name: '[RLS-TEST]', phone: '0600000000', email: 'rls@test.com',
  address: 'a', city: 'Casablanca', total: 1, subtotal: 1, delivery: 0,
  items: [{ id: 'x', name: 'x', qty: 1, price: 1, size: 'M', color: '#000' }],
};

console.log('Running RLS security suite with anon key…\n');

// 1) Legitimate checkout — must SUCCEED
const ok = await pub.from('orders').insert({ ...base, order_number: `RLS-OK-${Date.now()}`, status: 'nouveau' });
console.log(ok.error
  ? `✗ Checkout (status=nouveau):    BROKEN — ${ok.error.message}`
  : `✓ Checkout (status=nouveau):    WORKS`);

// 2) Forge "livré" — must FAIL
const forge = await pub.from('orders').insert({ ...base, order_number: `RLS-FAKE-${Date.now()}`, status: 'livré' });
console.log(forge.error
  ? `✓ Forge "livré" order:          BLOCKED`
  : `✗ Forge "livré" order:          ALLOWED — attacker can fake delivered orders`);

// 3) Read PII — must return empty
const r = await pub.from('orders').select('full_name,phone,email').limit(5);
console.log(!r.error && r.data?.length === 0
  ? `✓ Read PII (full_name/phone):   BLOCKED (empty result)`
  : `✗ Read PII:                     LEAKED — ${r.data?.length} rows visible`);

// 4) Wishlist spoof — must FAIL
const w = await pub.from('wishlists').insert({ user_id: '00000000-0000-0000-0000-000000000000', product_ids: ['x'] });
console.log(w.error ? `✓ Spoof wishlist:                BLOCKED` : `✗ Spoof wishlist:                ALLOWED`);

// 5) Pending reviews — must return empty
const rev = await pub.from('product_reviews').select('*').eq('status', 'pending').limit(5);
console.log(!rev.error && (rev.data?.length ?? 0) === 0
  ? `✓ Read unmoderated reviews:     BLOCKED`
  : `✗ Read unmoderated reviews:     LEAKED — ${rev.data?.length} rows`);

// 6) Approved reviews — must SUCCEED (public-facing)
const approved = await pub.from('product_reviews').select('id').eq('status', 'approved').limit(1);
console.log(!approved.error
  ? `✓ Read approved reviews:        WORKS (public proof on product page)`
  : `✗ Read approved reviews:        BROKEN — ${approved.error.message}`);

console.log('\n— suite complete —');
