// Renders the app icons from the sun-on-horizon mark (DESIGN-TOKENS.md §4)
// into PNGs, so iOS and Android home screens have something to show.
// Run: node scripts/make-icons.mjs

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = 'public';
mkdirSync(out, { recursive: true });

// Same construction as Icon.tsx 'fallow': a line with a gold semicircle on it.
// Maskable-safe: the mark sits inside the middle 60% so Android's circle crop
// never clips it.
const svg = (size, bg, maskable) => {
  const pad = maskable ? size * 0.22 : size * 0.14;
  const inner = size - pad * 2;
  const s = inner / 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bg}" ${maskable ? '' : `rx="${size * 0.22}"`}/>
  <g transform="translate(${pad} ${pad}) scale(${s})" fill="none" stroke="#423A2C" stroke-width="2" stroke-linecap="round">
    <path d="M 5 15 A 7 7 0 0 1 19 15 Z" fill="#C0A557" stroke="none"/>
    <line x1="2.5" y1="15" x2="21.5" y2="15"/>
  </g>
</svg>`;
};

writeFileSync(join(out, 'icon.svg'), svg(512, '#F7F1E3', false));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
  { file: 'favicon-32.png', size: 32, maskable: false },
];

for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.size, height: t.size } });
  await page.setContent(
    `<style>html,body{margin:0;padding:0}</style>${svg(t.size, '#F7F1E3', t.maskable)}`,
  );
  await page.screenshot({ path: join(out, t.file), omitBackground: false });
  await page.close();
}

await browser.close();
console.log('icons written to', out);
