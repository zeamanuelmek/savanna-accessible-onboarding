// Pitch-day fix 2 (19 Nov): the demo works without the paid Addis AI key, and the voice panel names the engine in use.
// Both paths, on the name question, in Amharic and English:
//   key ON  (GET /api/stt -> { ready: true }):  Amharic is recorded and sent to the proxy (Addis AI); English uses the browser.
//   key OFF (GET /api/stt -> { ready: false }): Amharic uses the browser's own recognition (am-ET); nothing goes to the proxy.
// The proxy and the browser engines are faked here (no real calls); the live check is in DEVELOPMENT_PROGRESS.md.
import { test, expect } from '@playwright/test';
import { freshStart, signupTo, next } from './helpers.mjs';

test.use({ serviceWorkers: 'block' }); // requests must reach page.route

/** The proxy: the readiness check, and STT. */
async function proxy(page, { ready, stt = 200, text = 'አበበ' }) {
  const calls = { probes: 0, stt: [] };
  await page.route('**/assets/audio/manifest.json', r => r.fulfill({ contentType: 'application/json', body: '{}' }));
  await page.route('**/api/stt', r => { calls.probes++; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ready }) }); });
  await page.route('**/api/stt?*', r => {
    calls.stt.push(r.request().url());
    if (stt === 200) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text }) });
    return r.fulfill({ status: stt, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) });
  });
  await page.route('**/api/tts', r => r.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"not_configured"}' }));
  return calls;
}
/** A fake microphone + recorder (for Addis AI) and a fake browser recognition that records the language it was given. */
async function fakeEngines(page, browserHears) {
  await page.addInitScript(heard => {
    localStorage.setItem('savanna-onboarding.voiceConsent', 'true');
    window.__rec = 0; window.__sr = [];
    navigator.mediaDevices.getUserMedia = () => Promise.resolve({ getTracks: () => [{ stop() {} }] });
    window.MediaRecorder = class {
      static isTypeSupported(t) { return t.startsWith('audio/webm'); }
      constructor(s, o) { this.mimeType = (o && o.mimeType) || 'audio/webm'; this.state = 'inactive'; }
      start() { this.state = 'recording'; window.__rec++; }
      stop() { this.state = 'inactive'; setTimeout(() => { this.ondataavailable?.({ data: new Blob(['voice'], { type: 'audio/webm' }) }); this.onstop?.(); }, 10); }
    };
    window.webkitSpeechRecognition = window.SpeechRecognition = class {
      start() { window.__sr.push(this.lang); }
      stop() { if (this.done) return; this.done = true; this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: heard }], { isFinal: true })] }); setTimeout(() => this.onend?.(), 0); }
      abort() { setTimeout(() => this.onend?.(), 0); }
    };
  }, browserHears);
}
/** Answer the name question by voice and accept what was heard. */
async function answerByVoice(page, expected) {
  const mic = page.locator('[data-act=speak]');
  await mic.click();
  await expect(mic).toHaveAttribute('aria-pressed', 'true');
  await mic.click(); // Stop
  await expect(page.locator('[data-ref=heard-edit]')).toHaveValue(expected); // "I heard …", for checking first
  await expect(page.locator('[data-ref=input]')).toHaveValue('');             // not used before the learner checks it
  await page.locator('[data-act=heard-yes]').click();
  await expect(page.locator('[data-ref=input]')).toHaveValue(expected);
}

const CASES = [
  { key: 'on', lang: 'am', line: 'ድምፅ፦ Addis AI', said: 'አበበ', engine: 'addis' },
  { key: 'off', lang: 'am', line: 'ድምፅ፦ የእርስዎ ብራውዘር', said: 'አበበ', engine: 'browser', srLang: 'am-ET' },
  { key: 'on', lang: 'en', line: 'Voice: your browser', said: 'Abebe', engine: 'browser', srLang: 'en-US' },
  { key: 'off', lang: 'en', line: 'Voice: your browser', said: 'Abebe', engine: 'browser', srLang: 'en-US' }
];
for (const c of CASES) {
  test(`name question, ${c.lang === 'am' ? 'Amharic' : 'English'}, Addis AI key ${c.key}: "${c.line}" and the answer is used after checking`, async ({ page }) => {
    await freshStart(page, { lang: c.lang, remote: true });
    await fakeEngines(page, c.said);
    const calls = await proxy(page, { ready: c.key === 'on', text: c.said });
    await signupTo(page, 'name');
    await expect(page.locator('.dm-engine')).toHaveText(c.line);
    expect(await page.evaluate(l => window.SavannaOnboarding.voiceEngine(l), c.lang)).toBe(c.engine);
    await answerByVoice(page, c.said);
    if (c.engine === 'addis') {
      expect(calls.stt).toHaveLength(1);
      expect(calls.stt[0]).toContain('/api/stt?lang=am');
      expect(await page.evaluate(() => window.__sr)).toEqual([]); // the browser engine was not used
    } else {
      expect(calls.stt).toEqual([]); // nothing went to the proxy
      expect(await page.evaluate(() => window.__rec)).toBe(0);
      expect(await page.evaluate(() => window.__sr)).toEqual([c.srLang]);
    }
    await next(page);
    await expect(page.locator('.dm-q')).toBeFocused(); // on to the phone question
  });
}

test('Addis AI fails during use: plain message, the line switches to "your browser", and the next try works with am-ET', async ({ page }) => {
  await freshStart(page, { lang: 'am', remote: true });
  await fakeEngines(page, 'አበበ');
  const calls = await proxy(page, { ready: true, stt: 502 });
  await signupTo(page, 'name');
  await expect(page.locator('.dm-engine')).toHaveText('ድምፅ፦ Addis AI');
  const mic = page.locator('[data-act=speak]');
  await mic.click(); await expect(mic).toHaveAttribute('aria-pressed', 'true'); await mic.click();
  await expect(page.locator('.dm-status')).toContainText('የAddis AI የንግግር አገልግሎት አልመለሰም');
  await expect(page.locator('.dm-engine')).toHaveText('ድምፅ፦ የእርስዎ ብራውዘር');
  expect(calls.stt).toHaveLength(1);
  await answerByVoice(page, 'አበበ'); // second try: the browser's engine
  expect(await page.evaluate(() => window.__sr)).toEqual(['am-ET']);
  expect(calls.stt).toHaveLength(1); // not asked again
});

test('no proxy on this site at all (a static host): Amharic voice uses the browser from the start', async ({ page }) => {
  await freshStart(page, { lang: 'am', remote: true });
  await fakeEngines(page, 'አበበ');
  await page.route('**/assets/audio/manifest.json', r => r.fulfill({ contentType: 'application/json', body: '{}' }));
  // the test server has no /api: GET /api/stt is a 404
  await signupTo(page, 'name');
  await expect(page.locator('.dm-engine')).toHaveText('ድምፅ፦ የእርስዎ ብራውዘር');
  await answerByVoice(page, 'አበበ');
  expect(await page.evaluate(() => window.__sr)).toEqual(['am-ET']);
});
