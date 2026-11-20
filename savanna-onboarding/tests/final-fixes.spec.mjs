// Final fixes before the pitch (20 Nov): (1) the calendar choice on the date is said, and the next step announced;
// (2) "Skip this question" on optional questions; (3) "Finish later": Copy link, and the code on its own line, read
// letter by letter on the phone only.
import { test, expect } from '@playwright/test';
import { freshStart, go, pick, next, signupTo, heading } from './helpers.mjs';

/** A fake phone voice that records each piece (text, language, phone-only). */
async function fakeVoice(page) {
  await page.evaluate(() => {
    window.__said = [];
    window.SavannaOnboarding.setSpeech({ output: {
      speak: (text, lang, url, done, opts) => { window.__said.push({ text, lang, local: !!(opts && opts.local) }); window.__t = setTimeout(() => done && done(), 10); return true; },
      stop: () => clearTimeout(window.__t), pause() {}, resume() {}
    } });
  });
}
const said = page => page.evaluate(() => window.__said.map(x => x.text));
const status = page => page.locator('.dm-form .dm-status, .dm-status').first();

test.describe('1. date of birth: the calendar choice', () => {
  test('reading off: nothing is spoken, but "Now enter the day, month and year." is announced in the status region', async ({ page }) => {
    await freshStart(page, { lang: 'en' });
    await signupTo(page, 'dob');
    await fakeVoice(page);
    await pick(page, 'greg');
    await expect(page.locator('input[name=cal][value=greg]')).toBeFocused();
    await expect(page.locator('.dm-status')).toHaveText('Now enter the day, month and year.');
    await expect(page.locator('.dm-status')).toHaveAttribute('role', 'status');
    expect(await said(page)).toEqual([]);
  });

  test('reading on: "Selected: Gregorian (European) calendar", then the next step', async ({ page }) => {
    await freshStart(page, { lang: 'en', prefs: { autoRead: 'on' } });
    await signupTo(page, 'dob', 'listen');
    await fakeVoice(page);
    await pick(page, 'greg');
    await expect.poll(async () => (await said(page)).slice(-3)).toEqual(['Selected:', 'Gregorian (European) calendar', 'Now enter the day, month and year.']);
    await pick(page, 'eth');
    await expect.poll(async () => (await said(page)).slice(-3)).toEqual(['Selected:', 'Ethiopian calendar', 'Now enter the day, month and year.']);
  });

  test('Amharic, reading on: the recorded clips (selected, the calendar, the next step) and the sentence in the status region', async ({ page }) => {
    test.setTimeout(90000); // real clips play in full
    await freshStart(page, { lang: 'am', prefs: { autoRead: 'on' } });
    await page.addInitScript(() => {
      window.__clips = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () { window.__clips.push(this.src.split('/').pop()); return play.call(this); };
    });
    await signupTo(page, 'dob', 'listen');
    await page.evaluate(() => { window.__clips.length = 0; });
    await pick(page, 'greg');
    await expect(page.locator('.dm-status')).toHaveText('አሁን ቀን፣ ወር እና ዓመት ያስገቡ።');
    // "Selected:" may play from the copy the player already holds in memory (a blob: address), so only its place is checked
    await expect.poll(() => page.evaluate(() => window.__clips.slice(-2)), { timeout: 30000 }).toEqual(['signup-dob-option-greg.mp3', 'msg-date-next.mp3']);
    expect((await page.evaluate(() => window.__clips.slice(-3)[0]))).toMatch(/^(msg-selected\.mp3|[0-9a-f-]{36})$/);
  });
});

test.describe('2. Skip this question', () => {
  test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); });

  test('only on optional questions; Continue stays first and primary', async ({ page }) => {
    await signupTo(page, 'name');
    await expect(page.getByRole('button', { name: 'Skip this question' })).toHaveCount(0); // the name is required
    await page.fill('[data-ref=input]', 'Abebe'); await next(page);
    await page.fill('[data-ref=input]', '0911234567'); await next(page);
    expect(await heading(page)).toContain('When were you born?');
    const actions = page.locator('.dm-form .dm-actions button');
    await expect(actions.nth(0)).toHaveText('Continue');
    await expect(actions.nth(0)).toHaveClass(/dm-primary/);
    await expect(actions.nth(1)).toHaveText('Skip this question');
    await expect(actions.nth(1)).not.toHaveClass(/dm-primary/);
    // keyboard: Continue comes before Skip
    await actions.nth(0).focus(); await page.keyboard.press('Tab');
    await expect(actions.nth(1)).toBeFocused();
    const box = await actions.nth(1).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('clears what was typed, moves on, shows "Skipped" on Check your answers; Change still works; nothing is sent for it', async ({ page }) => {
    await signupTo(page, 'dob');
    await page.selectOption('[data-ref=m]', '3'); // a partly given date
    await page.getByRole('button', { name: 'Skip this question' }).click();
    expect(await heading(page)).toBe('Do you agree to how we keep your answers?'); // the consent question
    await pick(page, 'yes'); await next(page);
    expect(await heading(page)).toBe('Check your answers');
    const row = page.locator('.dm-review > div', { hasText: 'When were you born?' });
    await expect(row.locator('dd').first()).toHaveText('Skipped');
    // Change: back to the date, empty; then the summary again
    await row.locator('[data-act=change]').click();
    expect(await heading(page)).toContain('When were you born?');
    await expect(page.locator('[data-ref=m]')).toHaveValue('');
    await next(page); // Continue with nothing: as before
    expect(await heading(page)).toBe('Check your answers');
    const ev = page.evaluate(() => new Promise(r => document.addEventListener('savanna-onboarding:complete', e => r(e.detail), { once: true })));
    await next(page);
    const d = await ev;
    expect(d.answers.dob).toBeUndefined();
    expect(Object.keys(d.answers).sort()).toEqual(['consent', 'filler', 'name', 'phone']);
  });

  test('a skipped question answered later is no longer "Skipped"', async ({ page }) => {
    await signupTo(page, 'dob');
    await page.getByRole('button', { name: 'Skip this question' }).click();
    await page.locator('[data-act=back]').first().click();
    expect(await heading(page)).toContain('When were you born?');
    await page.selectOption('[data-ref=input]', '5'); await page.selectOption('[data-ref=m]', '3'); await page.selectOption('[data-ref=y]', '2000');
    await next(page); await pick(page, 'yes'); await next(page);
    await expect(page.locator('.dm-review > div', { hasText: 'When were you born?' }).locator('dd').first()).toContainText('2000');
  });

});

