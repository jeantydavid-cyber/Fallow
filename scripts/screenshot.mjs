// Milestone screenshot pass — HANDOFF.md §5. Screenshots every key screen
// (both themes, 390 + 1280, plus greyscale) against the fixtures.
// Usage: node scripts/screenshot.mjs [baseUrl] [outDir]

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:4173';
const out = process.argv[3] ?? 'screenshots';
mkdirSync(out, { recursive: true });

const SHOTS = [
  { name: 'home-drought', url: `/?fixture=drought#/` },
  { name: 'home-sparse', url: `/?fixture=sparse#/` },
  { name: 'home-busy', url: `/?fixture=busy-but-fine#/` },
  { name: 'home-empty', url: `/?fixture=empty#/` },
  { name: 'home-first-run', url: `/?fixture=first-run#/` },
  { name: 'checkin-step1', url: `/?fixture=busy-but-fine#/checkin/CURRENT` },
  { name: 'lever', url: `/?fixture=drought#/lever` },
  { name: 'low-capacity', url: `/?fixture=drought#/low` },
  { name: 'week-detail', url: `/?fixture=drought#/week/WEEK4` },
  { name: 'weights', url: `/?fixture=drought#/weights` },
  { name: 'onboarding', url: `/#/onboarding` },
  { name: 'settings', url: `/?fixture=drought#/settings` },
  { name: 'summary', url: `/?fixture=drought#/summary` },
  { name: 'styleguide', url: `/?fixture=empty#/styleguide` },
];

function isoWeekId(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
function addWeeksId(id, n) {
  const [y, w] = id.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (w - 1) * 7 + n * 7 + 3);
  return isoWeekId(new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()));
}

const current = addWeeksId(isoWeekId(new Date()), -1);
const week4 = addWeeksId(current, -3);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const theme of ['light', 'dark']) {
  for (const width of [390, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    for (const shot of SHOTS) {
      const page = await ctx.newPage();
      const url = base + shot.url.replace('CURRENT', current).replace('WEEK4', week4);
      await page.goto(url, { waitUntil: 'networkidle' });
      if (theme === 'dark') {
        await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
      }
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${out}/${shot.name}-${theme}-${width}.png`, fullPage: true });
      if (theme === 'light' && width === 390 && ['home-drought', 'styleguide'].includes(shot.name)) {
        await page.evaluate(() => { document.body.style.filter = 'grayscale(1)'; });
        await page.screenshot({ path: `${out}/${shot.name}-grayscale-${width}.png`, fullPage: true });
      }
      await page.close();
    }
    await ctx.close();
  }
}

await browser.close();
console.log('screenshots written to', out);
