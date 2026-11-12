// Audit of the frozen Savanna reference pages (read only — nothing is changed).
// Records which fonts actually load, where they come from, and the colours learners see,
// so Phase 1 design tokens come from evidence rather than memory.
// Output: tests/baseline/reference-audit.json
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'baseline');
const PAGES = ['homepage-v1-paced', 'homepage-v1-self-paced', 'concept-with-navigation'];
const results = {};

test.describe.configure({ mode: 'serial' });
// The reference clone lives next to this repo (see tests/static-server.mjs). Skip if it is not there.
const REFERENCE = resolve(process.env.REFERENCE_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'Savanna-static-pages'));
test.beforeEach(() => {
  test.skip(test.info().project.name !== 'desktop', 'run once, on desktop');
  test.skip(!existsSync(join(REFERENCE, 'pages')), 'Savanna reference clone not found at ' + REFERENCE);
});

for (const name of PAGES) {
  test(`reference page: ${name}`, async ({ page }) => {
    const fontRequests = [];
    page.on('requestfinished', async req => {
      if (req.resourceType() !== 'font') return;
      const res = await req.response();
      fontRequests.push({ url: req.url().split('?')[0], status: res?.status() });
    });
    page.on('requestfailed', req => {
      if (req.resourceType() === 'font') fontRequests.push({ url: req.url().split('?')[0], failed: req.failure()?.errorText });
    });
    await page.goto(`/reference/pages/${name}.html`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);

    const data = await page.evaluate(() => {
      const faces = [...document.fonts].map(f => ({ family: f.family.replace(/"/g, ''), weight: f.weight, status: f.status }));
      const loaded = {};
      faces.filter(f => f.status === 'loaded').forEach(f => { (loaded[f.family] ||= new Set()).add(f.weight); });
      const used = {}, colours = {}, backgrounds = {}, sizes = {}, radii = {};
      const bump = (o, k, n = 1) => { if (k) o[k] = (o[k] || 0) + n; };
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden') continue;
        const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (hasText) {
          bump(used, cs.fontFamily.split(',')[0].replace(/["']/g, '').trim() + ' ' + cs.fontWeight);
          bump(colours, cs.color);
          bump(sizes, cs.fontSize);
        }
        if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') bump(backgrounds, cs.backgroundColor, Math.round(r.width * r.height / 1000));
        if (cs.borderTopLeftRadius !== '0px') bump(radii, cs.borderTopLeftRadius);
      }
      const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
      const pick = sel => { const el = document.querySelector(sel); if (!el) return null; const cs = getComputedStyle(el); return { sel, font: cs.fontFamily, size: cs.fontSize, weight: cs.fontWeight, color: cs.color, bg: cs.backgroundColor, radius: cs.borderRadius, padding: cs.padding, height: cs.height }; };
      return {
        bodyFont: getComputedStyle(document.body).fontFamily,
        bodyColor: getComputedStyle(document.body).color,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        fontsLoaded: Object.fromEntries(Object.entries(loaded).map(([k, v]) => [k, [...v]])),
        aktivGroteskAvailable: document.fonts.check('16px aktiv-grotesk'),
        textFontsUsed: top(used, 12),
        textColours: top(colours, 12),
        backgroundsByArea: top(backgrounds, 12),
        fontSizes: top(sizes, 12),
        radii: top(radii, 10),
        samples: ['h1', 'h2', 'h3', '.btn-primary', '.btn', 'a', '#sidebar', 'header, .navbar', '.card', 'input, select'].map(pick).filter(Boolean)
      };
    });
    results[name] = { ...data, fontRequests };
    expect(data.bodyFont).toBeTruthy();
  });
}

test.afterAll(() => {
  if (!Object.keys(results).length) return;
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'reference-audit.json'), JSON.stringify({ generated: new Date().toISOString(), note: 'Measured from the frozen Savanna reference pages served on http://localhost (not an ALX domain).', results }, null, 2));
});
