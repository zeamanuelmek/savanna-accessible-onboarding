// Known problems found in the Phase 0 audit.
// Each test describes the CORRECT behaviour and is marked test.fail() because the prototype
// does not do it yet. When a phase fixes the problem, Playwright reports the test as
// "unexpectedly passed": remove its test.fail() line then, so it becomes a normal regression test.
import { test, expect } from '@playwright/test';
import { freshStart, go, next, signupTo, fakeSpeechEngine, speakAnswer } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); });

const fakeSpeech = (page, transcript) => fakeSpeechEngine(page, { transcript });

test('PRIVACY: unconfirmed speech is never saved (fixed in Phase 3)', async ({ page }) => {
  await fakeSpeech(page, 'Secret Spoken Name');
  await signupTo(page, 'name');
  await speakAnswer(page);
  await expect(page.locator('[data-ref=heard-h]')).toContainText('Secret Spoken Name');
  const draft = await page.evaluate(() => localStorage.getItem('savanna-onboarding.draft.signup') || '');
  expect(draft).not.toContain('Secret Spoken Name');
});

test('PRIVACY: "Say it again" discards the previous transcript (fixed in Phase 3)', async ({ page }) => {
  await fakeSpeech(page, 'Wrong Words');
  await signupTo(page, 'name');
  await speakAnswer(page);
  await expect(page.locator('[data-ref=heard-h]')).toBeVisible();
  await page.evaluate(() => { window.SpeechRecognition.prototype.start = function () {}; });
  await page.locator('[data-act=heard-again]').click();
  await expect(page.locator('[data-ref=input]')).toHaveValue('');
});

test('BRAND: the old name "Dimts" is not visible to learners (fixed in Phase 1)', async ({ page }) => {
  for (const hash of ['#/', '#/signup', '#/jobs', '#/settings']) {
    await go(page, hash);
    expect(await page.title()).not.toMatch(/dimts/i);
    expect(await page.locator('body').innerText()).not.toMatch(/dimts/i);
  }
});

test('LEARNER VIEW: no developer page in the learner navigation (fixed in Phase 1)', async ({ page }) => {
  await go(page, '#/');
  await expect(page.locator('#nav a[href="#/developers"]')).toHaveCount(0);
});

// Decision 18, changed on 15 Nov: with "read and type" (lists for day, month and year) there is no microphone on the
// date; "listen" and "speak" type the date and may answer by voice (tests/date-language.spec.mjs).
test('VOICE: the date question has no microphone when the date is chosen from lists (decision 18)', async ({ page }) => {
  await page.addInitScript(() => { window.SpeechRecognition = class { start() {} stop() {} abort() {} }; });
  await signupTo(page, 'dob');
  await expect(page.locator('[data-act=speak]')).toHaveCount(0);
});

test('MULTI-INSTANCE: two forms on one page do not share element ids (fixed in Phase 2)', async ({ page }) => {
  await go(page, '#/');
  await page.evaluate(() => {
    document.getElementById('view').innerHTML = '<dimts-form form="employer"></dimts-form><dimts-form form="passport"></dimts-form>';
  });
  await page.waitForSelector('dimts-form .dm-q');
  const dupes = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
    return ids.filter((id, i) => ids.indexOf(id) !== i);
  });
  expect(dupes).toEqual([]);
});

test('PRIVACY: answers from abandoned routes are not kept in the draft (fixed in Phase 2)', async ({ page }) => {
  await signupTo(page, 'id_number');
  await page.fill('[data-ref=input]', 'FAYDA-123456');
  await next(page);
  await page.locator('[data-act=back]').click(); // back to ID number
  await page.locator('[data-act=back]').click(); // back to ID route
  await page.locator('.dm-opt:has(input[value="none"])').click();
  await next(page);
  const draft = await page.evaluate(() => localStorage.getItem('savanna-onboarding.draft.signup') || '');
  expect(draft).not.toContain('FAYDA-123456');
});

test('PRIVACY: profile is not stored as readable plain text (decide in Phase 6)', async ({ page }) => {
  test.fail(true, 'Profile and Support Passport are plain JSON in localStorage');
  await signupTo(page, 'END');
  await next(page);
  const raw = await page.evaluate(() => localStorage.getItem('savanna-onboarding.profile') || '');
  expect(raw).not.toContain('Abebe Kebede');
});
