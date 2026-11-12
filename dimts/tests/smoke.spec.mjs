// Functional baseline: features the prototype claims to have, checked end to end.
import { test, expect } from '@playwright/test';
import { freshStart, go, pick, next, heading, signupTo } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); });

test('sign-up journey completes and creates a profile', async ({ page }) => {
  await page.addInitScript(() => {
    window.__events = [];
    document.addEventListener('dimts:complete', e => window.__events.push(e.detail));
  });
  await signupTo(page, 'END');
  expect(await heading(page)).toBe('Check your answers');
  await expect(page.locator('.dm-review dd').first()).toContainText('Me, for myself');
  await next(page);
  expect(await heading(page)).toContain('Welcome');
  const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('dimts.profile')));
  expect(profile.name).toBe('Abebe Kebede');
  expect(profile.assurance_level).toBe('self_declared');
  const events = await page.evaluate(() => window.__events);
  expect(events).toHaveLength(1);
  expect(events[0].form).toBe('signup');
  // Draft is removed after submit
  expect(await page.evaluate(() => localStorage.getItem('dimts.draft.signup'))).toBeNull();
});

test('one question per screen: question is the h1 and receives focus', async ({ page }) => {
  await signupTo(page, 'name');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1.dm-q')).toBeFocused();
  await expect(page.locator('.dm-progress')).toHaveText(/Question 2 of \d+/);
});

test('empty answer shows error summary, focuses it, and links to the input', async ({ page }) => {
  await signupTo(page, 'name');
  await next(page);
  const summary = page.locator('.dm-errors');
  await expect(summary).toBeFocused();
  await expect(summary).toContainText('There is a problem');
  await expect(page.locator('#dm-input')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#dm-input')).toHaveAttribute('aria-describedby', /dm-err/);
  await summary.locator('a').click();
  await expect(page.locator('#dm-input')).toBeFocused();
});

test('phone validation rejects a short number', async ({ page }) => {
  await signupTo(page, 'phone');
  await page.fill('#dm-input', '0911');
  await next(page);
  await expect(page.locator('.dm-err')).toContainText('10 digits');
});

test('Ethiopian date converts to Gregorian', async ({ page }) => {
  await signupTo(page, 'dob');
  await page.fill('#dm-input', '1');
  await page.selectOption('#dm-m', '1');
  await page.fill('#dm-y', '2017');
  await next(page);
  // 1 Meskerem 2017 E.C. = 11 September 2024
  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('dimts.draft.signup')));
  expect(draft.answers.dob.gregorian).toBe('2024-09-11');
});

test('showIf: partner route asks partner questions and learner consent', async ({ page }) => {
  await go(page, '#/signup');
  await pick(page, 'read_type'); await next(page);
  await pick(page, 'partner'); await next(page);
  expect(await heading(page)).toContain('Which organisation');
  await pick(page, 'aaapd'); await next(page);
  await page.fill('#dm-input', 'Staff Member'); await next(page);
  expect(await heading(page)).toContain('Learner: do you agree');
  await pick(page, 'no'); await next(page);
  await expect(page.locator('.dm-err')).toBeVisible(); // learner must agree to continue
});

test('answers survive a reload (autosave) and show a welcome-back message', async ({ page }) => {
  await signupTo(page, 'phone');
  await page.reload();
  await expect(page.locator('.dm-status')).toContainText('Welcome back');
  expect(await heading(page)).toContain('phone number');
});

test('check answers: change returns to the review screen', async ({ page }) => {
  await signupTo(page, 'END');
  await page.locator('[data-act=change]').nth(1).click();
  expect(await heading(page)).toContain('full name');
  await page.fill('#dm-input', 'Tigist Alemu');
  await next(page);
  expect(await heading(page)).toBe('Check your answers');
  await expect(page.locator('.dm-review')).toContainText('Tigist Alemu');
});

test('back link goes to the previous question and keeps the answer', async ({ page }) => {
  await signupTo(page, 'phone');
  await page.locator('[data-act=back]').click();
  await expect(page.locator('#dm-input')).toHaveValue('Abebe Kebede');
});

test('finish later shows a resume link and a labelled SMS preview', async ({ page }) => {
  await signupTo(page, 'name');
  await page.locator('[data-act=later]').click();
  await expect(page.locator('.dm-panel:not([hidden])')).toContainText('In the live version we would send you this SMS');
});

test('settings apply text size and contrast to the page', async ({ page }) => {
  await go(page, '#/settings');
  await page.locator('.dm-opt:has(input[name=size][value=xlarge])').click();
  await page.locator('.dm-opt:has(input[name=contrast][value=high])').click();
  await expect(page.locator('html')).toHaveAttribute('data-dm-size', 'xlarge');
  await expect(page.locator('html')).toHaveAttribute('data-dm-contrast', 'high');
});

test('language switch changes the question to Amharic', async ({ page }) => {
  await signupTo(page, 'name');
  await page.locator('[data-act=lang]').click();
  expect(await heading(page)).toBe('ሙሉ ስምዎ ማን ነው?');
  await expect(page.locator('.dm')).toHaveAttribute('lang', 'am');
});

test('jobs filter runs on the device using the Support Passport', async ({ page }) => {
  await go(page, '#/');
  await page.evaluate(() => localStorage.setItem('dimts.passport', JSON.stringify({ needs: ['remote'], sharing: 'ask' })));
  await go(page, '#/jobs');
  await page.locator('#flt').check();
  const titles = await page.locator('.job h2').allInnerTexts();
  expect(titles.length).toBeGreaterThan(0);
  for (const t of titles) expect(['Remote content moderator', 'Junior web developer']).toContain(t);
});

test('voice consent screen appears before the microphone is used', async ({ page }) => {
  await page.addInitScript(() => { window.SpeechRecognition = class { start() {} stop() {} abort() {} }; });
  await signupTo(page, 'name');
  await page.locator('[data-act=speak]').click();
  await expect(page.locator('#dm-vc')).toHaveText('Before you use your voice');
});

for (const hash of ['#/', '#/signup', '#/jobs', '#/settings']) {
  test(`no horizontal scroll at 320px wide: ${hash}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await go(page, hash);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
