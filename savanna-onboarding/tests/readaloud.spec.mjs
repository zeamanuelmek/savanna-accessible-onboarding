// Phase 4: low literacy and read aloud. A Listen button on every answer, Pause / Stop / Play again, read aloud and
// pictures as separate settings, recorded clips found by their names in docs/audio-script.md, clear text when a clip
// is missing or fails, and audio never required.
import { test, expect } from '@playwright/test';
import { freshStart, go, pick, next, heading, signupTo } from './helpers.mjs';

/** A fake phone voice: records what it was asked to read; each piece "finishes" after `ms`. voice:false = no voice. */
async function fakeVoice(page, { ms = 400, voice = true } = {}) {
  await page.evaluate(([ms, voice]) => {
    window.__said = [];
    window.SavannaOnboarding.setSpeech({ output: {
      speak: (text, lang, url, done) => { if (!voice) return false; window.__said.push(text); window.__t = setTimeout(() => done && done(), ms); return true; },
      stop: () => clearTimeout(window.__t), pause: () => {}, resume: () => {}
    } });
  }, [ms, voice]);
}
const said = page => page.evaluate(() => window.__said);

/** A real, tiny WAV file served as a clip, and a log of every clip the browser was asked to play. */
function wav(ms = 300) {
  const rate = 8000, n = Math.round(rate * ms / 1000), b = Buffer.alloc(44 + n);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate, 28); b.writeUInt16LE(1, 32);
  b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40); b.fill(128, 44); return b;
}
async function clips(page, manifest, { broken = [] } = {}) {
  await page.route('**/assets/audio/manifest.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(manifest) }));
  await page.route(/assets\/audio\/(am|en)\/[^/]+\.(mp3|m4a)$/, r => {
    const name = r.request().url().split('/').pop();
    if (broken.includes(name)) return r.fulfill({ status: 404, body: '' });
    return r.fulfill({ contentType: 'audio/wav', body: wav() });
  });
  await page.addInitScript(() => {
    window.__clips = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { window.__clips.push(this.src.split('/').pop()); return play.call(this); };
  });
}

// These tests replace files on their way to the page; requests through a service worker would skip that.
test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); });

