/**
 * Remove all [TEST] orders from the Google Sheet by calling the Apps
 * Script `delete` action for each order_number we still find in
 * Supabase (or used to). Pairs with load-test-cleanup.mjs which clears
 * the DB; this clears the spreadsheet view.
 *
 * Run AFTER load-test-cleanup.mjs (which records which numbers existed).
 *
 * Strategy: we don't know the exact set after DB deletion, so we hit the
 * Apps Script with a wide range of WC-100xxx numbers. The delete action
 * is no-op for non-existent rows so the request is safe to over-fetch.
 *
 * Usage: FROM=100007 TO=100059 node scripts/load-test-cleanup-sheet.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(join(here, '..', '.env.local'), 'utf8');
const env = Object.fromEntries(
  envText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);

const URL_ = env.GOOGLE_SHEETS_WEBHOOK_URL;
const SECRET = env.GOOGLE_SHEETS_WEBHOOK_SECRET;

if (!URL_ || !SECRET) {
  console.error('❌ Missing GOOGLE_SHEETS_WEBHOOK_URL or GOOGLE_SHEETS_WEBHOOK_SECRET in .env.local');
  console.error('   (these env vars live in Vercel — copy them locally to use this cleanup script)');
  process.exit(1);
}

const FROM = Number(process.env.FROM) || 100007;
const TO = Number(process.env.TO) || 100059;

console.log(`Deleting WC-${FROM} → WC-${TO} from sheet (${TO - FROM + 1} numbers)...`);

let deleted = 0;
let notFound = 0;

for (let n = FROM; n <= TO; n++) {
  const num = 'WC-' + String(n).padStart(6, '0');
  try {
    const res = await fetch(URL_, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify({ secret: SECRET, action: 'delete', orderNumber: num }),
    });
    const text = await res.text();
    const json = JSON.parse(text);
    if (json.reason === 'deleted') {
      deleted++;
      console.log(`  ✅ ${num}`);
    } else {
      notFound++;
    }
  } catch (e) {
    console.log(`  ❌ ${num}: ${e.message}`);
  }
  // Tiny pause so Apps Script doesn't hit the per-second quota.
  await new Promise(r => setTimeout(r, 150));
}

console.log(`\n✅ Deleted ${deleted}, not-found ${notFound}, total ${deleted + notFound}`);
