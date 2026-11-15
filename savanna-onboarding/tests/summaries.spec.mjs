// Page summaries and automatic reading (team request, 15 Nov). English only for now. Every page and form step has a
// short hand-written summary as the first text inside <main>. On a first visit the first control after the skip link
// is "Tap anywhere or press any key to hear this page"; after that, pages and steps read their summary when they
// open. "Automatic reading" is one switch (Accessibility panel and Settings), remembered; "Now reading… Pause · Stop"
// is pinned to the bottom only while audio plays, Escape stops at once (WCAG 1.4.2), and blocked sound never throws.
import { test, expect } from '@playwright/test';
import { freshStart, pick, next, fakeSpeechEngine, accessibilityPanel, playBar } from './helpers.mjs';

const at = (page, path) => page.goto(path).then(() => page.waitForFunction(() => !!window.SavannaOnboarding));
const summary = page => page.locator('#sj-summary');
const prefs = page => page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.prefs') || '{}'));

/** A fake phone voice that records what it reads; each piece "finishes" after `ms`. */
async function fakeVoice(page, ms = 50) {
  await page.evaluate(ms => {
    window.__said = []; window.__stops = 0;
    window.SavannaOnboarding.setSpeech({ output: {
      speak: (text, lang, url, done) => { window.__said.push(text); window.__t = setTimeout(() => done && done(), ms); return true; },
      stop: () => { window.__stops++; clearTimeout(window.__t); }, pause: () => {}, resume: () => {}
    } });
  }, ms);
}
const said = page => page.evaluate(() => window.__said || []);

test('every page has a summary as the first text inside main', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/index.html');
  await expect(summary(page)).toHaveText(/^Welcome to Savanna\. Step 1 of 2: choose how you like to register/);
  expect(await page.evaluate(() => document.querySelector('main').textContent.trim().indexOf(document.getElementById('sj-summary').textContent))).toBe(0);
  await expect(summary(page)).toHaveAttribute('lang', 'en');
  for (const [path, start] of [['/login.html', 'Log in. This log-in is simulated'], ['/jobs.html', 'Jobs. First a checkbox'], ['/settings.html', 'Accessibility settings:']]) {
    await at(page, path);
    await expect(summary(page)).toHaveText(new RegExp('^' + start));
  }
});

test('each form step has its own summary: "Step 3 of 5: your phone number…"', async ({ page }) => {
  await freshStart(page, { lang: 'en', prefs: { mode: 'read_type' } });
  await fakeSpeechEngine(page);
  await at(page, '/signup.html');
  await page.waitForSelector('.dm-q');
  await expect(summary(page)).toHaveText('Sign up for Savanna. Step 1 of 5: who is filling in this form: you, or a partner organisation with you. Choose one answer. Below are Continue and Back.');
  await pick(page, 'self'); await next(page);
  await page.fill('[data-ref=input]', 'Abebe'); await next(page);
  await expect(summary(page)).toHaveText('Sign up for Savanna. Step 3 of 5: your phone number. You can type it or say it. Below are Continue and Back.');
  await page.fill('[data-ref=input]', '0911234567'); await next(page);
  await expect(summary(page)).toContainText('Step 4 of 5: your date of birth. First choose your calendar, then the day, month and year. You can skip it.');
});

test('first visit: "Tap anywhere or press any key to hear this page" comes right after the skip link; a key press reads the page and is remembered', async ({ page }) => {
  await freshStart(page, { lang: 'en', prefs: { autoRead: 'ask' } });
  await at(page, '/index.html');
  await fakeVoice(page);
  const prompt = page.locator('#sj-hear');
  await expect(prompt).toHaveText('Tap anywhere or press any key to hear this page');
  expect(await said(page)).toEqual([]); // nothing plays before the learner interacts (browser autoplay rules)
  await page.keyboard.press('Tab'); // skip link
  await page.keyboard.press('Tab');
  await expect(prompt).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(() => said(page)).toEqual([await summary(page).innerText()]);
  await expect(prompt).toHaveCount(0);
  await expect(page.locator('.sj-home-link')).toBeFocused(); // the header comes next
  expect(await prefs(page)).toMatchObject({ autoRead: 'on', easy: true }); // one switch for all reading
  // in the same page, each new step reads its summary as it opens
  await pick(page, 'listen'); await page.locator('#sj-mode button[type=submit]').click();
  await expect.poll(() => said(page)).toContainEqual(expect.stringContaining('Step 2 of 2: sign up or log in'));
});

/** The browser's own speech engine, faked before the page loads. allow: false imitates autoplay blocking: speech
 *  fails with "not-allowed" until the learner clicks or presses a key on this page. */