test('2. Skip in Amharic: labels; the spoken summary names the button', async ({ page }) => {
  await freshStart(page, { lang: 'am' });
  await signupTo(page, 'dob');
  await expect(page.getByRole('button', { name: 'ይህን ጥያቄ እለፍ' })).toHaveCount(1);
  const cat = await page.evaluate(() => window.SavannaOnboarding.speechCatalog('am').filter(x => x.key === 'sum-skip').map(x => x.text));
  expect(cat).toEqual(['«ይህን ጥያቄ እለፍ»ን በመጫን መዝለል ይችላሉ።']);
  await page.getByRole('button', { name: 'ይህን ጥያቄ እለፍ' }).click();
  await pick(page, 'yes'); await next(page);
  await expect(page.locator('.dm-review')).toContainText('ተዘሏል');
});

test.describe('3. Finish later', () => {
  async function later(page) {
    await signupTo(page, 'name');
    await page.locator('[data-act=later]').click();
    await expect(page.locator('.dm-q')).toHaveText('Your answers are saved');
  }

  test('Copy link: a real button before Continue, copies the link, says "Link copied." in the status region', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await freshStart(page, { lang: 'en' });
    await later(page);
    const copy = page.getByRole('button', { name: 'Copy link' });
    await expect(copy).toHaveCount(1);
    expect((await copy.boundingBox()).height).toBeGreaterThanOrEqual(44);
    // tab order: the link, Copy link, then Continue
    await copy.focus(); await page.keyboard.press('Tab');
    await expect(page.locator('[data-act=resume]')).toBeFocused();
    await copy.press('Enter');
    await expect(page.locator('.dm-status')).toHaveText('Link copied.');
    const link = await page.locator('[data-ref=resume-link]').innerText();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);
    expect(link).toMatch(/\?resume=[A-Z0-9]{6}/);
  });

  test('without a clipboard (e.g. an Android WebView): the link is selected instead, and that is said', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }); document.execCommand = () => false; });
    await freshStart(page, { lang: 'en' });
    await later(page);
    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.locator('.dm-status')).toHaveText("The link is selected. Copy it from your phone's menu.");
    expect(await page.evaluate(() => String(window.getSelection()))).toBe(await page.locator('[data-ref=resume-link]').innerText());
  });

  test('the code on its own line; read letter by letter on the phone only (never an online voice); "Link copied." read aloud', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await freshStart(page, { lang: 'en', prefs: { autoRead: 'on' } });
    await signupTo(page, 'name', 'listen');
    await fakeVoice(page);
    await page.locator('[data-act=later]').click();
    const line = page.locator('.dm-code');
    await expect(line).toHaveText(/^Your code: [A-Z0-9]{6}$/);
    const code = (await line.locator('strong').innerText()).trim();
    expect(page.url() + (await page.locator('[data-ref=resume-link]').innerText())).toContain('?resume=' + code);
    const spelled = code.split('').join(', ');
    await expect.poll(() => page.evaluate(() => window.__said.slice(-2))).toEqual([{ text: 'Your code:', lang: 'en', local: false }, { text: spelled, lang: 'en', local: true }]);
    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect.poll(async () => (await said(page)).slice(-1)).toEqual(['Link copied.']);
  });

  test('Amharic: "ኮድዎ፦", "ሊንኩን ቅዳ", "ሊንኩ ተቀድቷል።"; the code letters never go to the online voice', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await freshStart(page, { lang: 'am', prefs: { autoRead: 'on' }, remote: true });
    const cloud = [];
    await page.route('**/api/tts', r => { cloud.push(r.request().postDataJSON()); return r.fulfill({ status: 200, contentType: 'audio/mpeg', body: 'x' }); });
    await signupTo(page, 'name', 'listen');
    await fakeVoice(page);
    await page.locator('[data-act=later]').click();
    await expect(page.locator('.dm-code')).toHaveText(/^ኮድዎ፦ [A-Z0-9]{6}$/);
    const code = (await page.locator('.dm-code strong').innerText()).trim();
    await expect.poll(() => page.evaluate(() => window.__said.filter(x => x.local).map(x => x.text)), { timeout: 30000 }).toEqual([code.split('').join(', ')]);
    await page.getByRole('button', { name: 'ሊንኩን ቅዳ' }).click();
    await expect(page.locator('.dm-status')).toHaveText('ሊንኩ ተቀድቷል።');
    expect(cloud.map(c => c.text).join(' ')).not.toContain(code[0] + ', ');
  });
});
