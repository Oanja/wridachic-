import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, watch } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const FILES = ['components2.jsx', 'pages2young.jsx', 'app.jsx'];
const OUT = 'bundle.js';

async function build() {
  const t0 = Date.now();
  const concat = FILES.map(f =>
    `// === ${f} ===\n${readFileSync(join(ROOT, f), 'utf8')}`
  ).join('\n\n');

  const result = await esbuild.transform(concat, {
    loader: 'jsx',
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    minify: true,
    target: ['es2018'],
    legalComments: 'none',
  });

  writeFileSync(join(ROOT, OUT), result.code);
  const sizeKB = (result.code.length / 1024).toFixed(1);
  const ms = Date.now() - t0;
  console.log(`✓ Built ${OUT} (${sizeKB} KB) in ${ms}ms`);
}

await build();

if (process.argv.includes('--watch')) {
  console.log('▶ Watching for changes...');
  let timer = null;
  for (const f of FILES) {
    watch(join(ROOT, f), { persistent: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => build().catch(e => console.error('✗', e.message)), 50);
    });
  }
}
