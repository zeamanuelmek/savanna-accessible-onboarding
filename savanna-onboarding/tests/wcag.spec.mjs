// Phase 9: automated evidence for WCAG 2.2 criteria that axe-core does not cover (see docs/conformance-report.md).
// Each test names the success criterion. A pass here is evidence, not a conformance claim: people still check.
import { test, expect } from '@playwright/test';
import { freshStart, go, pick, next, signupTo } from './helpers.mjs';

const at = (page, path) => page.goto(path).then(() => page.waitForFunction(() => !!window.SavannaOnboarding));
const overflow = page => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const learner = page => page.evaluate(() => {
  localStorage.setItem('savanna-onboarding.profile', JSON.stringify({ name: 'Abebe', phone: '0911234567', id_route: 'kebele', assurance_level: 'self_declared' }));
  localStorage.setItem('savanna-demo.session', '{"at":"x"}');
});

test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); });

/** Sign-up from the start each time (no saved draft, no reused screen). */
async function fromStart(page, step) {
  await go(page, '#/');
  await page.evaluate(() => localStorage.removeItem('savanna-onboarding.draft.signup'));
  await signupTo(page, step);
}

test('1.4.12 Text Spacing: no content is cut off or scrolls sideways with WCAG text spacing applied', async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }';
      document.head.appendChild(s);
    });
  });
  for (const step of ['filler', 'phone', 'dob', 'END']) {
    await fromStart(page, step);
    expect(await overflow(page), `sideways scrolling at ${step}`).toBeLessThanOrEqual(0);
    // nothing clipped: no element hides its own text overflow
    const clipped = await page.evaluate(() => [...document.querySelectorAll('.dm *')].filter(e => {
      const c = getComputedStyle(e);
      return (c.overflow === 'hidden' || c.overflowX === 'hidden') && e.scrollWidth > e.clientWidth + 1 && !e.classList.contains('dm-vh') && e.textContent.trim();
    }).map(e => e.className));
    expect(clipped, `clipped text at ${step}`).toEqual([]);
  }
});

test('1.3.4 Orientation: the Savanna pages and the form work in landscape', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'phone only');
  await page.setViewportSize({ width: 727, height: 393 });
  for (const p of ['/index.html', '/signup.html', '/jobs.html']) {
    await at(page, p);
    expect(await overflow(page), p).toBeLessThanOrEqual(0);
    await expect(page.locator('h1').first()).toBeVisible();
  }
});

test('2.5.8 Target Size (Minimum): every control is at least 24 × 24 px (our own target: 44 px high)', async ({ page }) => {
  const small = [];
  async function check(name) {
    const found = await page.evaluate(() => [...document.querySelectorAll('button, a[href], input, select, textarea, summary')]
      .filter(e => e.getClientRects().length && !e.closest('.dm-vh, .sj-skip') && !(e.tagName === 'A' && e.closest('p, li') && !e.classList.contains('btn')))
      .map(e => { const r = e.getBoundingClientRect(), box = e.closest('label') ? e.closest('label').getBoundingClientRect() : r; return [e.tagName + ' ' + (e.textContent || e.value || e.name || '').trim().slice(0, 25), Math.round(Math.max(r.width, box.width)), Math.round(Math.max(r.height, box.height))]; })
      .filter(([, w, h]) => w < 24 || h < 24));
    found.forEach(f => small.push(name + ': ' + f.join(' ')));
  }
  await at(page, '/index.html'); await check('home');
  await fromStart(page, 'filler'); await check('choice');
  await fromStart(page, 'dob'); await check('date');
  await fromStart(page, 'END'); await check('check answers');
  await go(page, '#/settings'); await check('settings');
  await at(page, '/index.html'); await learner(page); await at(page, '/jobs.html'); await check('jobs');
  expect(small).toEqual([]); // inline text links in sentences are exempt (WCAG 2.5.8 "inline" exception)
});

test('2.4.2 Page Titled: every Savanna page has its own descriptive title', async ({ page }) => {
  await at(page, '/index.html'); await learner(page);
  const titles = {};
  for (const p of ['/index.html', '/signup.html', '/login.html', '/dashboard.html', '/profile.html', '/passport.html', '/jobs.html', '/employer.html', '/settings.html']) {
    await at(page, p);
    titles[p] = await page.title();
  }
  for (const [p, t] of Object.entries(titles)) expect(t, p).toMatch(/\S+ \| Savanna$/);
  expect(new Set(Object.values(titles)).size).toBe(Object.keys(titles).length); // all different
});

test('3.2.3 Consistent Navigation: the same menu, in the same order, on every page', async ({ page }) => {
  await at(page, '/index.html'); await learner(page);
  const menus = [];
  for (const p of ['/dashboard.html', '/profile.html', '/passport.html', '/jobs.html', '/employer.html', '/settings.html']) {
    await at(page, p);
    menus.push((await page.locator('#sidebar a').evaluateAll(as => as.map(a => a.getAttribute('href')))).join(' '));
  }
  expect(new Set(menus).size).toBe(1);
});

test('3.2.6 Consistent Help: "Get help" is in the same place on every question', async ({ page }) => {
  const spots = new Set();
  for (const step of ['filler', 'name', 'phone', 'dob', 'consent']) {
    await fromStart(page, step);
    const b = await page.locator('.dm-bar [data-act=help]').boundingBox();
    const bar = await page.locator('.dm-bar').boundingBox();
    spots.add(`${Math.round(b.x - bar.x)},${Math.round(b.y - bar.y)}`);
    await expect(page.locator('.dm-bar [data-act=help]')).toBeVisible();
  }
  expect([...spots]).toHaveLength(1);
});

test('1.3.5 Identify Input Purpose: name and phone fields say what they are for', async ({ page }) => {
  await signupTo(page, 'name');
  await expect(page.locator('[data-ref=input]')).toHaveAttribute('autocomplete', 'nickname');
  await page.fill('[data-ref=input]', 'Abebe'); await next(page);
  await expect(page.locator('[data-ref=input]')).toHaveAttribute('autocomplete', 'tel');
  await expect(page.locator('[data-ref=input]')).toHaveAttribute('type', 'tel');
  await at(page, '/login.html');
  await expect(page.locator('#sj-phone')).toHaveAttribute('autocomplete', 'tel');
});

test('2.2.1 Timing Adjustable: nothing times out (an answer typed after a long pause is still accepted)', async ({ page }) => {
  await page.clock.install();
  await signupTo(page, 'name');
  await page.clock.runFor(3 * 60 * 60 * 1000); // three hours
  await page.fill('[data-ref=input]', 'Abebe'); await next(page);
  await expect(page.locator('.dm-q')).toContainText('phone number');
});
