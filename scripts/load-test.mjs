/**
 * WridaChic — Load test (50 simulated orders)
 *
 * Mirrors the real checkout flow exactly:
 *   1. Get a server-issued order number via `next_order_number()` RPC
 *   2. Insert the order through the anon-key Supabase client (RLS-checked)
 *   3. Call /api/notify-order so the full pipeline runs (Email + Telegram + Sheet)
 *
 * Each row is tagged `marketing_consent=false` and the city is real (Casablanca
 * etc.) so the data looks plausible to humans browsing the admin, but we use a
 * dedicated `[TEST]` prefix on `full_name` and the order_number ladder is
 * sequential so cleanup is trivial (see the cleanup() at the end).
 *
 * Run:   node scripts/load-test.mjs
 * Args:  COUNT=50 GAP_MS=30000 node scripts/load-test.mjs    (override defaults)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// --- Tiny .env.local loader (so we don't need dotenv as a dep) -----------
const here = dirname(fileURLToPath(import.meta.url));
const envFile = join(here, '..', '.env.local');
const envText = readFileSync(envFile, 'utf8');
const env = Object.fromEntries(
  envText.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SB_ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SITE_URL = env.NEXT_PUBLIC_SITE_URL || 'https://wridachic.com';

if (!SB_URL || !SB_ANON) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const COUNT = Number(process.env.COUNT) || 50;
const GAP_MS = Number(process.env.GAP_MS) || 30000; // 30 s default
// 10 of the orders include an email so we exercise Resend without blowing
// past free-tier daily limits. Tests address: yours, so we can verify
// inbox delivery + DKIM.
const EMAIL_TEST_ADDRESS = process.env.EMAIL_TEST_ADDRESS || 'othmaneanjapro@gmail.com';
const EMAILS_TO_SEND = Number(process.env.EMAILS_TO_SEND) || 10;

const sb = createClient(SB_URL, SB_ANON);

// Realistic-looking but obviously fake test data.
const FIRST_NAMES = ['Sara', 'Yasmine', 'Imane', 'Nada', 'Salma', 'Aya', 'Lina', 'Meryem', 'Houda', 'Kenza', 'Rim', 'Inès', 'Hiba', 'Ghita', 'Asma'];
const LAST_NAMES = ['Alaoui', 'Bennani', 'Chraibi', 'El Amrani', 'Tazi', 'Idrissi', 'Berrada', 'Lahlou', 'Sefrioui', 'Skalli'];
const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir', 'Meknès', 'Oujda', 'Tétouan'];
const STREETS = ['Av. Mohammed V', 'Rue Tarik Ibn Ziad', 'Bd Anfa', 'Hay Riad', 'Rue Goulmima', 'Quartier Maarif'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Generate a Moroccan-looking 10-digit mobile starting with 06 / 07.
function fakePhone() {
  const prefix = Math.random() > 0.5 ? '06' : '07';
  const rest = String(Math.floor(10000000 + Math.random() * 89999999));
  return prefix + rest;
}

function fakeOrder(i) {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const city = pick(CITIES);
  const items = [{
    name: 'Robe Mousseline Rosée',
    qty: 1,
    size: pick(['S', 'M', 'L', 'XL']),
    color: 'Rose',
    price: 329,
    cost: 165,
  }];
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const delivery = city === 'Casablanca' ? 35 : 35;
  const total = subtotal + delivery;
  return {
    // [TEST] prefix makes them findable + skippable in the admin.
    full_name: `[TEST] ${first} ${last}`,
    phone: fakePhone(),
    email: i < EMAILS_TO_SEND ? EMAIL_TEST_ADDRESS : '',
    address: `${pick(STREETS)} ${Math.floor(Math.random() * 200) + 1}`,
    city,
    payment: 'cod',
    subtotal,
    delivery,
    total,
    items,
    lang: pick(['fr', 'ar', 'en']),
    marketing_consent: false,
    status: 'nouveau',
  };
}

async function placeOne(i) {
  const t0 = Date.now();
  let order_number;
  try {
    const { data, error } = await sb.rpc('next_order_number');
    if (error) throw error;
    order_number = data;
  } catch (e) {
    return { i, ok: false, stage: 'rpc', reason: String(e.message || e) };
  }

  const payload = { ...fakeOrder(i), order_number };
  let inserted;
  try {
    const { data, error } = await sb.from('orders').insert(payload).select('id').single();
    if (error) throw error;
    inserted = data;
  } catch (e) {
    return { i, order_number, ok: false, stage: 'insert', reason: String(e.message || e) };
  }

  // Fire /api/notify-order — same call the real checkout makes. We DON'T
  // await /api/sync-order separately because notify-order already does
  // the Sheet upsert internally.
  let notifyResult;
  try {
    const res = await fetch(`${SITE_URL}/api/notify-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: order_number,
        fullName: payload.full_name,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        city: payload.city,
        total: payload.total,
        items: payload.items,
        lang: payload.lang,
      }),
    });
    notifyResult = { status: res.status, body: (await res.text()).slice(0, 200) };
  } catch (e) {
    notifyResult = { status: 0, body: String(e.message || e) };
  }

  const ms = Date.now() - t0;
  return {
    i,
    order_number,
    inserted_id: inserted.id,
    notify: notifyResult,
    email_sent: !!payload.email,
    city: payload.city,
    ms,
    ok: notifyResult.status >= 200 && notifyResult.status < 300,
  };
}

async function run() {
  console.log(`\n🚀 WridaChic Load Test`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Target site:  ${SITE_URL}`);
  console.log(`Orders:       ${COUNT}`);
  console.log(`Emails:       ${EMAILS_TO_SEND} → ${EMAIL_TEST_ADDRESS}`);
  console.log(`Gap:          ${GAP_MS / 1000}s between orders`);
  console.log(`Total time:   ~${Math.round((COUNT * GAP_MS) / 60000)} min`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const results = [];
  for (let i = 0; i < COUNT; i++) {
    const r = await placeOne(i);
    results.push(r);
    const icon = r.ok ? '✅' : '❌';
    const emailIcon = r.email_sent ? '📧' : '  ';
    console.log(`${icon} [${i + 1}/${COUNT}] ${r.order_number || 'no-num'} · ${r.city || '—'} · ${r.ms}ms · ${emailIcon} · ${r.ok ? 'OK' : r.stage || 'notify-failed'}`);
    if (!r.ok) console.log(`     reason: ${r.reason || r.notify?.body}`);
    if (i < COUNT - 1) await sleep(GAP_MS);
  }

  // ────────── Summary ──────────
  const ok = results.filter(r => r.ok).length;
  const ko = results.length - ok;
  const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length);
  const emailsSent = results.filter(r => r.ok && r.email_sent).length;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 RÉSULTATS FINAUX`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Succès:       ${ok}/${COUNT}`);
  console.log(`❌ Échecs:       ${ko}/${COUNT}`);
  console.log(`⏱  Temps moyen:  ${avgMs}ms`);
  console.log(`📧 Emails envoyés: ${emailsSent}`);
  console.log(`📱 Telegram:    ${ok} messages (1 par succès)`);
  console.log(`📊 Sheet:       ${ok} rows`);

  if (ko > 0) {
    console.log(`\n⚠️  ÉCHECS:`);
    results.filter(r => !r.ok).forEach(r => {
      console.log(`   [${r.i + 1}] ${r.order_number || 'no-num'}: ${r.stage} — ${r.reason || r.notify?.body}`);
    });
  }

  console.log(`\n💡 Pour nettoyer les commandes de test:`);
  console.log(`   COUNT=${COUNT} node scripts/load-test-cleanup.mjs\n`);
}

run().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
