// 15 Nov team requests: the date of birth (question 6 of sign-up) starts with a choice of calendar; day and year are
// lists for "read and type" and "simple steps", typed (with voice) for "listen" and "speak". And Afaan Oromo as a
// third language on every page (a draft for native-speaker review).
import { test, expect } from '@playwright/test';
import { freshStart, go, pick, next, heading, signupTo, fakeSpeechEngine, say, speakAnswer } from './helpers.mjs';

const draft = page => page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.draft.signup')));
test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); });

test('date: the calendar is chosen first; "read and type" picks day, month and year from lists; no microphone', async ({ page }) => {
  await signupTo(page, 'dob');
  await expect(page.locator('.dm-progress, [data-ref=progress]').first()).toContainText('Question 6 of 7');
  const cal = page.getByRole('group', { name: 'Which calendar do you use?' });
  await expect(cal.getByRole('radio', { name: 'Ethiopian calendar' })).toBeChecked();
  await expect(cal.getByRole('radio', { name: 'Gregorian (European) calendar' })).not.toBeChecked();
  for (const name of ['Day', 'Month', 'Year']) await expect(page.getByRole('combobox', { name })).toHaveCount(1);
  await expect(page.locator('[data-act=speak]')).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Day' }).selectOption('12');
  await page.getByRole('combobox', { name: 'Month' }).selectOption({ label: 'Meskerem' });
  await page.getByRole('combobox', { name: 'Year' }).focus();
  await page.getByRole('combobox', { name: 'Year' }).selectOption('1995');
  await expect(page.locator('[data-ref=date-conv]')).toHaveText('In the Gregorian calendar this is 22 September 2002.');
  await expect(page.getByRole('combobox', { name: 'Year' })).toBeFocused(); // choosing does not move focus away
  // switching calendar keeps the same day: 12 Meskerem 1995 = 22 September 2002
  await cal.getByRole('radio', { name: 'Gregorian (European) calendar' }).check();
  await expect(cal.getByRole('radio', { name: 'Gregorian (European) calendar' })).toBeFocused();
  await expect(page.getByRole('combobox', { name: 'Month' })).toHaveValue('9');
  await expect(page.getByRole('combobox', { name: 'Year' })).toHaveValue('2002');
  await expect(page.locator('[data-ref=date-conv]')).toHaveText('In the Ethiopian calendar this is 12 Meskerem 1995.');
  await next(page);
  expect((await draft(page)).answers.dob).toEqual({ cal: 'greg', d: 22, m: 9, y: 2002, gregorian: '2002-09-22' });
});

test('date: "simple steps" also uses lists; a Gregorian date that does not exist is an error', async ({ page }) => {
  await signupTo(page, 'dob', 'simple');
  await expect(page.locator('select[name=d]')).toHaveCount(1);
  await page.getByRole('radio', { name: 'Gregorian (European) calendar' }).check();
  await page.locator('select[name=d]').selectOption('31');
  await page.locator('select[name=m]').selectOption('2');
  await page.locator('select[name=y]').selectOption('2000');
  await next(page);
  await expect(page.locator('.dm-errors')).toContainText('Enter a real date in the Gregorian calendar');
});

for (const mode of ['listen', 'speak']) {
  test(`date: "${mode}" types day and year, and can answer by voice (checked before use)`, async ({ page }) => {
    await fakeSpeechEngine(page);
    await signupTo(page, 'dob', mode);
    await expect(page.locator('input[name=d]')).toHaveCount(1);
    await expect(page.locator('input[name=y]')).toHaveCount(1);
    await expect(page.locator('[data-act=speak]')).toHaveCount(1);
    await say(page, { alts: ['12 Meskerem 1995'] });
    await speakAnswer(page);
    await expect(page.locator('.dm-heard')).toContainText('12 Meskerem 1995 (22 September 2002)');
    await expect(page.locator('input[name=d]')).toHaveValue(''); // nothing used before the check
    await page.locator('[data-act=heard-yes]').click();
    await expect(page.locator('input[name=d]')).toHaveValue('12');
    await expect(page.locator('select[name=m]')).toHaveValue('1');
    await expect(page.locator('input[name=y]')).toHaveValue('1995');
    // a Gregorian month name switches the calendar
    await say(page, { alts: ['March 5 1990'] });
    await speakAnswer(page);
    await page.locator('[data-act=heard-yes]').click();
    await expect(page.getByRole('radio', { name: 'Gregorian (European) calendar' })).toBeChecked();
    await expect(page.locator('[data-ref=date-conv]')).toHaveText('In the Ethiopian calendar this is 26 Yekatit 1982.');
  });
}

test('date: words that are not a date ask the learner to try again or type', async ({ page }) => {
  await fakeSpeechEngine(page);
  await signupTo(page, 'dob', 'speak');
  await say(page, { alts: ['I do not remember'] });
  await speakAnswer(page);
  await expect(page.locator('.dm-status')).toContainText('I did not catch a date');
  await expect(page.locator('.dm-heard')).toHaveCount(0);
});

test('date: skipping is fine even with the Gregorian calendar chosen', async ({ page }) => {
  await signupTo(page, 'dob');
  await page.getByRole('radio', { name: 'Gregorian (European) calendar' }).check();
  await next(page);
  expect(await heading(page)).toBe('Do you agree to how we keep your answers?');
});

test('Afaan Oromo: from the bar on every Savanna page, in the forms and in Settings', async ({ page }) => {
  await page.goto('/index.html'); await page.waitForFunction(() => !!window.SavannaOnboarding);
  await page.locator('.sj-tog[data-tog=om]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'om');
  await expect(page.locator('.sj-tog[data-tog=om]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#sj-step-h')).toHaveText('Akkamitti galmaa\'uu barbaadda?');
  await pick(page, 'read_type'); await page.locator('#sj-mode button[type=submit]').click();
  await page.locator('.sj-split a[href="signup.html"]').click();
  await page.waitForSelector('.dm-q');
  expect(await heading(page)).toBe('Eenyutu unka kana guutaa jira?');
  // inside the form: one button for each of the other two languages, each named in its own language
  await expect(page.locator('[data-act=lang]')).toHaveText(['አማርኛ', 'English']);
  await page.locator('[data-act=lang][data-lang=en]').click();
  expect(await heading(page)).toBe('Who is filling in this form?');
  await page.locator('[data-act=lang][data-lang=om]').click();
  expect(await heading(page)).toBe('Eenyutu unka kana guutaa jira?');
  await page.goto('/settings.html'); await page.waitForFunction(() => !!window.SavannaOnboarding);
  await expect(page.locator('input[name=lang][value=om]')).toBeChecked();
  await expect(page.locator('.sj h1, .dm h1').first()).toHaveText('Qindaa\'ina');
});

test('Afaan Oromo: no page shows a missing text key, and the Ethiopian months are in Oromo', async ({ page }) => {
  await go(page, '#/');
  await page.evaluate(() => window.SavannaOnboarding.setPrefs({ lang: 'om' }));
  const om = await page.evaluate(() => window.SavannaOnboarding.eth.months.om);
  expect(om[0]).toBe('Fulbaana');
  await signupTo(page, 'dob');
  await expect(page.locator('select[name=m] option').nth(1)).toHaveText('Fulbaana');
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/\b(chooseDay|calEth|calGreg|errDateGreg|voiceNoDate)\b/);
});
