// Phase 2: form engine. Config, state and presentation are separate; these tests check the state on its own,
// the fixes (stale ID number, changing question count, resume screen, two forms on one page, storage keys)
// and the new profile-update journey.
import { test, expect } from '@playwright/test';
import { freshStart, go, pick, next, heading, signupTo } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); });

const draft = page => page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.draft.signup') || 'null'));

test('state works on its own, without the page (FormState)', async ({ page }) => {
  await go(page, '#/');
  const r = await page.evaluate(() => {
    const D = window.SavannaOnboarding;
    const s = new D.FormState(D.forms.signup, 'draft.unit-test');
    const out = {};
    out.first = s.field().id;
    s.setAnswer('filler', 'partner');
    out.partnerTotal = s.progress().total;
    s.setAnswer('filler', 'self');
    s.prune();
    out.selfTotal = s.progress().total;
    s.setAnswer('id_route', 'fayda'); s.setAnswer('id_number', 'A1');
    s.setAnswer('id_route', 'kebele');
    out.numberAfterRouteChange = s.answers.id_number === undefined;
    out.error = D.validate(D.forms.signup.fields.find(f => f.id === 'phone'), '0911', {}, 'en');
    localStorage.removeItem('savanna-onboarding.draft.unit-test');
    return out;
  });
  expect(r.first).toBe('filler');
  expect(r.partnerTotal).toBe(10);
  expect(r.selfTotal).toBe(7);
  expect(r.numberAfterRouteChange).toBe(true);
  expect(r.error).toContain('10 digits');
});

test('ID number is cleared when the ID type changes (Fayda -> kebele), and asked again', async ({ page }) => {
  await signupTo(page, 'id_number');
  await page.fill('[data-ref=input]', 'FAYDA-123456');
  await next(page);
  await page.locator('[data-act=back]').click();
  await page.locator('[data-act=back]').click();
  await pick(page, 'kebele'); await next(page);
  expect(await heading(page)).toContain('number on your ID');
  await expect(page.locator('[data-ref=input]')).toHaveValue('');
  expect(JSON.stringify(await draft(page))).not.toContain('FAYDA-123456');
});

test('after "Change" of the ID type on the summary, the new follow-up question is asked before returning', async ({ page }) => {
  await signupTo(page, 'END');
  const idRow = page.locator('.dm-review > div', { hasText: 'ID' }).first();
  await idRow.locator('[data-act=change]').click();
  await pick(page, 'none'); await next(page);
  expect(await heading(page)).toContain('Which organisation can confirm');
  await pick(page, 'aaapd'); await next(page);
  expect(await heading(page)).toBe('Check your answers');
  await expect(page.locator('.dm-review')).toContainText('AAAPD');
});

test('when an answer changes the number of questions, the learner is told', async ({ page }) => {
  await go(page, '#/signup');
  await pick(page, 'read_type'); await next(page);
  await expect(page.locator('.dm-progress')).toHaveText('Question 1 of 7');
  await pick(page, 'partner'); await next(page);
  await expect(page.locator('.dm-progress')).toHaveText('Question 2 of 10');
  await expect(page.locator('.dm-status')).toHaveText('Your answer changed the number of questions. There are now 10 questions.');
});

test('the question count stays the same along the whole "for myself" route', async ({ page }) => {
  const totals = [];
  await go(page, '#/signup');
  await pick(page, 'read_type'); await next(page);
  const steps = [() => pick(page, 'self'), () => page.fill('[data-ref=input]', 'Abebe Kebede'), () => page.fill('[data-ref=input]', '0911234567'),
    () => pick(page, 'kebele'), async () => {}, async () => {}, () => pick(page, 'yes')];
  for (const act of steps) {
    totals.push((await page.locator('.dm-progress').innerText()).replace(/.* of /, ''));
    await act(); await next(page);
  }
  expect(totals).toEqual(['7', '7', '7', '7', '7', '7', '7']);
  expect(await heading(page)).toBe('Check your answers');
});

test('no microphone on sensitive questions (ID and support needs)', async ({ page }) => {
  await page.addInitScript(() => { window.SpeechRecognition = class { start() {} stop() {} abort() {} }; });
  await signupTo(page, 'name');
  await expect(page.locator('[data-act=speak]')).toHaveCount(1); // name: voice is fine
  await page.fill('[data-ref=input]', 'Abebe Kebede'); await next(page);
  await page.fill('[data-ref=input]', '0911234567'); await next(page);
  await expect(page.locator('[data-act=speak]')).toHaveCount(0); // ID type
  await pick(page, 'fayda'); await next(page);
  await expect(page.locator('[data-act=speak]')).toHaveCount(0); // ID number
  await go(page, '#/passport');
  await expect(page.locator('[data-act=speak]')).toHaveCount(0); // "would you like to tell us what helps you"
  await pick(page, 'yes'); await next(page);
  await expect(page.locator('[data-act=speak]')).toHaveCount(0); // support needs
});

