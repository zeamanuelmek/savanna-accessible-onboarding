// Phase 3: answer input by voice, as a reviewed state machine. The browser's speech engine is replaced by a fake,
// so these tests check our behaviour (consent, review, never saving unreviewed speech, errors, fallbacks), not Google.
import { test, expect } from '@playwright/test';
import { freshStart, go, pick, next, heading, signupTo, fakeSpeechEngine, say, speakAnswer } from './helpers.mjs';

const fakeSpeech = (page, o) => fakeSpeechEngine(page, o);
const draftText = page => page.evaluate(() => localStorage.getItem('savanna-onboarding.draft.signup') || '');

test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); });

test('consent is asked before the first use, and the microphone status is clear', async ({ page }) => {
  await fakeSpeech(page, { consent: false });
  await signupTo(page, 'name');
  await page.locator('[data-act=speak]').click();
  await expect(page.locator('[data-ref=vc]')).toBeFocused();
  await expect(page.locator('.dm-heard, [data-ref=heard]')).toContainText('sends your recording to Google');
  expect(await page.evaluate(() => window.__starts)).toBe(0); // nothing started before consent
  await say(page, { hold: true });
  await page.locator('[data-act=voice-allow]').click();
  await expect(page.locator('[data-act=speak]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-act=speak]')).toContainText('Stop listening');
  await expect(page.locator('.dm-status')).toContainText('Microphone on');
});

test('the transcript can be corrected before it is used, and is saved only on Continue', async ({ page }) => {
  await fakeSpeech(page);
  await signupTo(page, 'name');
  await say(page, { alts: ['Abebe Kebedde', 'Abebe Kebede'] });
  await speakAnswer(page);
  await expect(page.locator('[data-ref=heard-h]')).toBeFocused();
  await expect(page.locator('[data-ref=heard-edit]')).toHaveValue('Abebe Kebedde');
  await expect(page.locator('[data-ref=input]')).toHaveValue(''); // not in the answer yet
  await page.locator('[data-act=heard-alt]').first().click(); // "Or did you say: Abebe Kebede"
  await expect(page.locator('[data-ref=heard-edit]')).toHaveValue('Abebe Kebede');
  await page.fill('[data-ref=heard-edit]', 'Abebe Kebede Alemu');
  expect(await draftText(page)).not.toContain('Abebe Kebede Alemu');
  await page.locator('[data-act=heard-yes]').click();
  await expect(page.locator('[data-ref=input]')).toHaveValue('Abebe Kebede Alemu');
  await expect(page.locator('.dm-status')).toContainText('Answer added from your voice');
  await expect(page.locator('.dm-form button[type=submit]')).toBeFocused();
  expect(await draftText(page)).not.toContain('Abebe Kebede Alemu'); // still not saved
  await next(page);
  expect(await draftText(page)).toContain('Abebe Kebede Alemu');
});

test('a spoken choice is shown for checking and only selected after "Use this answer"', async ({ page }) => {
  await fakeSpeech(page);
  await signupTo(page, 'filler');
  await say(page, { alts: ['it is me myself'] });
  await speakAnswer(page);
  await expect(page.locator('.dm-heard')).toContainText('This matches: Me, for myself');
  await expect(page.locator('input[value=self]')).not.toBeChecked();
  await page.locator('[data-act=heard-yes]').click();
  await expect(page.locator('input[value=self]')).toBeChecked();
});

test('a spoken phone number becomes digits', async ({ page }) => {
  await fakeSpeech(page);
  await signupTo(page, 'phone');
  await say(page, { alts: ['zero nine one one two three four five six seven'] });
  await speakAnswer(page);
  await expect(page.locator('[data-ref=heard-edit]')).toHaveValue('0911234567');
});

test('Continue while a voice answer waits for checking does not skip the check', async ({ page }) => {
  await fakeSpeech(page);
  await signupTo(page, 'name');
  await say(page, { alts: ['Unchecked Words'] });
  await speakAnswer(page);
  await expect(page.locator('[data-ref=heard-h]')).toBeFocused();
  await next(page);
  expect(await heading(page)).toContain('What should we call you'); // still on the same question
  await expect(page.locator('.dm-status')).toContainText('First check the answer from your voice');
  expect(await draftText(page)).not.toContain('Unchecked Words');
});

test('"Type it instead" throws the transcript away; changing language does too', async ({ page }) => {
  await fakeSpeech(page);
  await signupTo(page, 'name');
  await page.fill('[data-ref=input]', 'Typed Name');
  await say(page, { alts: ['Spoken Name'] });
  await speakAnswer(page);
  await page.locator('[data-act=heard-type]').click();
  await expect(page.locator('.dm-heard')).toHaveCount(0);
  await expect(page.locator('[data-ref=input]')).toHaveValue('Typed Name');
  await expect(page.locator('[data-ref=input]')).toBeFocused();
  await say(page, { alts: ['Spoken Name'] });
  await speakAnswer(page);
  await expect(page.locator('.dm-heard')).toHaveCount(1);
  await page.locator('[data-act=lang]').click();
  await expect(page.locator('.dm-heard')).toHaveCount(0);
  expect(await draftText(page)).not.toContain('Spoken Name');
});

