// Team fixes (15 Nov evening): job card spacing; reading order (recording, Addis AI, phone voice, then one plain
// message); mixed-language job text; "Listen to this job" on the shared player; reading back what was heard or typed
// (names, phone numbers in groups, Spell it), the ID number only on request and on the phone only, "Read all my
// answers". Speech services are faked or mocked: no real calls.
import { test, expect } from '@playwright/test';
import { freshStart, go, pick, next, signupTo, identityTo, fakeSpeechEngine, say, speakAnswer, playBar } from './helpers.mjs';

test.use({ serviceWorkers: 'block' });
const at = (page, path) => page.goto(path).then(() => page.waitForFunction(() => !!window.SavannaOnboarding));

/** A fake phone voice that records each piece with its language and whether it had to stay on the phone. */
async function fakeVoice(page, { ms = 20, voice = true } = {}) {
  await page.evaluate(([ms, voice]) => {
    window.__said = []; window.__seq = window.__seq || [];
    window.SavannaOnboarding.setSpeech({ output: {
      speak: (text, lang, url, done, opts) => {
        if (!voice) return false;
        window.__said.push({ text, lang, local: !!(opts && opts.local) }); window.__seq.push(lang + ':' + text);
        window.__t = setTimeout(() => done && done(), ms); return true;
      },
      stop: () => clearTimeout(window.__t), pause() {}, resume() {}
    } });
  }, [ms, voice]);
}
const said = page => page.evaluate(() => window.__said.map(x => x.text));
/** Logs which audio files the page plays (recordings and Addis AI clips), in order with the voice pieces. */
async function audioLog(page) {
  await page.addInitScript(() => {
    window.__clips = []; window.__seq = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { const n = this.src.startsWith('blob:') ? 'blob' : this.src.split('/').pop(); window.__clips.push(n); window.__seq.push('audio:' + n); return play.call(this); };
  });
}

test('job cards: at least 16px between the support pills and the buttons, and space between pill rows (also at 200% and 400% zoom)', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  for (const width of [1280, 640, 320]) { // 640 = 200% zoom of a 1280px window, 320 = 400%
    await page.setViewportSize({ width, height: 800 });
    await at(page, '/jobs.html');
    const gaps = await page.locator('.job').evaluateAll(cards => cards.map(c => {
      const pills = [...c.querySelectorAll('.needs li')].map(li => li.getBoundingClientRect());
      const actions = c.querySelector('.actions').getBoundingClientRect();
      const rows = [...new Set(pills.map(r => Math.round(r.top)))].sort((a, b) => a - b);
      const rowGaps = rows.slice(1).map((top, i) => top - Math.max(...pills.filter(r => Math.round(r.top) === rows[i]).map(r => r.bottom)));
      return { pillsToButtons: actions.top - Math.max(...pills.map(r => r.bottom)), minRowGap: rowGaps.length ? Math.min(...rowGaps) : null };
    }));
    expect(gaps.length).toBeGreaterThan(0);
    for (const g of gaps) {
      expect(g.pillsToButtons, `pills to buttons at ${width}px`).toBeGreaterThanOrEqual(16);
      if (g.minRowGap !== null) expect(g.minRowGap, `between pill rows at ${width}px`).toBeGreaterThanOrEqual(8);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `no sideways scrolling at ${width}px`).toBeLessThanOrEqual(width);
  }
});

test('"Listen to this job": the shared player, "Stop listening" while it plays, another job stops the first, Escape stops', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/jobs.html');
  await fakeVoice(page, { ms: 4000 });
  const [first, second] = [page.locator('[data-listen]').nth(0), page.locator('[data-listen]').nth(1)];
  await expect(first).toHaveAttribute('aria-pressed', 'false');
  await first.click();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(first).toContainText('Stop listening');
  await expect(playBar(page)).toBeVisible();
  await expect(playBar(page).locator('[role=status]')).toHaveText('Now reading…');
  await second.click(); // another job stops the first
  await expect(first).toHaveAttribute('aria-pressed', 'false');
  await expect(first).toContainText('Listen to this job');
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(second).toHaveAttribute('aria-pressed', 'false');
  await expect(playBar(page)).toBeHidden();
  await first.click(); await expect(first).toHaveAttribute('aria-pressed', 'true');
  await first.click(); // "Stop listening"
  await expect(first).toHaveAttribute('aria-pressed', 'false');
});