test('resume: leaving on "Check your answers" comes back to "Check your answers"', async ({ page }) => {
  await signupTo(page, 'END');
  await page.reload();
  expect(await heading(page)).toBe('Check your answers');
  await expect(page.locator('.dm-status')).toContainText('Welcome back');
});

test('resume: "Finish later" keeps one code per draft, and the link brings the answers back', async ({ page }) => {
  await signupTo(page, 'phone');
  await page.locator('[data-act=later]').click();
  const link1 = await page.locator('.dm-q ~ p a').getAttribute('href');
  await page.locator('[data-act=resume]').click();
  await page.locator('[data-act=later]').click();
  const link2 = await page.locator('.dm-q ~ p a').getAttribute('href');
  expect(link2).toBe(link1);
  const codes = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('savanna-onboarding.resume.')));
  expect(codes).toHaveLength(1);
  await page.goto(link1);
  expect(await heading(page)).toContain('phone number');
  await expect(page.locator('.dm-status')).toContainText('Welcome back');
});

test('resume: a link opened on a phone without the answers explains why', async ({ page }) => {
  await page.goto('/index.html?resume=NOTHERE#/signup');
  await page.waitForSelector('.dm-q');
  await expect(page.locator('.dm-status')).toContainText('saved only on the phone where you started');
});

test('storage: old "dimts." keys from the prototype are moved to "savanna-onboarding." keys', async ({ page }) => {
  await go(page, '#/');
  await page.evaluate(() => {
    localStorage.setItem('dimts.profile', JSON.stringify({ name: 'Old Name' }));
    localStorage.setItem('dimts.draft.passport', JSON.stringify({ answers: { want: 'later' }, step: 0 }));
  });
  await page.reload(); // the move happens when the script loads
  await page.waitForFunction(() => !!window.SavannaOnboarding);
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(keys.filter(k => k.startsWith('dimts.'))).toEqual([]);
  expect(keys).toContain('savanna-onboarding.profile');
  expect(keys).toContain('savanna-onboarding.draft.passport');
  expect(keys.every(k => k.startsWith('savanna-onboarding.') || k === '__seeded')).toBe(true);
});

test('two forms on one page work independently (labels, errors and focus stay in their own form)', async ({ page }) => {
  await go(page, '#/');
  await page.evaluate(() => {
    document.getElementById('view').innerHTML = '<savanna-onboarding-form form="employer"></savanna-onboarding-form><savanna-onboarding-form form="apply" instance="x"></savanna-onboarding-form>';
  });
  const [a, b] = [page.locator('savanna-onboarding-form').nth(0), page.locator('savanna-onboarding-form').nth(1)];
  await b.locator('button[type=submit]').click(); // empty answer in the second form
  await expect(b.locator('.dm-errors')).toBeFocused();
  await expect(a.locator('.dm-errors')).toHaveCount(0);
  await b.locator('.dm-errors a').click();
  await expect(b.locator('[data-ref=input]')).toBeFocused();
  // each label points at the input in its own form
  for (const f of [a, b]) {
    const forId = await f.locator('h1 label').getAttribute('for');
    expect(await f.locator('#' + forId).count()).toBe(1);
  }
});

test('profile update: starts on the summary, changes one detail, and later forms use it', async ({ page }) => {
  await signupTo(page, 'END');
  await next(page); // account created
  await go(page, '#/profile');
  expect(await heading(page)).toBe('My profile');
  await expect(page.locator('.dm-review')).toContainText('Abebe Kebede');
  await expect(page.locator('.dm-review')).toContainText('0911234567');
  await expect(page.locator('[data-act=back]')).toHaveCount(0);
  await page.locator('.dm-review > div', { hasText: 'Name' }).first().locator('[data-act=change]').click();
  await expect(page.locator('[data-ref=input]')).toHaveValue('Abebe Kebede');
  await page.fill('[data-ref=input]', 'Abebe K. Tesfaye');
  await next(page);
  expect(await heading(page)).toBe('My profile'); // straight back to the summary: nothing else is asked
  await next(page);
  expect(await heading(page)).toContain('Your profile is updated');
  const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.profile')));
  expect(profile.name).toBe('Abebe K. Tesfaye');
  expect(profile.assurance_level).toBe('self_declared');
  await go(page, '#/apply/s1');
  await expect(page.locator('[data-ref=input]')).toHaveValue('Abebe K. Tesfaye'); // never asked twice
});

test('profile update: without a profile, the page explains and links to sign-up', async ({ page }) => {
  await go(page, '#/profile');
  await expect(page.locator('h1')).toHaveText('My profile');
  await expect(page.locator('#view a[href="#/signup"]')).toBeVisible();
});
