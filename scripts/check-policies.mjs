// Check what RLS policies actually exist on orders/wishlists/reviews
// and whether is_admin() function exists.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const srv = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !srv) { console.log('Missing env'); process.exit(1); }

const sb = createClient(url, srv, { auth: { persistSession: false } });

// Check policies
const { data: pols, error } = await sb
  .from('pg_policies')
  .select('schemaname,tablename,policyname,cmd,qual,with_check')
  .in('tablename', ['orders', 'wishlists', 'product_reviews']);

if (error) {
  // pg_policies not exposed via REST. Try a custom RPC instead.
  console.log('Cannot read pg_policies via REST:', error.message);
  console.log('Will try RPC fallback...\n');
}

// Check via raw SQL using the SQL exec endpoint (we'll need a helper)
// Try if is_admin() exists by calling it
const { data: isAdminTest, error: e1 } = await sb.rpc('is_admin');
console.log('is_admin() function:', e1 ? 'NOT FOUND - ' + e1.message : 'EXISTS, returned: ' + JSON.stringify(isAdminTest));

// Try to list policies through a different angle
const { data: tables, error: e2 } = await sb.from('orders').select('order_number').limit(0);
console.log('orders table accessible via service role:', e2 ? 'NO - ' + e2.message : 'YES');
