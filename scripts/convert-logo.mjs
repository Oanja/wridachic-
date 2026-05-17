/**
 * Convert the WridaChic SVG logo into a square PNG suitable for use as
 * the WhatsApp template header image.
 *
 * Why: WhatsApp Cloud API media headers accept JPG/PNG only — SVG is
 * rejected with "header: Format mismatch". We need a fallback PNG that
 * the API can always serve when an order item lacks its own product
 * image (test orders, products with missing images, etc.).
 *
 * Output: public/wa-logo.png (1024x1024, transparent BG, served at
 *   https://wridachic.com/wa-logo.png after the next deploy).
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, '..', 'public', 'wa-logo.png');

const SVG_URL = 'https://wridachic.com/assets/wridachicNlogo-2.svg';

console.log(`Fetching SVG: ${SVG_URL}`);
const res = await fetch(SVG_URL);
if (!res.ok) {
  console.error(`Failed to fetch SVG: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const svgBuf = Buffer.from(await res.arrayBuffer());
console.log(`Got ${svgBuf.length} bytes`);

// 1024x1024 — well above WhatsApp's minimum (200x200) and gives a crisp
// preview even on large desktop WhatsApp Web windows. Square (1:1) so
// it works in the IMAGE header slot.
// White background because the WhatsApp message bubble is white on most
// themes; a transparent PNG would show up against the dark mode bubble
// and the logo would be hard to read.
const sized = await sharp(svgBuf, { density: 300 })
  .resize(1024, 1024, { fit: 'contain', background: { r: 250, g: 246, b: 241, alpha: 1 } })
  .flatten({ background: { r: 250, g: 246, b: 241, alpha: 1 } }) // FAF6F1 (paper)
  .png({ quality: 90, compressionLevel: 9 })
  .toBuffer();

writeFileSync(outPath, sized);
console.log(`✅ Wrote ${sized.length} bytes → ${outPath}`);
console.log(`   Will be served at https://wridachic.com/wa-logo.png after deploy.`);