test('every answer has its own Listen button when read aloud is on, named after the answer', async ({ page }) => {
  await signupTo(page, 'filler');
  await expect(page.locator('[data-act=play-opt]')).toHaveCount(0); // "Read and type": off
  await page.locator('[data-act=easy]').click();
  await expect(page.locator('[data-act=play-opt]')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Listen: Me, for myself' })).toHaveCount(1);
  await fakeVoice(page);
  await page.getByRole('button', { name: 'Listen: A partner organisation, together with the learner' }).click();
  // (turning read aloud on may also have started reading the question; the option is what is read last, and alone)
  await expect.poll(async () => (await said(page)).slice(-1)).toEqual(['A partner organisation, together with the learner']);
  expect((await said(page)).filter(t => t !== 'Who is filling in this form?')).toEqual(['A partner organisation, together with the learner']);
  await expect(page.locator('input[value=partner]')).not.toBeChecked(); // listening never chooses for you
});

test('Listen reads the question and each answer; Pause, Resume, Stop and Play again work', async ({ page }) => {
  await signupTo(page, 'filler');
  await fakeVoice(page, { ms: 600 });
  const player = page.locator('[data-ref=player]');
  await expect(player).toBeHidden();
  await page.locator('[data-act=listen]').click();
  await expect(player).toBeVisible();
  await expect(page.locator('[data-act=pause]')).toHaveText(/Pause/);
  await page.locator('[data-act=pause]').click();
  await expect(page.locator('[data-act=pause]')).toHaveText(/Resume/);
  expect(await page.evaluate(() => window.SavannaOnboarding.player.state)).toBe('paused');
  await page.locator('[data-act=pause]').click();
  await expect(page.locator('[data-act=pause]')).toHaveText(/Pause/);
  await page.locator('[data-act=stop-audio]').click();
  await expect(page.locator('[data-act=listen]')).toBeFocused();
  await expect(page.locator('[data-act=replay]')).toBeVisible();
  await expect(page.locator('[data-act=pause]')).toBeHidden();
  await page.evaluate(() => { window.__said = []; });
  await page.locator('[data-act=replay]').click();
  await expect.poll(() => said(page), { timeout: 5000 }).toEqual(['Who is filling in this form?', 'Me, for myself', 'A partner organisation, together with the learner']);
});

test('read aloud in easy mode reads each new question with Pause and Stop showing, and Escape stops it (WCAG 1.4.2)', async ({ page }) => {
  await go(page, '#/signup');
  await fakeVoice(page, { ms: 2000 });
  await pick(page, 'listen'); await next(page); // "Listen and respond": read aloud on
  await expect.poll(() => said(page)).toContain('Who is filling in this form?');
  await expect(page.locator('[data-act=stop-audio]')).toBeVisible();
  await expect(page.locator('[data-act=pause]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.SavannaOnboarding.player.state)).toBe('idle');
  await expect(page.locator('[data-act=stop-audio]')).toBeHidden();
});

test('read aloud and pictures are separate settings', async ({ page }) => {
  await go(page, '#/settings');
  await expect(page.locator('fieldset', { hasText: 'Read aloud' })).toHaveCount(1);
  await expect(page.locator('fieldset', { hasText: 'Pictures and bigger buttons' })).toHaveCount(1);
  await page.locator('.dm-opt:has(input[name=pictures][value=on])').click();
  await go(page, '#/passport'); // no welcome screen here (choosing a way to answer there sets both settings)
  await expect(page.locator('.dm')).toHaveClass(/dm-easy/); // pictures on
  await expect(page.locator('[data-act=play-opt]')).toHaveCount(0); // read aloud still off
  await page.locator('[data-act=easy]').click(); // read aloud on: pictures unchanged
  await expect(page.locator('.dm')).toHaveClass(/dm-easy/);
  await go(page, '#/settings');
  await page.locator('.dm-opt:has(input[name=pictures][value=off])').click();
  await go(page, '#/passport');
  await expect(page.locator('.dm')).not.toHaveClass(/dm-easy/);
  await expect(page.locator('[data-act=play-opt]')).toHaveCount(2); // read aloud still on
});

test('"Simple steps with pictures" turns on both; "Listen and respond" turns on read aloud only', async ({ page }) => {
  await go(page, '#/signup');
  await pick(page, 'simple'); await next(page);
  let p = await page.evaluate(() => window.SavannaOnboarding.prefs());
  expect([p.easy, p.pictures]).toEqual([true, true]);
  await page.evaluate(() => window.SavannaOnboarding.setPrefs({ mode: '' }));
  await page.locator('[data-act=back]').click();
  await pick(page, 'listen'); await next(page);
  p = await page.evaluate(() => window.SavannaOnboarding.prefs());
  expect([p.easy, p.pictures]).toEqual([true, false]);
});

test('a recorded clip is played when it exists, by its name from docs/audio-script.md', async ({ page }) => {
  await clips(page, { en: { 'signup-filler-question': 'signup-filler-question.mp3', 'signup-filler-option-self': 'signup-filler-option-self.mp3' } });
  await signupTo(page, 'filler');
  await fakeVoice(page, { ms: 50 });
  await page.locator('[data-act=listen]').click();
  await expect.poll(() => page.evaluate(() => window.__clips), { timeout: 5000 }).toEqual(['signup-filler-question.mp3', 'signup-filler-option-self.mp3']);
  // the one option without a recording is read by the phone's voice
  await expect.poll(() => said(page), { timeout: 5000 }).toEqual(['A partner organisation, together with the learner']);
});

test('a clip that fails to play: the phone\'s voice reads instead, and the learner is told', async ({ page }) => {
  await clips(page, { en: { 'signup-filler-question': 'signup-filler-question.mp3' } }, { broken: ['signup-filler-question.mp3'] });
  await signupTo(page, 'filler');
  await fakeVoice(page, { ms: 50 });
  await page.locator('[data-act=listen]').click();
  await expect.poll(() => said(page), { timeout: 5000 }).toContain('Who is filling in this form?');
  await expect(page.locator('.dm-status')).toContainText('A recording could not be played');
});

test('no recording and no phone voice: a clear message, and everything stays on screen', async ({ page }) => {
  await signupTo(page, 'filler');
  await fakeVoice(page, { voice: false });
  await page.locator('[data-act=listen]').click();
  await expect(page.locator('.dm-status')).toContainText('There is no recording for this yet');
  await expect(page.locator('[data-act=stop-audio]')).toBeHidden();
  await pick(page, 'self'); await next(page); // the form carries on as normal
  expect(await heading(page)).toContain('What should we call you');
});

test('audio is never required: with no speech and no audio at all, sign-up still completes', async ({ page }) => {
  await page.addInitScript(() => {
    delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; delete window.SpeechRecognition; delete window.webkitSpeechRecognition;
    window.Audio = function () { throw new Error('no audio'); };
  });
  await go(page, '#/signup');
  await pick(page, 'listen'); await next(page); // even a learner who chose "listen"
  await page.locator('[data-act=listen]').click();
  await expect(page.locator('.dm-status')).toContainText('Everything is written on the screen');
  await pick(page, 'self'); await next(page);
  await page.fill('[data-ref=input]', 'Abebe Kebede'); await next(page);
  await page.fill('[data-ref=input]', '0911234567'); await next(page);
  await next(page); // date of birth: optional
  await pick(page, 'yes'); await next(page);
  expect(await heading(page)).toBe('Check your answers');
  await next(page);
  expect(await heading(page)).toContain('Your account is ready');
});

test('an English learner never downloads the Amharic clips', async ({ page }) => {
  const asked = [];
  page.on('request', r => { if (r.url().includes('/assets/audio/am/')) asked.push(r.url()); });
  await signupTo(page, 'filler');
  await fakeVoice(page, { ms: 20 });
  await page.locator('[data-act=listen]').click();
  await expect.poll(() => said(page)).toHaveLength(3);
  expect(asked).toEqual([]);
});

test('the manifest lists a clip for every line of docs/audio-script.md, and every clip file exists', async () => {
  const fs = await import('fs');
  const script = fs.readFileSync('docs/audio-script.md', 'utf8');
  const keys = [...script.matchAll(/^\|\s*\d+\s*\|\s*`am\/([a-z0-9-]+)\.mp3`/gm)].map(m => m[1]);
  const manifest = JSON.parse(fs.readFileSync('assets/audio/manifest.json', 'utf8'));
  expect(keys.length).toBeGreaterThan(70);
  expect(keys.filter(k => !(manifest.am || {})[k])).toEqual([]);
  for (const k of keys) expect(fs.statSync('assets/audio/am/' + manifest.am[k]).size).toBeGreaterThan(1000);
});

test('the home page Listen button plays the recorded home question and the four ways', async ({ page }) => {
  await clips(page, { am: { 'home-question': 'home-question.mp3', 'welcome-option-read-type': 'welcome-option-read-type.mp3',
    'welcome-option-listen': 'welcome-option-listen.mp3', 'welcome-option-speak': 'welcome-option-speak.mp3', 'welcome-option-simple': 'welcome-option-simple.mp3' } });
  await page.goto('/index.html?lang=am');
  await page.waitForFunction(() => !!window.SavannaOnboarding);
  await page.evaluate(() => window.SavannaOnboarding.setPrefs({ lang: 'am' }));
  await page.locator('#sj-listen').click();
  await expect.poll(() => page.evaluate(() => window.__clips), { timeout: 10000 }).toEqual(['home-question.mp3',
    'welcome-option-read-type.mp3', 'welcome-option-listen.mp3', 'welcome-option-speak.mp3', 'welcome-option-simple.mp3']);
});

test('the date question reads the calendar choice too, with its own clips', async ({ page }) => {
  await clips(page, { en: { 'signup-dob-question': 'signup-dob-question.mp3', 'signup-dob-calendar': 'signup-dob-calendar.mp3',
    'signup-dob-option-eth': 'signup-dob-option-eth.mp3', 'signup-dob-option-greg': 'signup-dob-option-greg.mp3' } });
  await signupTo(page, 'dob');
  await fakeVoice(page, { ms: 50 });
  await page.locator('[data-act=listen]').click();
  await expect.poll(() => page.evaluate(() => window.__clips), { timeout: 10000 }).toEqual(['signup-dob-question.mp3',
    'signup-dob-calendar.mp3', 'signup-dob-option-eth.mp3', 'signup-dob-option-greg.mp3']);
});
