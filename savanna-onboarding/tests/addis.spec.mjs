// Addis AI speech for Amharic and Afaan Oromo, through the host's proxy (the module holds no key and calls no third
// party). All endpoints are mocked here: no real calls. Also the reference proxy itself (api/_addis.js), run in Node
// with a fake fetch, and a check that no key is in any shipped file.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { freshStart, go, pick, next, signupTo, playBar } from './helpers.mjs';

const require = createRequire(import.meta.url);
test.use({ serviceWorkers: 'block' }); // requests must reach page.route

/** A tiny real WAV, served as the "MP3" the proxy returns. */
function wav(ms = 200) {
  const rate = 8000, n = Math.round(rate * ms / 1000), b = Buffer.alloc(44 + n);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate, 28); b.writeUInt16LE(1, 32);
  b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40); b.fill(128, 44); return b;
}
/** Mocks POST /api/tts and /api/stt; records each request. */
async function mockProxy(page, { tts = 200, stt = 200, text = 'አበበ', ready = true } = {}) {
  const calls = { tts: [], stt: [], probes: 0 };
  // the free readiness check (GET <proxy>/stt -> { ready }): is a key set on the proxy?
  await page.route('**/api/stt', r => { calls.probes++; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ready }) }); });
  await page.route('**/assets/audio/manifest.json', r => r.fulfill({ contentType: 'application/json', body: '{}' })); // no recordings
  await page.route('**/api/tts', async r => {
    calls.origin = await r.request().headerValue('origin'); // read before the request is counted (no race)
    calls.tts.push(JSON.parse(r.request().postData() || '{}'));
    if (tts === 200) return r.fulfill({ status: 200, contentType: 'audio/mpeg', body: wav() });
    const code = { 402: 'no_credit', 503: 'not_configured', 502: 'unavailable' }[tts] || 'unavailable';
    return r.fulfill({ status: tts, contentType: 'application/json', body: JSON.stringify({ error: code }) });
  });
  await page.route('**/api/stt?*', async r => {
    calls.stt.push({ url: r.request().url(), type: r.request().headers()['content-type'] });
    if (stt === 200) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text }) });
    return r.fulfill({ status: stt, contentType: 'application/json', body: JSON.stringify({ error: stt === 402 ? 'no_credit' : 'unavailable' }) });
  });
  return calls;
}
/** Logs the audio the page plays, and a fake phone voice (records what it would say). */
async function listenLog(page) {
  await page.addInitScript(() => {
    window.__clips = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { window.__clips.push(this.src.slice(0, 5)); return play.call(this); };
  });
}
async function fakeVoice(page) {
  await page.evaluate(() => {
    window.__said = [];
    window.SavannaOnboarding.setSpeech({ output: { speak: (t, l, u, done) => { window.__said.push(t); setTimeout(() => done && done(), 20); return true; }, stop() {}, pause() {}, resume() {} } });
  });
}
/** A fake microphone and recorder: getUserMedia works, and the recording is a small WebM blob. */
async function fakeRecorder(page) {
  await page.addInitScript(() => {
    window.__recStarts = 0;
    navigator.mediaDevices.getUserMedia = () => Promise.resolve({ getTracks: () => [{ stop() {} }] });
    window.MediaRecorder = class {
      static isTypeSupported(t) { return t.startsWith('audio/webm'); }
      constructor(stream, o) { this.mimeType = (o && o.mimeType) || 'audio/webm'; this.state = 'inactive'; }
      start() { this.state = 'recording'; window.__recStarts++; }
      stop() { this.state = 'inactive'; setTimeout(() => { this.ondataavailable && this.ondataavailable({ data: new Blob(['voice'], { type: 'audio/webm' }) }); this.onstop && this.onstop(); }, 10); }
    };
    localStorage.setItem('savanna-onboarding.voiceConsent', 'true');
  });
}