test('mixed languages: an Amharic page reads the English job text in English and the Amharic labels through Addis AI, in order', async ({ page }) => {
  await freshStart(page, { lang: 'am', remote: true });
  await audioLog(page);
  const tts = [];
  await page.route('**/api/tts', r => { tts.push(JSON.parse(r.request().postData())); return r.fulfill({ status: 200, contentType: 'audio/wav', body: Buffer.from('RIFF$\u0000\u0000\u0000WAVEfmt \u0010\u0000\u0000\u0000\u0001\u0000\u0001\u0000@\u001f\u0000\u0000@\u001f\u0000\u0000\u0001\u0000\b\u0000data\u0000\u0000\u0000\u0000', 'binary') }); });
  await at(page, '/jobs.html');
  await fakeVoice(page);
  await page.locator('[data-listen]').first().click();
  await expect.poll(() => page.evaluate(() => window.SavannaOnboarding.player.state), { timeout: 10000 }).toBe('idle');
  const seq = await page.evaluate(() => window.__seq);
  const english = seq.filter(x => x.startsWith('en:'));
  expect(english.length).toBe(3); // title, organisation and place, description: in English
  expect(tts.every(x => x.lang === 'am')).toBe(true); // only the Amharic parts went to Addis AI
  expect(tts.map(x => x.text)).toEqual(expect.arrayContaining([expect.stringMatching(/^ይህ ሥራ የሚሰጣቸው ድጋፎች/)]));
  // order: title, org, (Amharic work mode), description, (Amharic support list)
  expect(seq.map(x => x.startsWith('en:') ? 'en' : 'am')).toEqual(['en', 'en', 'am', 'en', 'am']);
});

for (const [lang, msg] of [['en', 'Reading aloud isn\'t available right now. Everything is written on the screen.'], ['am', 'ጮክ ብሎ ማንበብ አሁን አይገኝም። ሁሉም ነገር በማያ ገጹ ላይ ተጽፏል።'], ['om', 'Sagaleen dubbisuun amma hin jiru. Wanti hundi iskiriinii irratti barreeffameera.']]) {
  test(`nothing can read (no recording, no online voice, no phone voice): one plain message (${lang})`, async ({ page }) => {
    await freshStart(page, { lang });
    await page.route('**/assets/audio/manifest.json', r => r.fulfill({ contentType: 'application/json', body: '{}' }));
    await signupTo(page, 'filler');
    await fakeVoice(page, { voice: false });
    await page.locator('[data-act=listen]').click();
    await expect(page.locator('.dm-status')).toHaveText(msg);
    await expect(page.locator('.dm-status')).not.toContainText(/not installed|አልተጫነም/);
  });
}

test.describe('reading back what was heard or typed', () => {
  test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); });

  test('a spoken name: "I heard: …", then the three choices; "Spell it" spells it letter by letter', async ({ page }) => {
    await fakeSpeechEngine(page);
    await signupTo(page, 'name');
    await fakeVoice(page);
    await say(page, { alts: ['Abebe Kebede'] });
    await speakAnswer(page);
    await expect.poll(() => said(page)).toEqual(['I heard:', 'Abebe Kebede', 'Choose Use this answer, Say it again, or Type it instead.']);
    await page.getByRole('button', { name: 'Spell it' }).click();
    await expect.poll(async () => (await said(page)).slice(-1)).toEqual(['A, B, E, B, E, K, E, B, E, D, E']);
  });

  test('an Ethiopic name is spelled syllable by syllable, in Amharic', async ({ page }) => {
    await fakeSpeechEngine(page);
    await signupTo(page, 'name');
    await fakeVoice(page);
    await say(page, { alts: ['አበበ'] });
    await speakAnswer(page);
    await page.getByRole('button', { name: 'Spell it' }).click();
    await expect.poll(() => page.evaluate(() => window.__said.slice(-1)[0])).toEqual({ text: 'አ, በ, በ', lang: 'am', local: false });
  });

  test('a spoken phone number is read back digit by digit in groups', async ({ page }) => {
    await fakeSpeechEngine(page);
    await signupTo(page, 'phone');
    await fakeVoice(page);
    await say(page, { alts: ['0911234567'] });
    await speakAnswer(page);
    await expect.poll(() => said(page)).toEqual(['I heard:', 'zero nine eleven, twenty-three, forty-five, sixty-seven', 'Choose Use this answer, Say it again, or Type it instead.']);
  });

  test('"Read back my answer" on typed names and phone numbers', async ({ page }) => {
    await signupTo(page, 'phone');
    await fakeVoice(page);
    await page.getByRole('button', { name: 'Read back my answer' }).click();
    await expect.poll(() => said(page)).toEqual(['Nothing is typed yet.']);
    await page.fill('[data-ref=input]', '0911 23 45 67');
    await page.getByRole('button', { name: 'Read back my answer' }).click();
    await expect.poll(() => said(page)).toEqual(['Nothing is typed yet.', 'Your answer:', 'zero nine eleven, twenty-three, forty-five, sixty-seven']);
    await expect(playBar(page)).toHaveCount(1); // the same player (Pause, Stop, Escape)
  });

  test('the ID number: read back only on request, after "People near you may hear this", on the phone only', async ({ page }) => {
    const cloud = [];
    await page.route('**/api/tts', r => { cloud.push(r.request().postData()); return r.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"not_configured"}' }); });
    await identityTo(page, 'id_number');
    await expect(page.locator('[data-act=speak]')).toHaveCount(0); // never spoken
    await fakeVoice(page);
    await page.fill('[data-ref=input]', 'FA12');
    const btn = page.getByRole('button', { name: 'Read back the number' });
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-ref=idnote]')).toContainText('People near you may hear this.');
    expect(await said(page)).toEqual([]); // nothing yet
    await page.getByRole('button', { name: 'Read it aloud' }).click();
    await expect.poll(() => page.evaluate(() => window.__said)).toEqual([
      { text: 'Your answer:', lang: 'en', local: true }, { text: 'F', lang: 'en', local: true }, { text: 'A', lang: 'en', local: true },
      { text: 'one', lang: 'en', local: true }, { text: 'two', lang: 'en', local: true }]);
    expect(cloud).toEqual([]); // never to an online voice
  });

  test('"Read all my answers" on Check your answers: phone in groups; the ID number only if the learner confirms', async ({ page }) => {
    await signupTo(page, 'END');
    await fakeVoice(page);
    await page.getByRole('button', { name: 'Read all my answers' }).click();
    await expect.poll(async () => (await said(page)).join(' | ')).toContain('What is your phone number? | zero nine eleven, twenty-three, forty-five, sixty-seven');
    expect((await said(page)).join(' | ')).toContain('Abebe Kebede');
    // the ID form, with a number typed
    await identityTo(page, 'id_number');
    await page.fill('[data-ref=input]', '77');
    await next(page);
    await fakeVoice(page);
    const all = page.getByRole('button', { name: 'Read all my answers' });
    await all.click();
    await expect(page.locator('[data-ref=readallq]')).toContainText('Your ID number is in these answers. People near you may hear it.');
    await page.getByRole('button', { name: 'Read without it' }).click();
    await expect.poll(async () => (await said(page)).length).toBeGreaterThan(0);
    expect(await said(page)).not.toContain('seven');
    await all.click();
    await page.getByRole('button', { name: 'Read with my ID number' }).click();
    await expect.poll(() => page.evaluate(() => window.__said.filter(x => x.text === 'seven').map(x => x.local))).toEqual([true, true]);
  });
});

