// Names and voice matching (follow-up to Phase 7): "What should we call you?", Amharic or Latin letters, a warning
// when voice is used, "Ask someone to type this for me", the full name as an optional part of My profile, and voice
// matching for choice questions that uses whole words and never guesses between two answers.
import { test, expect } from '@playwright/test';
import { freshStart, go, pick, next, heading, signupTo, fakeSpeechEngine, speakAnswer } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); });

test('the sign-up asks only what to call the learner, in Amharic or Latin letters', async ({ page }) => {
  await signupTo(page, 'name');
  expect(await heading(page)).toBe('What should we call you?');
  await expect(page.locator('[data-ref=input]')).toHaveAttribute('autocomplete', 'nickname');
  await page.fill('[data-ref=input]', 'Abebe2!'); await next(page);
  await expect(page.locator('.dm-err')).toContainText('Use letters only. Amharic or English letters are both fine.');
  await page.fill('[data-ref=input]', 'ሰላም በቀለ'); await next(page);
  expect(await heading(page)).toContain('phone number');
  await page.locator('[data-act=back]').click();
  await page.fill('[data-ref=input]', "Selam O'Neil-Bekele"); await next(page);
  expect(await heading(page)).toContain('phone number');
});

test('a spoken name always comes with "Voice may get names wrong. Please check and correct it."', async ({ page }) => {
  await fakeSpeechEngine(page, { transcript: 'Salem' });
  await signupTo(page, 'name');
  await speakAnswer(page);
  await expect(page.locator('.dm-heard-warn')).toHaveText('Voice may get names wrong. Please check and correct it.');
  await page.fill('[data-ref=heard-edit]', 'Selam');
  await page.locator('[data-act=heard-yes]').click();
  await expect(page.locator('[data-ref=input]')).toHaveValue('Selam');
});

test('"Ask someone to type this for me" explains the hand-over, then takes the learner back to check the name', async ({ page }) => {
  await signupTo(page, 'name');
  const ask = page.getByRole('button', { name: 'Ask someone to type this for me' });
  await expect(ask).toHaveAttribute('aria-expanded', 'false');
  await ask.click();
  await expect(ask).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-ref=askhelp] p')).toBeFocused();
  await expect(page.locator('[data-ref=askhelp]')).toContainText('hand the phone to someone you trust');
  await page.fill('[data-ref=input]', 'Tigist Alemu'); // the helper types
  await page.getByRole('button', { name: 'I have the phone back' }).click();
  await expect(page.locator('[data-ref=input]')).toBeFocused();
  await expect(page.locator('[data-ref=input]')).toHaveValue('Tigist Alemu');
  await expect(page.locator('[data-ref=askhelp]')).toBeHidden();
});

test('the full name is optional, in My profile, and job applications use it', async ({ page }) => {
  await signupTo(page, 'END'); await next(page);
  await go(page, '#/profile');
  await expect(page.locator('.dm-review')).toContainText('Full name (optional)');
  await page.locator('.dm-review > div', { hasText: 'Full name' }).locator('[data-act=change]').click();
  await page.fill('[data-ref=input]', 'Abebe Kebede Tesfaye'); await next(page);
  await next(page);
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.profile')))).full_name).toBe('Abebe Kebede Tesfaye');
  await go(page, '#/apply/s1');
  await expect(page.locator('[data-ref=input]')).toHaveValue('Abebe Kebede Tesfaye');
});

test('voice matching for choices: whole words, Amharic endings, and never a guess between two answers', async ({ page }) => {
  await go(page, '#/');
  const r = await page.evaluate(() => {
    const D = window.SavannaOnboarding, f = id => D.forms.signup.fields.find(x => x.id === id).options;
    const want = D.forms.passport.fields.find(x => x.id === 'want').options;
    const m = (s, o) => D._matchOptions(s, o);
    return {
      me: m('it is me myself', f('filler')),
      know: m('I know', f('consent')),
      no: m('no', f('consent')),
      yesNo: m('yes no', f('consent')),
      iAgree: m('yes I agree', f('consent')),
      amYes: m('አዎን', f('consent')),
      notNow: m('not now', want),
      kebele: m('my kebele id', f('id_route')),
      passport: m('I have a passport', f('id_route')),
      none: m('I have none of these', f('id_route')),
      withWord: m('with my teacher', f('filler'))
    };
  });
  expect(r.me).toEqual(['self']);
  expect(r.know).toEqual([]);           // "no" is not heard inside "know"
  expect(r.no).toEqual(['no']);
  expect(r.yesNo.sort()).toEqual(['no', 'yes']); // two answers: the form asks again instead of guessing
  expect(r.iAgree).toEqual(['yes']);    // "agree" in "No, I do not agree" does not count
  expect(r.amYes).toEqual(['yes']);     // Amharic ending (አዎ + ን)
  expect(r.notNow).toEqual(['later']);
  expect(r.kebele).toEqual(['kebele']);
  expect(r.passport).toEqual(['passport']);
  expect(r.none).toEqual(['none']);
  expect(r.withWord).toEqual([]);       // a common word alone is not an answer
});

test('two answers heard for one choice: the learner is asked again, nothing is chosen', async ({ page }) => {
  await fakeSpeechEngine(page, { transcript: 'yes no' });
  await signupTo(page, 'consent');
  await speakAnswer(page);
  await expect(page.locator('.dm-status')).toContainText('I heard more than one answer');
  await expect(page.locator('input[name=v]:checked')).toHaveCount(0);
});
