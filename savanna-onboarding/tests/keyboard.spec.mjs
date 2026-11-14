// Keyboard-only routine (CLAUDE.md section 8, step 1): the whole sign-up can be completed with Tab, Space and Enter.
// At every Tab stop the focused element must show a focus outline and be fully on screen (WCAG 2.4.7, 2.4.11).
import { test, expect } from '@playwright/test';
import { freshStart, go, heading } from './helpers.mjs';

const stops = [];

/** Press Tab until the focused element matches the selector. Records every stop on the way. */
async function tabTo(page, selector, max = 30) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(sel => {
      const el = document.activeElement, cs = getComputedStyle(el), r = el.getBoundingClientRect();
      return {
        match: el.matches(sel), tag: el.tagName, name: (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().slice(0, 30),
        outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2,
        onScreen: r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth
      };
    }, selector);
    stops.push(s);
    if (s.match) return;
  }
  throw new Error(`could not reach ${selector} with Tab`);
}

test('complete sign-up with the keyboard only', async ({ page }) => {
  stops.length = 0;
  await freshStart(page, { lang: 'en' });
  await go(page, '#/signup');
  // welcome: choose "Read and type"
  await tabTo(page, 'input[name=mode]'); await page.keyboard.press('Space');
  await tabTo(page, 'button[type=submit]'); await page.keyboard.press('Enter');
  expect(await heading(page)).toBe('Who is filling in this form?');
  await tabTo(page, 'input[name=v]'); await page.keyboard.press('Space'); // "Me, for myself"
  await tabTo(page, 'button[type=submit]'); await page.keyboard.press('Enter');
  await tabTo(page, '[data-ref=input]'); await page.keyboard.type('Abebe Kebede'); await page.keyboard.press('Enter');
  await tabTo(page, '[data-ref=input]'); await page.keyboard.type('0911234567'); await page.keyboard.press('Enter');
  await tabTo(page, 'input[name=v]'); await page.keyboard.press('Space'); // Fayda
  await tabTo(page, 'button[type=submit]'); await page.keyboard.press('Enter');
  await tabTo(page, '[data-ref=input]'); await page.keyboard.press('Enter'); // ID number is optional
  await tabTo(page, 'button[type=submit]'); await page.keyboard.press('Enter'); // date is optional
  await tabTo(page, 'input[name=v]'); await page.keyboard.press('Space'); // consent: yes
  await tabTo(page, 'button[type=submit]'); await page.keyboard.press('Enter');
  expect(await heading(page)).toBe('Check your answers');
  await tabTo(page, 'button[type=submit]'); await page.keyboard.press('Enter');
  expect(await heading(page)).toContain('Welcome');

  const noOutline = stops.filter(s => !s.outline).map(s => `${s.tag} "${s.name}"`);
  const hidden = stops.filter(s => !s.onScreen).map(s => `${s.tag} "${s.name}"`);
  expect(noOutline, 'Tab stops without a visible focus outline').toEqual([]);
  expect(hidden, 'Tab stops not fully on screen (2.4.11)').toEqual([]);
});

test('skip link appears on focus and moves focus to the main content', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await go(page, '#/');
  const first = await page.evaluate(() => [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')][0].id);
  expect(first, 'skip link is the first focusable element').toBe('skip');
  await page.locator('#skip').focus();
  const box = await page.locator('#skip').boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('mobile menu opens and closes with the keyboard (Escape returns focus to the button)', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'the menu button only shows on narrow screens');
  await freshStart(page, { lang: 'en' });
  await go(page, '#/');
  await page.locator('#menu-btn').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#menu-btn')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu-btn')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#menu-btn')).toBeFocused();
});
