// Design system checks (Phase 1): colour contrast of the tokens, focus outline, the module's own base text size,
// and fonts (Poppins + Noto Sans Ethiopic). Token values and sources are in DESIGN_TOKENS.md.
import { test, expect } from '@playwright/test';
import { freshStart, go, signupTo } from './helpers.mjs';

function parse(c) {
  c = c.trim();
  if (c.startsWith('#')) {
    let h = c.slice(1); if (h.length === 3) h = [...h].map(x => x + x).join('');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  }
  const m = c.match(/rgba?\(([^)]+)\)/); if (!m) throw new Error('colour? ' + c);
  return m[1].split(/[ ,]+/).slice(0, 3).map(Number);
}
function lum(c) { return parse(c).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0); }
export function contrast(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }

// [foreground token, background token, minimum ratio, what it is used for]
const PAIRS = [
  ['--so-text', '--so-surface', 4.5, 'body text'],
  ['--so-heading', '--so-surface-alt', 4.5, 'text on light panels'],
  ['--so-text-muted', '--so-surface', 4.5, 'hints and secondary text'],
  ['--so-text-muted', '--so-surface-alt', 4.5, 'secondary text on light panels'],
  ['--so-on-primary', '--so-primary', 4.5, 'primary button text'],
  ['--so-on-primary', '--so-primary-hover', 4.5, 'primary button text, hover'],
  ['--so-primary', '--so-surface', 4.5, 'red used as text on white'],
  ['--so-error', '--so-surface', 4.5, 'error text'],
  ['--so-heading', '--so-selected-bg', 4.5, 'selected option text'],
  ['--so-heading', '--so-success-bg', 4.5, 'text on success panel'],
  ['--so-heading', '--so-surface-info', 4.5, 'text on voice "I heard" panel'],
  ['--so-accent', '--so-surface', 4.5, 'accent text (eyebrow)'],
  ['--so-accent', '--so-surface-alt', 4.5, 'accent text on light panel'],
  ['--so-border', '--so-surface', 3, 'form control edges (1.4.11)'],
  ['--so-selected-border', '--so-surface', 3, 'selected option edge'],
  ['--so-info-accent', '--so-surface', 3, 'voice panel edge'],
  ['--so-focus', '--so-surface', 3, 'focus outline on white (2.4.7 / 1.4.11)'],
  ['--so-focus', '--so-surface-alt', 3, 'focus outline on light panels'],
  ['--so-primary', '--so-surface-alt', 3, 'primary button edge on light panel']
];

for (const contrastMode of ['normal', 'high']) {
  test(`token contrast (${contrastMode} contrast mode)`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'colour maths does not depend on the device');
    await freshStart(page, { lang: 'en', prefs: { contrast: contrastMode } });
    await go(page, '#/');
    const names = [...new Set(PAIRS.flatMap(p => [p[0], p[1]]))];
    const v = await page.evaluate(ns => {
      const probe = document.createElement('div'); document.body.appendChild(probe);
      const out = {};
      for (const n of ns) { probe.style.color = `var(${n})`; out[n] = getComputedStyle(probe).color; }
      probe.remove(); return out;
    }, names);
    const failures = [];
    for (const [fg, bg, min, use] of PAIRS) {
      const r = contrast(v[fg], v[bg]);
      if (r < min) failures.push(`${use}: ${fg} ${v[fg]} on ${bg} ${v[bg]} = ${r.toFixed(2)} (needs ${min})`);
    }
    expect(failures).toEqual([]);
  });
}

test('green is never used for text', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  for (const hash of ['#/', '#/jobs', '#/settings']) {
    await go(page, hash);
    const green = await page.evaluate(() => [...document.querySelectorAll('body *')]
      .filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
      .filter(el => getComputedStyle(el).color === 'rgb(5, 242, 131)').map(el => el.tagName));
    expect(green).toEqual([]);
  }
  await signupTo(page, 'END');
  await page.locator('.dm-form button[type=submit]').click();
  await expect(page.locator('.dm-success')).toBeVisible();
  expect(await page.locator('.dm-success .dm-q').evaluate(el => getComputedStyle(el).color)).toBe('rgb(0, 43, 86)');
});

test('primary button uses the darkened Savanna red with white text', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await signupTo(page, 'filler');
  const s = await page.locator('.dm-form button[type=submit]').evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, fg: getComputedStyle(el).color }));
  expect(s).toEqual({ bg: 'rgb(218, 58, 58)', fg: 'rgb(255, 255, 255)' });
  expect(contrast(s.fg, s.bg)).toBeGreaterThanOrEqual(4.5);
});

test('keyboard focus outline is visible and meets 3:1 on every kind of control', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await signupTo(page, 'filler');
  const checks = [];
  await page.locator('#skip').focus(); // start at the top of the page: header, menu, then every form control
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null; // Tab went past the last control into the browser itself
      const cs = getComputedStyle(el);
      let bgEl = el.parentElement, bg = 'rgba(0, 0, 0, 0)';
      while (bgEl && (bg = getComputedStyle(bgEl).backgroundColor) === 'rgba(0, 0, 0, 0)') bgEl = bgEl.parentElement;
      return { tag: el.tagName, text: (el.textContent || el.value || '').trim().slice(0, 20), style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), color: cs.outlineColor, bg: bg === 'rgba(0, 0, 0, 0)' ? 'rgb(255, 255, 255)' : bg };
    });
    if (!stop) break;
    checks.push(stop);
  }
  expect(checks.length).toBeGreaterThan(5);
  for (const c of checks) {
    expect(c.style, `${c.tag} "${c.text}" outline`).not.toBe('none');
    expect(c.width, `${c.tag} "${c.text}" outline width`).toBeGreaterThanOrEqual(2);
    expect(contrast(c.color, c.bg), `${c.tag} "${c.text}" outline contrast`).toBeGreaterThanOrEqual(3);
  }
});

test('module keeps its own base text size inside a 14px host page and follows the learner text-size setting', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await signupTo(page, 'filler');
  const size = () => page.locator('savanna-onboarding-form').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(await size()).toBe(16);
  await page.evaluate(() => { document.documentElement.style.fontSize = '14px'; }); // like Savanna (application_alx.css:103)
  expect(await size()).toBe(16);
  await page.evaluate(() => window.SavannaOnboarding.setPrefs({ size: 'large' }));
  expect(await size()).toBe(20);
  await page.evaluate(() => window.SavannaOnboarding.setPrefs({ size: 'xlarge' }));
  expect(await size()).toBe(24);
  await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; window.SavannaOnboarding.setPrefs({ size: 'normal' }); }); // larger browser default is respected
  expect(await size()).toBe(20);
});

test('fonts: Poppins for Latin text and Noto Sans Ethiopic for Amharic load from the module folder', async ({ page }) => {
  const fontResponses = [];
  page.on('response', r => { if (r.request().resourceType() === 'font') fontResponses.push([r.url().replace(/^.*\/assets\/fonts\//, ''), r.status()]); });
  await freshStart(page, { lang: 'am' });
  await signupTo(page, 'filler');
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')));
  expect(loaded).toContain('Poppins');
  expect(loaded).toContain('Noto Sans Ethiopic');
  expect(await page.locator('.dm-q').evaluate(el => getComputedStyle(el).fontFamily)).toMatch(/^"?Poppins"?, "?Noto Sans Ethiopic/);
  expect(fontResponses.length).toBeGreaterThan(0);
  for (const [, status] of fontResponses) expect(status).toBe(200);
  expect(fontResponses.map(f => f[0])).toContain('noto-sans-ethiopic-ethiopic.woff2');
});