function browserSpeech(page, { allow = true } = {}) {
  return page.addInitScript(allow => {
    window.__said = []; let ok = allow;
    const unlock = () => { ok = true; };
    document.addEventListener('click', unlock, true); document.addEventListener('keydown', unlock, true);
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: function (text) { this.text = text; } });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      speaking: false, getVoices: () => [], cancel() {}, pause() {}, resume() {},
      speak(u) { setTimeout(() => { if (!ok) { if (u.onerror) u.onerror({ error: 'not-allowed' }); return; } window.__said.push(u.text); if (u.onend) u.onend(); }, 20); }
    } });
  }, allow);
}
const interactedThisSession = page => page.addInitScript(() => sessionStorage.setItem('sj-interacted', '1'));

test('a new page, after the learner has interacted with the site in this session: the summary plays at once, no prompt', async ({ page }) => {
  await freshStart(page, { lang: 'en', prefs: { autoRead: 'on' } });
  await interactedThisSession(page);
  await browserSpeech(page);
  await at(page, '/jobs.html');
  await expect.poll(() => said(page)).toEqual([expect.stringContaining('Jobs. First a checkbox')]);
  await expect(page.locator('#sj-hear')).toHaveCount(0);
});

test('only when the browser blocks it is the prompt shown; a tap then reads the page', async ({ page }) => {
  await freshStart(page, { lang: 'en', prefs: { autoRead: 'on' } });
  await interactedThisSession(page);
  await browserSpeech(page, { allow: false });
  await at(page, '/jobs.html');
  await expect(page.locator('#sj-hear')).toHaveText('Tap anywhere or press any key to hear this page');
  expect(await said(page)).toEqual([]);
  await page.locator('h1').first().click();
  await expect.poll(() => said(page)).toEqual([expect.stringContaining('Jobs. First a checkbox')]);
  await expect(page.locator('#sj-hear')).toHaveCount(0);
});

test('the first interaction is remembered for the session, so the next page tries to read at once', async ({ page }) => {
  await freshStart(page, { lang: 'en', prefs: { autoRead: 'on' } });
  await browserSpeech(page);
  await at(page, '/jobs.html');
  await expect(page.locator('#sj-hear')).toBeVisible(); // no interaction with the site yet in this session
  expect(await said(page)).toEqual([]);
  await page.keyboard.press('Tab'); // Tab never starts audio
  expect(await said(page)).toEqual([]);
  await page.locator('h1').first().click();
  await expect.poll(() => said(page)).toEqual([expect.stringContaining('Jobs. First a checkbox')]);
  expect(await page.evaluate(() => sessionStorage.getItem('sj-interacted'))).toBe('1');
  await at(page, '/settings.html');
  await expect.poll(() => said(page)).toEqual([expect.stringContaining('Accessibility settings:')]);
  await expect(page.locator('#sj-hear')).toHaveCount(0);
});

test('"Now reading… Pause · Stop" is pinned to the bottom only while audio plays; Escape stops the sound at once', async ({ page }) => {
  await freshStart(page, { lang: 'en', prefs: { autoRead: 'on', easy: true } });
  await at(page, '/jobs.html');
  await fakeVoice(page, 5000);
  await expect(playBar(page)).toBeHidden(); // nothing playing: no controls
  await page.locator('h1').first().click();
  await expect.poll(() => page.evaluate(() => window.SavannaOnboarding.player.state)).toBe('playing');
  const bar = playBar(page);
  await expect(bar).toBeVisible();
  await expect(bar.locator('[role=status]')).toHaveText('Now reading…');
  await bar.getByRole('button', { name: 'Pause' }).click();
  await expect(bar.getByRole('button', { name: 'Resume' })).toBeVisible();
  await bar.getByRole('button', { name: 'Resume' }).click();
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.SavannaOnboarding.player.state)).toBe('idle');
  await expect(bar).toBeHidden();
});

