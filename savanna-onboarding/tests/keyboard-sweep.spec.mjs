// Pitch-day fix 3 (19 Nov): the keyboard-only path from the Savanna home page through sign-up to a saved Support
// Passport. On EVERY screen of the path, Tab goes through the whole page until focus leaves it, then Shift+Tab all the
// way back: every stop has a visible focus indicator, and no element is met twice in one pass (no keyboard trap,
// WCAG 2.1.2). The header menus (Language, Accessibility) open with Enter, are walked with Tab, and close with Escape,
// returning focus to their button. Desktop 1440×900 and the phone size. The task itself is done with keys only.
import { test, expect } from '@playwright/test';
import { freshStart } from './helpers.mjs';

test.use({ serviceWorkers: 'block' });

/** Where focus is, and whether it can be seen (outline at least 2px, or a focus ring drawn with box-shadow). */
const probe = () => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;
  const cs = getComputedStyle(el), r = el.getBoundingClientRect();
  const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2;
  const ring = cs.boxShadow && cs.boxShadow !== 'none';
  if (!el.__kid) el.__kid = 'k' + (window.__kn = (window.__kn || 0) + 1);
  return { id: el.__kid, tag: el.tagName, name: (el.getAttribute('aria-label') || el.textContent || el.value || el.id || '').trim().replace(/\s+/g, ' ').slice(0, 40), visible: outline || ring, size: r.width > 0 && r.height > 0 };
};

/** One full pass in one direction, starting from the top (or bottom) of the page. */
async function pass(page, key) {
  // First move focus out of the page in this direction, so the recorded pass starts at the very top (or bottom)
  for (let i = 0; i < 400 && await page.evaluate(probe); i++) await page.keyboard.press(key);
  const seen = new Map(), stops = [];
  for (let i = 0; i < 400; i++) {
    await page.keyboard.press(key);
    const s = await page.evaluate(probe);
    if (!s) return { stops, trap: null };          // focus left the page: the pass is complete
    if (seen.has(s.id)) return { stops, trap: s };   // came back to an element without leaving the page
    seen.set(s.id, true); stops.push(s);
  }
  return { stops, trap: { name: 'more than 400 stops' } };
}
async function sweep(page, screen, problems) {
  for (const key of ['Tab', 'Shift+Tab']) {
    const { stops, trap } = await pass(page, key);
    if (trap) problems.push(`${screen} (${key}): keyboard trap at ${trap.tag} "${trap.name}"`);
    if (stops.length < 3) problems.push(`${screen} (${key}): only ${stops.length} stops`);
    counts.push(`${screen} ${key}: ${stops.length}`);
    for (const s of stops) if (!s.visible || !s.size) problems.push(`${screen} (${key}): no visible focus on ${s.tag} "${s.name}"`);
  }
  return problems;
}
/** Tab forward to the first element matching the selector. */
async function tabTo(page, selector) {
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(sel => document.activeElement && document.activeElement.matches(sel), selector)) return;
  }
  throw new Error('could not reach ' + selector + ' with Tab');
}
const enter = p => p.keyboard.press('Enter'), space = p => p.keyboard.press('Space');
let counts = [];