test('no match for a choice asks the learner to try again or tap', async ({ page }) => {
  await fakeSpeech(page);
  await signupTo(page, 'filler');
  await say(page, { alts: ['banana'] });
  await speakAnswer(page);
  await expect(page.locator('.dm-status')).toContainText('did not catch one of the choices');
  await expect(page.locator('.dm-heard')).toHaveCount(0);
});

for (const [code, message] of [['not-allowed', 'microphone is blocked'], ['network', 'need an internet connection'],
  ['no-speech', 'did not hear anything'], ['audio-capture', 'No microphone was found'], ['language-not-supported', 'not available in this browser']]) {
  test(`speech error "${code}" gives a clear message and falls back to typing`, async ({ page }) => {
    await fakeSpeech(page);
    await signupTo(page, 'name');
    await say(page, { error: code });
    await page.locator('[data-act=speak]').click();
    if (code === 'no-speech') await page.locator('[data-act=speak]').click(); // silence is not an error until the learner presses Stop
    await expect(page.locator('.dm-status')).toContainText(message);
    await expect(page.locator('[data-act=speak]')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('[data-ref=input]')).toBeEnabled();
  });
}

test('no speech engine (e.g. an app WebView): no microphone button, and a clear note for voice-first learners', async ({ page }) => {
  await page.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; });
  await go(page, '#/signup');
  await pick(page, 'speak'); await next(page);
  await pick(page, 'self'); await next(page);
  await expect(page.locator('[data-act=speak]')).toHaveCount(0);
  await expect(page.locator('.dm-form .dm-note:not([hidden])')).toContainText('Voice answers are not available in this browser');
  await page.fill('[data-ref=input]', 'Abebe Kebede'); await next(page); // typing still works
  expect(await heading(page)).toContain('phone number');
});

test('voice consent can be withdrawn in Settings, and is asked again afterwards', async ({ page }) => {
  await fakeSpeech(page);
  await go(page, '#/settings');
  await expect(page.locator('input[name=voice][value=on]')).toBeChecked();
  await expect(page.locator('fieldset', { hasText: 'Voice answers' })).toContainText('sends your recording to Google');
  await page.locator('.dm-opt:has(input[name=voice][value=off])').click();
  await expect(page.locator('input[name=voice][value=off]')).toBeChecked();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('savanna-onboarding.voiceConsent'))).toBe('false');
  await signupTo(page, 'name');
  await page.locator('[data-act=speak]').click();
  await expect(page.locator('[data-ref=vc]')).toBeVisible();
});

test('pressing the microphone again stops listening', async ({ page }) => {
  await fakeSpeech(page);
  await signupTo(page, 'name');
  await say(page, { hold: true });
  await page.locator('[data-act=speak]').click();
  await expect(page.locator('[data-act=speak]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-act=speak]').click();
  await expect(page.locator('[data-act=speak]')).toHaveAttribute('aria-pressed', 'false');
});

test('the microphone stays on through pauses: only Stop ends it, and the words are joined (phone number)', async ({ page }) => {
  await fakeSpeech(page);
  await signupTo(page, 'phone');
  await say(page, { alts: ['zero nine one one'], autoEnd: true }); // the browser stops by itself after a pause
  const mic = page.locator('[data-act=speak]');
  await mic.click();
  await expect.poll(() => page.evaluate(() => window.__starts)).toBe(2); // listening again at once
  await expect(mic).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.dm-status')).toContainText('press Stop listening when you have finished');
  await expect(page.locator('.dm-heard')).toHaveCount(0); // nothing shown before Stop
  await say(page, { alts: ['two three four five six seven'] });
  await mic.click(); // Stop
  await expect(mic).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-ref=heard-edit]')).toHaveValue('0911234567');
});

test('another speech engine can be plugged in through the adapter (setSpeech)', async ({ page }) => {
  await go(page, '#/');
  await page.evaluate(() => {
    window.SavannaOnboarding.setSpeech({ input: {
      supported: () => true,
      start: (lang, h) => { setTimeout(() => { h.result(['Adapter Words']); h.end(); }, 10); return { stop() {}, abort() {} }; }
    } });
    localStorage.setItem('savanna-onboarding.voiceConsent', 'true');
  });
  await go(page, '#/signup');
  await pick(page, 'read_type'); await next(page);
  await pick(page, 'self'); await next(page);
  await page.locator('[data-act=speak]').click();
  await expect(page.locator('[data-ref=heard-edit]')).toHaveValue('Adapter Words');
});