test.describe('in the browser (proxy mocked)', () => {
  test('Amharic without a recording: the question is read by Addis AI through the proxy, then cached (never paid twice)', async ({ page }) => {
    await freshStart(page, { lang: 'am', remote: true });
    const calls = await mockProxy(page); await listenLog(page);
    await signupTo(page, 'filler');
    await fakeVoice(page);
    await page.locator('[data-act=listen]').click();
    await expect.poll(() => calls.tts.length).toBeGreaterThan(0);
    expect(calls.tts[0]).toEqual({ text: 'ይህን ቅጽ የሚሞላው ማን ነው?', lang: 'am' });
    expect(calls.origin).toMatch(/^http:\/\/(localhost|127\.0\.0\.1):\d+$/); // a real Origin, not "null", despite the site's no-referrer policy
    await expect.poll(() => page.evaluate(() => window.__clips)).toContain('blob:');
    expect(await page.evaluate(() => window.__said)).toEqual([]); // not the phone's voice
    await expect.poll(() => page.evaluate(() => window.SavannaOnboarding.player.state), { timeout: 8000 }).toBe('idle');
    const n = calls.tts.length;
    await page.locator('[data-act=listen]').click(); // again: from the browser's cache
    await expect.poll(() => page.evaluate(() => window.__clips.length)).toBeGreaterThan(n);
    expect(calls.tts.length).toBe(n);
  });

  test('a recorded clip always comes first; English keeps the browser voice (no proxy call)', async ({ page }) => {
    await freshStart(page, { lang: 'am', remote: true });
    const calls = await mockProxy(page); await listenLog(page);
    await page.route('**/assets/audio/manifest.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ am: { 'signup-filler-question': 'q.mp3', 'signup-filler-option-self': 's.mp3', 'signup-filler-option-partner': 'p.mp3' } }) }));
    await page.route(/assets\/audio\/am\/[^/]+\.mp3$/, r => r.fulfill({ contentType: 'audio/wav', body: wav() }));
    await signupTo(page, 'filler');
    await fakeVoice(page);
    await page.locator('[data-act=listen]').click();
    await expect.poll(() => page.evaluate(() => window.SavannaOnboarding.player.state), { timeout: 8000 }).toBe('idle');
    expect(calls.tts).toEqual([]);
    await page.evaluate(() => window.SavannaOnboarding.setPrefs({ lang: 'en' }));
    await page.locator('[data-act=listen]').click();
    await expect.poll(() => page.evaluate(() => window.__said.length)).toBeGreaterThan(0);
    expect(calls.tts).toEqual([]);
  });

  test('no credit (402): the phone\'s voice reads instead, with no message (not a failure); the demo never breaks', async ({ page }) => {
    await freshStart(page, { lang: 'am', remote: true });
    await mockProxy(page, { tts: 402 }); await listenLog(page);
    await signupTo(page, 'filler');
    await fakeVoice(page);
    await page.locator('[data-act=listen]').click();
    await expect.poll(() => page.evaluate(() => window.__said)).toContain('ይህን ቅጽ የሚሞላው ማን ነው?');
    await expect(page.locator('.dm-status')).not.toContainText('አይገኝም'); // no "not available" message as the normal case
  });

  test('no proxy or no key: asked once, then not again in this tab', async ({ page }) => {
    await freshStart(page, { lang: 'om', remote: true });
    const calls = await mockProxy(page, { tts: 503 });
    await signupTo(page, 'filler');
    await fakeVoice(page);
    await page.locator('[data-act=listen]').click();
    await expect.poll(() => page.evaluate(() => window.__said.length)).toBeGreaterThan(0);
    const n = calls.tts.length;
    expect(n).toBe(1);
    await page.locator('[data-act=listen]').click();
    await expect.poll(() => page.evaluate(() => window.__said.length)).toBeGreaterThan(3);
    expect(calls.tts.length).toBe(n);
    expect(await page.evaluate(() => window.SavannaOnboarding.speechProxy().down)).toBe(true);
  });

  test('a passing failure (502) never switches the online voice off: the next piece tries again', async ({ page }) => {
    await freshStart(page, { lang: 'om', remote: true });
    const calls = await mockProxy(page, { tts: 502 });
    await signupTo(page, 'filler');
    await fakeVoice(page);
    await page.locator('[data-act=listen]').click();
    await expect.poll(() => page.evaluate(() => window.__said.length)).toBeGreaterThan(0);
    const n = calls.tts.length;
    await page.locator('[data-act=listen]').click();
    await expect.poll(() => calls.tts.length).toBeGreaterThan(n); // asked again
    expect(await page.evaluate(() => window.SavannaOnboarding.speechProxy().down)).toBe(false);
  });

  test('not set up: paused, and tried again after 60 seconds', async ({ page }) => {
    await page.clock.install();
    await freshStart(page, { lang: 'om', remote: true });
    const calls = await mockProxy(page, { tts: 503 });
    await signupTo(page, 'filler');
    await fakeVoice(page);
    await page.locator('[data-act=listen]').click();
    await expect.poll(() => calls.tts.length).toBe(1);
    await page.clock.runFor(2000);
    expect(await page.evaluate(() => window.SavannaOnboarding.speechProxy().down)).toBe(true);
    await page.clock.fastForward(61000);
    expect(await page.evaluate(() => window.SavannaOnboarding.speechProxy().down)).toBe(false);
  });

  test('voice answer in Amharic: recorded, sent to the proxy (lang=am, WebM), and shown for checking first', async ({ page }) => {
    await freshStart(page, { lang: 'am', remote: true });
    await fakeRecorder(page);
    const calls = await mockProxy(page, { text: 'አበበ' });
    await signupTo(page, 'name');
    await page.locator('[data-act=speak]').click();
    await expect(page.locator('[data-act=speak]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('[data-act=speak]').click(); // Stop
    await expect(page.locator('[data-ref=heard-edit]')).toHaveValue('አበበ');
    await expect(page.locator('[data-ref=input]')).toHaveValue(''); // not used before the learner checks it
    expect(calls.stt).toHaveLength(1);
    expect(calls.stt[0].url).toContain('/api/stt?lang=am');
    expect(calls.stt[0].type).toBe('audio/webm');
  });

  test('voice answer in Afaan Oromo uses lang=om; a recording stops by itself at 30 seconds', async ({ page }) => {
    await page.clock.install();
    await freshStart(page, { lang: 'om', remote: true });
    await fakeRecorder(page);
    const calls = await mockProxy(page, { text: 'Caalaa' });
    await signupTo(page, 'name');
    await page.locator('[data-act=speak]').click();
    await expect(page.locator('[data-act=speak]')).toHaveAttribute('aria-pressed', 'true');
    await page.clock.fastForward(31000); // no Stop pressed: the 30-second limit protects the balance
    await expect.poll(() => calls.stt.length).toBe(1);
    expect(calls.stt[0].url).toContain('/api/stt?lang=om');
    await expect(page.locator('[data-ref=heard-edit]')).toHaveValue('Caalaa');
  });

  test('the speech service fails: a plain message; the next try uses the browser\'s engine', async ({ page }) => {
    await freshStart(page, { lang: 'am', remote: true });
    await fakeRecorder(page);
    await mockProxy(page, { stt: 402 });
    await signupTo(page, 'name');
    await expect(page.locator('.dm-engine')).toHaveText('ድምፅ፦ Addis AI');
    await page.locator('[data-act=speak]').click();
    await page.locator('[data-act=speak]').click();
    await expect(page.locator('.dm-status')).toContainText('የAddis AI የንግግር አገልግሎት አልመለሰም'); // "press Answer by voice again to use your browser"
    await expect(page.locator('.dm-engine')).toHaveText('ድምፅ፦ የእርስዎ ብራውዘር'); // the fallback is shown
    await page.fill('[data-ref=input]', 'አበበ'); await next(page); // typing always works
    await expect(page.locator('.dm-q')).not.toContainText('ምን ብለን');
  });

  test('English answers never go to the proxy', async ({ page }) => {
    await freshStart(page, { lang: 'en', remote: true });
    await fakeRecorder(page);
    await page.addInitScript(() => { window.SpeechRecognition = class { start() { setTimeout(() => this.onend && this.onend(), 5); } stop() {} abort() {} }; });
    const calls = await mockProxy(page);
    await signupTo(page, 'name');
    await page.locator('[data-act=speak]').click();
    await page.locator('[data-act=speak]').click();
    await page.waitForTimeout(300);
    expect(calls.stt).toEqual([]);
    expect(await page.evaluate(() => window.__recStarts)).toBe(0);
  });

  test('the consent names Addis AI (Ethiopia) and Google', async ({ page }) => {
    await freshStart(page, { lang: 'en', remote: true });
    await page.addInitScript(() => { window.SpeechRecognition = class { start() {} stop() {} abort() {} }; });
    await signupTo(page, 'name');
    await page.locator('[data-act=speak]').click();
    await expect(page.locator('[data-ref=heard]')).toContainText('Addis AI (Ethiopia) for Amharic and Afaan Oromo, and Google (in Chrome) for English');
  });
});

test.describe('the reference proxy (Node, fake fetch, no network)', () => {
  const addis = () => { delete require.cache[require.resolve('../api/_addis.js')]; return require('../api/_addis.js'); };
  function call(handler, { method = 'POST', origin = 'http://localhost:8080', host = 'localhost:8080', url = '/api/tts', type = 'application/json', body = '', headers: extra = {} } = {}) {
    return new Promise(resolve => {
      const headers = { origin, host, 'content-type': type, ...extra };
      const req = { method, url, headers, socket: { remoteAddress: '10.0.0.' + Math.floor(Math.random() * 250) }, body: Buffer.isBuffer(body) ? body : Buffer.from(body) };
      const res = { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { resolve({ status: this.statusCode, headers: this.headers, body: b }); } };
      handler(req, res);
    });
  }
  const KEY = 'sk_test_never_leak_1234567890';
  let realFetch, logs;
  test.beforeEach(() => {
    realFetch = global.fetch; logs = [];
    for (const k of ['log', 'warn', 'error']) { const o = console[k]; console['_' + k] = o; console[k] = (...a) => { logs.push(a.join(' ')); }; }
  });
  test.afterEach(() => {
    global.fetch = realFetch; delete process.env.ADDIS_API_KEY;
    for (const k of ['log', 'warn', 'error']) console[k] = console['_' + k];
    expect(logs.join('\n')).not.toContain(KEY); // the key is never logged
  });

  test('readiness check: GET answers { ready } only, never the key, with no call to Addis AI', async () => {
    const { handleStt, handleTts } = addis();
    let fetched = 0; global.fetch = () => { fetched++; return Promise.reject(new Error('no')); };
    let r = await call(handleStt, { method: 'GET', url: '/api/stt' });
    expect([r.status, JSON.parse(r.body)]).toEqual([200, { ready: false }]);
    process.env.ADDIS_API_KEY = KEY;
    r = await call(handleTts, { method: 'GET', origin: 'https://evil.example' });
    expect([r.status, JSON.parse(r.body)]).toEqual([200, { ready: true }]);
    expect(String(r.body)).not.toContain(KEY);
    expect(fetched).toBe(0);
  });

  test('no key: not_configured; other sites are refused; long text is refused', async () => {
    const { handleTts } = addis();
    let r = await call(handleTts, { body: JSON.stringify({ text: 'ሰላም', lang: 'am' }) });
    expect([r.status, JSON.parse(r.body).error]).toEqual([503, 'not_configured']);
    process.env.ADDIS_API_KEY = KEY;
    r = await call(handleTts, { origin: 'https://evil.example', body: JSON.stringify({ text: 'ሰላም', lang: 'am' }) });
    expect([r.status, JSON.parse(r.body).error]).toEqual([403, 'origin']);
    r = await call(handleTts, { origin: 'null', body: JSON.stringify({ text: 'ሰላም', lang: 'am' }) }); // no-referrer page, not marked same-site
    expect([r.status, JSON.parse(r.body).error]).toEqual([403, 'origin']);
    r = await call(handleTts, { origin: 'null', headers: { 'sec-fetch-site': 'same-origin' }, body: JSON.stringify({ text: 'ሀ'.repeat(601), lang: 'am' }) }); // same site: allowed
    expect([r.status, JSON.parse(r.body).error]).toEqual([413, 'too_long']);
    r = await call(handleTts, { body: JSON.stringify({ text: 'hello', lang: 'en' }) });
    expect([r.status, JSON.parse(r.body).error]).toEqual([400, 'language']);
  });

  test('allowed origins: production, every preview deployment and the branch alias of this project; no other site', async () => {
    process.env.ADDIS_API_KEY = KEY;
    const { _test: { originAllowed } } = addis();
    // on Vercel every request arrives over https (x-forwarded-proto); docker compose locally is plain http
    const req = (origin, host, extra = {}) => ({ headers: { origin, host, ...(host.endsWith('.vercel.app') ? { 'x-forwarded-proto': 'https' } : {}), ...extra } });
    const PROD = 'savanna-accessible-onboarding.vercel.app';
    const PREVIEW = 'savanna-accessible-onboarding-phucjq0dj.vercel.app';
    const ALIAS = 'savanna-accessible-onboarding-git-addis-ai-zeamekonnen-gmailcoms-projects.vercel.app';
    const SHORT_ALIAS = 'savanna-accessible-onboa-git-0f3a9c-zeamekonnen-gmailcoms-projects.vercel.app'; // Vercel shortens long aliases
    expect(originAllowed(req('https://' + PROD, PROD))).toBe(true);
    for (const h of [PREVIEW, ALIAS, SHORT_ALIAS]) expect(originAllowed(req('https://' + h, h)), h).toBe(true); // the page and the proxy share the host
    expect(originAllowed(req('http://localhost:8080', 'localhost:8080'))).toBe(true); // docker compose
    // other sites, even look-alikes on vercel.app, are refused when they call our proxy
    for (const evil of ['https://savanna-accessible-onboarding-evil.vercel.app', 'https://evil.vercel.app', 'https://savanna-accessible-onboarding.vercel.app.evil.com', 'http://' + PROD])
      for (const h of [PROD, PREVIEW, ALIAS]) expect(originAllowed(req(evil, h)), evil + ' -> ' + h).toBe(false);
    expect(originAllowed(req('null', PREVIEW))).toBe(false);
    expect(originAllowed(req(undefined, PREVIEW))).toBe(false);
    expect(originAllowed(req('null', PREVIEW, { 'sec-fetch-site': 'same-origin' }))).toBe(true); // set by the browser, not by pages
    expect(originAllowed(req('https://evil.example', PREVIEW, { 'sec-fetch-site': 'cross-site' }))).toBe(false);
  });

  test('TTS: documented request to Addis AI, MP3 returned, cached by text + language + voice', async () => {
    process.env.ADDIS_API_KEY = KEY;
    const { handleTts } = addis();
    const sent = [];
    global.fetch = async (url, init) => {
      sent.push({ url: String(url), init });
      if (String(url).endsWith('/api/v1/voice/generations')) return new Response(JSON.stringify({ data: { audio_url: 'https://cdn.example/clip.mp3' } }), { status: 200 });
      return new Response(Buffer.from('ID3-mp3-bytes'), { status: 200 });
    };
    const body = JSON.stringify({ text: 'ሰላም', lang: 'am' });
    let r = await call(handleTts, { body });
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toBe('audio/mpeg');
    expect(Buffer.from(r.body).toString()).toBe('ID3-mp3-bytes');
    expect(sent[0].url).toBe('https://api.addisassistant.com/api/v1/voice/generations');
    expect(sent[0].init.headers['x-api-key']).toBe(KEY);
    // client_request_id is required by Addis AI for paid generation (422 without it); the same words, the same id
    expect(JSON.parse(sent[0].init.body)).toEqual({ text: 'ሰላም', voice_id: 'am-hamen', language: 'am', output_format: 'mp3_44100', client_request_id: expect.stringMatching(/^savanna-[0-9a-f]{40}$/) });
    r = await call(handleTts, { body }); // the same words again
    expect(r.headers['x-cache']).toBe('hit');
    expect(sent.length).toBe(2); // generation + download, only once
    const om = await call(handleTts, { body: JSON.stringify({ text: 'Akkam', lang: 'om' }) });
    expect(om.status).toBe(200);
    expect(JSON.parse(sent[2].init.body).voice_id).toBe('om-bikila');
    expect(JSON.stringify(r.headers) + String(r.body)).not.toContain(KEY);
  });

  test('TTS: the MP3 inline in data.audio is used (no second download); Addis AI error reason is logged without the key or the text', async () => {
    process.env.ADDIS_API_KEY = KEY;
    const { handleTts } = addis();
    const mp3 = Buffer.from('ID3-inline-mp3');
    let calls = 0;
    global.fetch = async () => { calls++; return new Response(JSON.stringify({ data: { audio: 'data:audio/mpeg;base64,' + mp3.toString('base64'), audio_url: 'https://cdn.example/x.mp3' } }), { status: 201 }); };
    const r = await call(handleTts, { body: JSON.stringify({ text: 'ደህና', lang: 'am' }) });
    expect([r.status, Buffer.from(r.body).toString()]).toEqual([200, 'ID3-inline-mp3']);
    expect(calls).toBe(1);
    global.fetch = async () => new Response(JSON.stringify({ error: { code: 'CLIENT_REQUEST_ID_REQUIRED', message: 'client_request_id is required. text was: ሰላም ' + KEY } }), { status: 422 });
    const bad = await call(handleTts, { body: JSON.stringify({ text: 'ሰላም', lang: 'am' }) });
    expect(bad.status).toBe(502);
    const line = logs.find(l => l.includes('tts upstream 422'));
    expect(line).toContain('CLIENT_REQUEST_ID_REQUIRED');
    expect(line).not.toContain('ሰላም'); // the learner's text is never logged
  });

  test('STT: multipart audio + request_data with language_code; transcription returned; 402 -> no_credit', async () => {
    process.env.ADDIS_API_KEY = KEY;
    const { handleStt } = addis();
    let form;
    global.fetch = async (url, init) => { form = init.body; return new Response(JSON.stringify({ status: 'success', data: { transcription: 'አበበ', confidence: 0.9 } }), { status: 200 }); };
    let r = await call(handleStt, { url: '/api/stt?lang=om', type: 'audio/webm;codecs=opus', body: Buffer.from('webm-bytes') });
    expect(r.status).toBe(200);
    expect(JSON.parse(r.body)).toEqual({ text: 'አበበ' });
    expect(JSON.parse(form.get('request_data'))).toEqual({ language_code: 'om' });
    expect(form.get('audio').type).toBe('audio/webm');
    global.fetch = async () => new Response(JSON.stringify({ status: 'error' }), { status: 402 });
    r = await call(handleStt, { url: '/api/stt?lang=am', type: 'audio/webm', body: Buffer.from('x') });
    expect([r.status, JSON.parse(r.body).error]).toEqual([402, 'no_credit']);
    r = await call(handleStt, { url: '/api/stt?lang=am', type: 'audio/webm', body: Buffer.alloc(2 * 1024 * 1024 + 1) });
    expect([r.status, JSON.parse(r.body).error]).toEqual([413, 'too_large']);
    r = await call(handleStt, { url: '/api/stt?lang=am', type: 'video/x-flv', body: Buffer.from('x') });
    expect(r.status).toBe(415);
  });
});

test('no API key in any shipped file, and .env is never committed or deployed', async () => {
  const root = path.resolve('.');
  const skip = new Set(['node_modules', 'tests', 'tools', 'test-results', 'playwright-report', '.git']);
  const hits = [];
  const key = process.env.ADDIS_API_KEY;
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (/\.(mp3|m4a|png|jpg|woff2?|ttf|svg|ico)$/i.test(e.name)) continue;
      const t = fs.readFileSync(p, 'utf8');
      if (/\bsk_[A-Za-z0-9]{16,}/.test(t) || (key && t.includes(key))) hits.push(path.relative(root, p));
      if (/^\.env($|\.)/.test(e.name) && e.name !== '.env.example') hits.push(path.relative(root, p) + ' (env file inside the deployed folder)');
    }
  })(root);
  expect(hits).toEqual([]);
  // the module and the pages never talk to Addis AI directly, and never send a key
  for (const f of ['savanna-onboarding.js', 'app.js', 'forms.js', 'journey/journey.js', 'journey/early.js']) {
    const t = fs.readFileSync(f, 'utf8');
    expect(t, f).not.toContain('addisassistant.com');
    expect(t, f).not.toMatch(/x-api-key/i);
  }
  expect(fs.readFileSync('../.gitignore', 'utf8')).toMatch(/^\.env$/m);
  expect(fs.readFileSync('.vercelignore', 'utf8')).toMatch(/^\.env$/m);
});