test('the ID number in Amharic uses the recorded digits (Mekdes), never the online voice', async ({ page }) => {
  await freshStart(page, { lang: 'am', remote: true });
  await audioLog(page);
  const cloud = [];
  await page.route('**/api/tts', r => { cloud.push(r.request().postData()); return r.fulfill({ status: 200, contentType: 'audio/mpeg', body: 'x' }); });
  await identityTo(page, 'id_number');
  await fakeVoice(page);
  await page.fill('[data-ref=input]', '205');
  await page.locator('[data-act=readback-id]').click();
  await page.locator('[data-act=readback-id-go]').click();
  await expect.poll(() => page.evaluate(() => window.__clips), { timeout: 10000 }).toEqual(['num-2.mp3', 'num-0.mp3', 'num-5.mp3']);
  expect(cloud).toEqual([]);
});

test('phone numbers the Ethiopian way: shown 0911 23 45 67, read in natural numbers, on the phone only (never the online voice)', async ({ page }) => {
  await freshStart(page, { lang: 'am', remote: true });
  await audioLog(page);
  const cloud = [];
  await page.route('**/api/tts', r => { cloud.push(r.request().postData()); return r.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"not_configured"}' }); });
  await signupTo(page, 'phone');
  await expect(page.locator('.dm-hint').first()).toContainText('0911 23 45 67'); // the example
  await fakeVoice(page);
  await page.fill('[data-ref=input]', '0911234567');
  await page.locator('[data-act=readback]').click();
  await expect.poll(() => page.evaluate(() => window.__clips), { timeout: 15000 }).toEqual(['num-0.mp3', 'num-9.mp3', 'num-11.mp3', 'num-23.mp3', 'num-45.mp3', 'num-67.mp3']);
  expect(cloud.filter(x => /0911|23|45|67/.test(x))).toEqual([]); // the number never went to the online voice
  await next(page); await next(page); await pick(page, 'yes'); await next(page);
  await expect(page.locator('.dm-review')).toContainText('0911 23 45 67'); // shown the Ethiopian way
});

for (const [lang, words] of [['en', 'zero nine eleven, twenty-three, forty-five, sixty-seven'], ['om', 'zeeroo sagal kudha tokko, digdamii sadii, afurtamii shan, jaatamii torba']]) {
  test(`a typed phone number is read in natural numbers in ${lang}, by a voice on the phone`, async ({ page }) => {
    await freshStart(page, { lang });
    await signupTo(page, 'phone');
    await fakeVoice(page);
    await page.fill('[data-ref=input]', '0911234567');
    await page.locator('[data-act=readback]').click();
    await expect.poll(() => page.evaluate(() => window.__said.slice(-1)[0])).toEqual({ text: words, lang, local: true });
  });
}