test('"Automatic reading" is one switch, in the Accessibility panel and in Settings, and is remembered', async ({ page }) => {
  await freshStart(page, { lang: 'en', prefs: { autoRead: 'on', easy: true } });
  await at(page, '/index.html');
  await fakeVoice(page);
  const panel = await accessibilityPanel(page);
  const reading = panel.locator('.sj-tog[data-tog=reading]');
  await expect(reading).toHaveText(/Automatic reading/);
  await expect(reading).toHaveAttribute('aria-pressed', 'true');
  await reading.click();
  await expect(reading).toHaveAttribute('aria-pressed', 'false');
  await expect(reading).toBeFocused();
  expect(await prefs(page)).toMatchObject({ autoRead: 'off', easy: false });
  await expect(page.locator('#sj-hear')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await pick(page, 'read_type'); await page.locator('#sj-mode button[type=submit]').click();
  expect(await said(page)).toEqual([]); // nothing read
  await at(page, '/settings.html');
  await expect(page.locator('#sj-hear')).toHaveCount(0);
  const group = page.getByRole('group', { name: 'Automatic reading' });
  await expect(group.getByRole('radio', { name: 'Off' })).toBeChecked();
  await group.getByRole('radio', { name: 'On' }).check();
  expect(await prefs(page)).toMatchObject({ autoRead: 'on', easy: true });
  await expect((await accessibilityPanel(page)).locator('.sj-tog[data-tog=reading]')).toHaveAttribute('aria-pressed', 'true'); // panel and Settings agree
});

test('sound blocked or missing: no errors, and everything stays written', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    delete window.speechSynthesis; delete window.SpeechSynthesisUtterance;
    HTMLMediaElement.prototype.play = function () { return Promise.reject(new DOMException('blocked', 'NotAllowedError')); };
  });
  await freshStart(page, { lang: 'en', prefs: { autoRead: 'ask' } });
  await at(page, '/index.html');
  await page.locator('#sj-hear').click();
  await pick(page, 'read_type'); await page.locator('#sj-mode button[type=submit]').click();
  await expect(summary(page)).toContainText('Step 2 of 2');
  expect(errors).toEqual([]);
});

test('English only for now: no summary and no prompt in Amharic', async ({ page }) => {
  await freshStart(page, { lang: 'am', prefs: { autoRead: 'ask' } });
  await at(page, '/index.html');
  await expect(page.locator('#sj-hear')).toHaveCount(0);
  await expect(summary(page)).toBeHidden();
});

// ---- Fix 3 (15 Nov evening): automatic reading every time a page or step opens, not only once per page
test('a page is read every time it opens, also when the learner comes back to it', async ({ page }) => {
  await freshStart(page, { lang: 'en', prefs: { autoRead: 'on', easy: true } });
  await interactedThisSession(page);
  await browserSpeech(page);
  await at(page, '/jobs.html');
  await expect.poll(() => said(page)).toEqual([expect.stringContaining('Jobs. First a checkbox')]);
  await at(page, '/settings.html');
  await expect.poll(() => said(page)).toEqual([expect.stringContaining('Accessibility settings:')]);
  await page.goBack(); await page.waitForFunction(() => !!window.SavannaOnboarding);
  await expect.poll(() => said(page)).toContainEqual(expect.stringContaining('Jobs. First a checkbox')); // read again on return
  await at(page, '/jobs.html'); // and again on a fresh visit
  await expect.poll(() => said(page)).toEqual([expect.stringContaining('Jobs. First a checkbox')]);
});

test('every form step is read when it opens, also after Back', async ({ page }) => {
  await freshStart(page, { lang: 'en', prefs: { autoRead: 'on', easy: true, mode: 'read_type' } });
  await interactedThisSession(page);
  await browserSpeech(page);
  await at(page, '/signup.html');
  await page.waitForSelector('.dm-q');
  await expect.poll(() => said(page)).toContainEqual(expect.stringContaining('Step 1 of 5'));
  expect(await said(page)).toContain('Who is filling in this form?'); // then the question and its answers
  await pick(page, 'self'); await next(page);
  await expect.poll(() => said(page)).toContainEqual(expect.stringContaining('Step 2 of 5'));
  await page.locator('[data-act=back]').click();
  await expect.poll(async () => (await said(page)).filter(t => t.includes('Step 1 of 5')).length).toBe(2); // Back: read again
});

test('turning automatic reading off stops the sound at once; turning it on again reads the current page at once', async ({ page }) => {
  await freshStart(page, { lang: 'en', prefs: { autoRead: 'on', easy: true } });
  await interactedThisSession(page);
  await page.addInitScript(() => { // a slow voice, so it is still speaking when switched off
    window.__said = []; window.__cancels = 0;
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: function (text) { this.text = text; } });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      speaking: false, getVoices: () => [], cancel() { window.__cancels++; clearTimeout(window.__t); }, pause() {}, resume() {},
      speak(u) { window.__said.push(u.text); window.__t = setTimeout(() => u.onend && u.onend(), 5000); }
    } });
  });
  await at(page, '/jobs.html');
  await expect.poll(() => page.evaluate(() => window.SavannaOnboarding.player.state)).toBe('playing');
  const panel = await accessibilityPanel(page);
  const reading = panel.locator('.sj-tog[data-tog=reading]');
  await reading.click(); // off
  expect(await page.evaluate(() => window.SavannaOnboarding.player.state)).toBe('idle');
  expect(await page.evaluate(() => window.__cancels)).toBeGreaterThan(0);
  await expect(playBar(page)).toBeHidden();
  await page.evaluate(() => { window.__said = []; });
  await reading.click(); // on again
  await expect.poll(() => said(page)).toEqual([expect.stringContaining('Jobs. First a checkbox')]);
  await expect(reading).toHaveAttribute('aria-pressed', 'true');
});