for (const size of [{ name: '1440x900', width: 1440, height: 900 }, { name: 'phone', width: 393, height: 851 }]) {
  test(`keyboard only, ${size.name}: home → sign-up → Support Passport saved; full Tab and Shift+Tab sweep on every screen`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'sizes are set in the test');
    test.setTimeout(300000);
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await freshStart(page, { lang: 'en' });
    const problems = [], screens = []; counts = [];
    const check = async name => { screens.push(name); await sweep(page, name, problems); await page.evaluate(() => document.activeElement && document.activeElement.blur()); };
    const q = async () => (await page.locator('.dm-q').first().innerText()).trim();

    await page.goto('/index.html');
    await page.waitForFunction(() => !!window.SavannaOnboarding);
    await check('home: how would you like to use Savanna?');

    // header menus by keyboard (wide screens show Language and Accessibility in the header; phones put them in Menu)
    for (const [btn, panel] of [['.sj-a11y-btn', '#sj-a11y-panel'], ['.sj-lang-btn', '#sj-lang-menu']]) {
      if (!(await page.locator(btn).isVisible())) continue;
      {
        await tabTo(page, btn); await enter(page);
        await expect(page.locator(btn)).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator(panel)).toBeVisible();
        await page.keyboard.press('Tab');
        const inside = await page.evaluate(p => document.querySelector(p).contains(document.activeElement), panel);
        if (!inside) problems.push(`${btn}: Tab after opening does not go into the menu`);
        const s = await page.evaluate(probe);
        if (!s || !s.visible) problems.push(`${btn}: no visible focus inside the menu`);
        await page.keyboard.press('Escape');
        await expect(page.locator(panel)).toBeHidden();
        await expect(page.locator(btn)).toBeFocused(); // focus back on the button
        await page.evaluate(() => document.activeElement.blur());
      }
    }
    if (await page.locator('.sj-more').isVisible()) {
      await tabTo(page, '.sj-more'); await enter(page);
      await expect(page.locator('.sj-more')).toHaveAttribute('aria-expanded', 'true');
      await sweep(page, 'phone menu open', problems);
      await page.locator('.sj-more').focus(); await page.keyboard.press('Escape');
      await expect(page.locator('.sj-more')).toHaveAttribute('aria-expanded', 'false');
      await page.evaluate(() => document.activeElement.blur());
    }

    await tabTo(page, 'input[name=mode]'); await space(page);
    await tabTo(page, '#sj-mode button[type=submit]'); await enter(page);
    await check('home: sign up or log in');
    await tabTo(page, '.sj-split a[href="signup.html"]'); await enter(page);
    await page.waitForSelector('.dm-q');
    await check('sign-up: who is filling in');
    await tabTo(page, 'input[name=v]'); await space(page);
    await tabTo(page, 'button[type=submit]'); await enter(page);
    expect(await q()).toBe('What should we call you?');
    await check('sign-up: name');
    await tabTo(page, '[data-ref=input]'); await page.keyboard.type('Abebe'); await enter(page);
    await check('sign-up: phone');
    await tabTo(page, '[data-ref=input]'); await page.keyboard.type('0911234567'); await enter(page);
    await check('sign-up: date of birth');
    await tabTo(page, 'button[type=submit]'); await enter(page);
    await check('sign-up: consent');
    await tabTo(page, 'input[name=v]'); await space(page);
    await tabTo(page, 'button[type=submit]'); await enter(page);
    expect(await q()).toBe('Check your answers');
    await check('sign-up: check your answers');
    await tabTo(page, 'button[type=submit]'); await enter(page);
    expect(await q()).toContain('Your account is ready');
    await check('sign-up: account ready');
    await tabTo(page, '.dm-done-slot a[href="passport.html"]'); await enter(page);
    await page.waitForSelector('.dm-q');
    await check('passport: would you like');
    await tabTo(page, 'input[name=v]'); await space(page);
    await tabTo(page, 'button[type=submit]'); await enter(page);
    await check('passport: what would help');
    await tabTo(page, 'input[name=v]'); await space(page);
    await tabTo(page, 'button[type=submit]'); await enter(page);
    await check('passport: anything else');
    await tabTo(page, 'button[type=submit]'); await enter(page);
    await check('passport: who can see this');
    await tabTo(page, 'button[type=submit]'); await enter(page);
    await check('passport: check your answers');
    await tabTo(page, 'button[type=submit]'); await enter(page);
    expect(await q()).toContain('Your Support Passport is saved');
    await check('passport: saved');

    console.log(`[keyboard sweep ${size.name}] ${screens.length} screens, each swept with Tab and Shift+Tab:\n  ` + counts.join('\n  '));
    await info.attach(`keyboard-sweep-${size.name}.json`, { body: JSON.stringify({ screens, counts, problems }, null, 2), contentType: 'application/json' });
    expect(problems).toEqual([]);
    expect((await page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.passport')))).needs.length).toBe(1);
  });
}
