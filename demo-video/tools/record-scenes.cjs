// Records the demo scenes from the LIVE site with Playwright + Google Chrome at 1920x1080 (recordVideo).
//   node record-scenes.cjs            (all scenes)
//   node record-scenes.cjs 03 05      (only these scenes)
// Writes demo-video/NN-name.webm and demo-video/NN-events.json (ms from the video start: audio clips, keys, clicks).
// Recording aids, in the recording browser only (the site is not changed): a drawn mouse pointer in mouse scenes
// (headless video has no cursor), Chrome's fake microphone fed with a WAV, and in scene 08 the GET /api/stt readiness
// check answered with 403 for that page only.
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const B = process.env.BASE || 'https://savanna-accessible-onboarding.vercel.app';
const OUT = path.resolve(__dirname, '..'); const MIC = path.join(OUT, 'fake-mic'); const STATE = path.join(__dirname, '.state');
fs.mkdirSync(STATE, { recursive: true });
const VIEW = { width: 1920, height: 1080 };
const GAP = 600, RESULT = 2000, TYPE_DELAY = 150;
const only = process.argv.slice(2);
const want = n => !only.length || only.includes(n);

function launch(wav) {
  const args = ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'];
  if (wav) args.push('--use-file-for-fake-audio-capture=' + path.join(MIC, wav) + '%noloop');
  return chromium.launch({ channel: 'chrome', args });
}
const ls = (obj) => ({ cookies: [], origins: [{ origin: B, localStorage: Object.entries(obj).map(([name, v]) => ({ name, value: typeof v === 'string' ? v : JSON.stringify(v) })) }] });
const PREFS = (lang) => ({ lang, mode: 'listen', easy: true, autoRead: 'on' }); // what "Listen" sets: reading on

// ---------- in-page event capture (recording browser only) ----------
const CAPTURE = () => {
  if (window.__recInit) return; window.__recInit = 1;
  const send = (o) => { try { window.__rec(o); } catch (e) {} };
  const desc = (el) => {
    if (!el || !el.closest) return '';
    const c = el.closest('button,a,input,select,textarea,label,summary,[role]') || el;
    const label = c.tagName === 'INPUT' && /radio|checkbox/.test(c.type) && c.closest('label') ? c.closest('label').innerText : (c.getAttribute('aria-label') || c.innerText || c.value || '');
    return c.tagName.toLowerCase() + (c.type && c.tagName === 'INPUT' ? '[' + c.type + ']' : '') + (c.dataset && c.dataset.act ? '[data-act=' + c.dataset.act + ']' : '') + ' "' + String(label).trim().replace(/\s+/g, ' ').slice(0, 70) + '"';
  };
  addEventListener('keydown', e => send({ type: 'key', key: e.key, code: e.code, mods: [e.ctrlKey && 'Ctrl', e.shiftKey && 'Shift', e.altKey && 'Alt', e.metaKey && 'Meta'].filter(Boolean), target: desc(e.composedPath()[0]) }), true);
  addEventListener('click', e => send({ type: 'click', x: Math.round(e.clientX), y: Math.round(e.clientY), byKeyboard: e.detail === 0, target: desc(e.composedPath()[0]) }), true);
  const P = HTMLMediaElement.prototype, op = P.play;
  P.play = function () {
    const el = this;
    if (!el.__recHooked) { el.__recHooked = 1;
      el.addEventListener('playing', () => { window.__playing = (window.__playing || 0) + 1; send({ type: 'audio-start', url: el.currentSrc || el.src }); });
      el.addEventListener('ended', () => { window.__playing = Math.max(0, (window.__playing || 0) - 1); send({ type: 'audio-end', url: el.currentSrc || el.src }); });
      el.addEventListener('pause', () => { if (!el.ended) { window.__playing = Math.max(0, (window.__playing || 0) - 1); send({ type: 'audio-stop', url: el.currentSrc || el.src }); } });
      el.addEventListener('error', () => send({ type: 'audio-error', url: el.currentSrc || el.src })); }
    return op.apply(this, arguments);
  };
  if (window.speechSynthesis) { const os = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = function (u) { send({ type: 'speech-synthesis', text: u.text, lang: u.lang, note: 'browser voice (no voices installed in the recording machine, so silent)' }); return os(u); }; }
};
const CURSOR = () => {
  const make = () => {
    if (document.getElementById('__rec-cursor')) return;
    const d = document.createElement('div'); d.id = '__rec-cursor'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 2l16 9.5-7 1.5-3.5 6.5z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    d.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(' + (window.__cx || 960) + 'px,' + (window.__cy || 540) + 'px);transition:none';
    document.documentElement.appendChild(d);
    addEventListener('mousemove', e => { window.__cx = e.clientX - 4; window.__cy = e.clientY - 2; d.style.transform = 'translate(' + window.__cx + 'px,' + window.__cy + 'px)'; }, true);
    addEventListener('mousedown', () => { d.firstChild.style.transform = 'scale(.85)'; }, true);
    addEventListener('mouseup', () => { d.firstChild.style.transform = ''; }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', make); else make();
};

async function scene(id, file, opts, body) {
  if (!want(id)) return;
  console.log('== scene', id, file);
  const browser = await launch(opts.wav);
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, permissions: ['microphone'], storageState: opts.state,
    recordVideo: { dir: path.join(STATE, 'raw'), size: VIEW } });
  const events = []; let t0 = 0;
  const log = (o) => { const e = Object.assign({ t: Date.now() - t0 }, o); events.push(e); };
  await ctx.exposeBinding('__rec', (src, o) => log(o));
  await ctx.addInitScript(CAPTURE);
  if (opts.cursor !== false) await ctx.addInitScript(CURSOR);
  if (opts.route) await opts.route(ctx, log);
  t0 = Date.now();
  const p = await ctx.newPage();
  p.on('framenavigated', f => { if (f === p.mainFrame()) log({ type: 'navigate', url: f.url() }); });
  p.on('request', r => { const u = r.url();
    if (/\/api\/tts/.test(u) && r.method() === 'POST') { let b = {}; try { b = JSON.parse(r.postData() || '{}'); } catch (e) {} log({ type: 'tts-request', url: u, text: b.text, lang: b.lang, note: 'Addis AI text-to-speech through the site proxy; the audio then plays from a blob: URL' }); }
    if (/\/api\/stt/.test(u)) log({ type: r.method() === 'GET' ? 'stt-readiness-check' : 'stt-request', url: u }); });
  p.on('response', async r => { if (/\/api\/stt/.test(r.url()) && r.request().method() === 'POST') { let t = ''; try { t = await r.text(); } catch (e) {} log({ type: 'stt-response', status: r.status(), body: t }); } });
  const h = helpers(p, log, opts.cursor !== false);
  let ok = true;
  try { await body(p, h); } catch (e) { ok = false; console.error('scene', id, 'FAILED:', e.message); await p.screenshot({ path: path.join(STATE, id + '-fail.png') }).catch(() => {}); }
  if (opts.saveState) await ctx.storageState({ path: path.join(STATE, opts.saveState) });
  const v = p.video(); log({ type: 'end' });
  await ctx.close();
  const out = path.join(OUT, file);
  await v.saveAs(out); await v.delete();
  const evFile = path.join(OUT, id + '-events.json');
  fs.writeFileSync(evFile, JSON.stringify({ scene: id, video: file, site: B, recordedAt: new Date(t0).toISOString(), viewport: VIEW,
    timeBase: 'ms from the start of the video (the page was created at t=0; the first frames may be blank until the page paints)',
    notes: opts.notes || [], events }, null, 2));
  console.log(ok ? 'saved' : 'saved (with errors)', file, events.length, 'events');
  await browser.close();
}

function helpers(p, log, cursor) {
  const wait = (ms = GAP) => p.waitForTimeout(ms);
  const mark = (what) => log({ type: 'mark', what });
  async function click(loc, pause = GAP) {
    loc = loc.first(); await loc.waitFor({ state: 'visible', timeout: 30000 });
    await loc.scrollIntoViewIfNeeded(); await wait(150);
    const b = await loc.boundingBox();
    await p.mouse.move(b.x + Math.min(b.width / 2, 60), b.y + b.height / 2, { steps: 22 });
    await wait(250); await p.mouse.down(); await wait(90); await p.mouse.up(); await wait(pause);
  }
  async function type(loc, text) { await loc.first().pressSequentially(text, { delay: TYPE_DELAY }); await wait(); }
  async function key(k, pause = GAP) { await p.keyboard.press(k); await wait(pause); }
  async function keys(s) { await p.keyboard.type(s, { delay: TYPE_DELAY }); await wait(); }
  /** Press Tab (600 ms apart) until the focused element matches. */
  async function tabTo(fn, arg, max = 25) {
    for (let i = 0; i < max; i++) { if (await p.evaluate(fn, arg)) return; await key('Tab'); }
    throw new Error('tabTo: not reached ' + fn.toString().slice(0, 80) + ' ' + arg);
  }
  const focusIs = (sel) => { const a = document.activeElement; return !!a && a.matches(sel); };
  const focusText = (t) => { const a = document.activeElement; return !!a && (a.innerText || a.value || '').trim() === t; };
  const ready = async () => { await p.waitForLoadState('networkidle').catch(() => {}); await p.evaluate(() => document.fonts.ready); };
  if (cursor) p.mouse.move(960, 540).catch(() => {});
  /** Wait until no clip is playing for 900 ms (at most maxMs). */
  async function audioIdle(maxMs = 15000) { const end = Date.now() + maxMs; let quiet = 0;
    while (Date.now() < end && quiet < 900) { const pl = await p.evaluate(() => window.__playing || 0); quiet = pl ? 0 : quiet + 150; await p.waitForTimeout(150); } }
  return { audioIdle, wait, mark, click, type, key, keys, tabTo, focusIs, focusText, ready };
}
const next = (p) => p.locator('.dm-form button[type=submit]');
const opt = (p, v) => p.locator(`.dm-opt:has(input[value="${v}"])`);

// ---------- states prepared without recording ----------
async function prep() {
  const need = ['name-en.json', 'phone-en.json', 'signed-en.json', 'passport-sr.json'].filter(f => !fs.existsSync(path.join(STATE, f)));
  if (!need.length) return;
  const browser = await launch();
  const mk = async (state) => { const ctx = await browser.newContext({ viewport: VIEW, storageState: state }); return { ctx, p: await ctx.newPage() }; };
  const save = (ctx, f) => ctx.storageState({ path: path.join(STATE, f) });
  { const { ctx, p } = await mk(ls({ 'savanna-onboarding.prefs': PREFS('en') }));
    await p.goto(B + '/signup.html', { waitUntil: 'networkidle' });
    await opt(p, 'self').click(); await next(p).click(); await p.locator('[data-act=speak]').waitFor(); await p.waitForTimeout(800); await save(ctx, 'name-en.json');
    await p.fill('[data-ref=input]', 'Meron'); await next(p).click(); await p.locator('input[type=tel]').waitFor(); await p.waitForTimeout(800); await save(ctx, 'phone-en.json');
    const q = (t) => p.locator('.dm-q', { hasText: t }).waitFor();
    await p.fill('[data-ref=input]', '0911234567'); await next(p).click(); await q('When were you born'); await next(p).click();
    await q('Do you agree'); await opt(p, 'yes').click(); await next(p).click(); await q('Check your answers'); await next(p).click(); await p.locator('.dm-q', { hasText: 'Your account is ready' }).waitFor(); await p.waitForTimeout(800);
    await save(ctx, 'signed-en.json');
    await p.goto(B + '/passport.html', { waitUntil: 'networkidle' });
    await opt(p, 'yes').click(); await next(p).click(); await opt(p, 'screen_reader').click(); await next(p).click(); await q('anything else'); await next(p).click();
    await q('Who can see'); await opt(p, 'ask').click(); await next(p).click(); await q('Check your answers'); await next(p).click(); await p.locator('.dm-q', { hasText: 'Support Passport is saved' }).waitFor(); await p.waitForTimeout(800);
    await save(ctx, 'passport-sr.json'); await ctx.close(); }
  await browser.close();
}
const withConsent = (file, extra = {}) => { const s = JSON.parse(fs.readFileSync(path.join(STATE, file))); const o = s.origins.find(o => o.origin === B);
  for (const [k, v] of Object.entries(Object.assign({ 'savanna-onboarding.voiceConsent': 'true' }, extra))) { o.localStorage = o.localStorage.filter(x => x.name !== k); o.localStorage.push({ name: k, value: v }); } return s; };

(async () => {
  await prep();
  const st = (f) => path.join(STATE, f);

  await scene('01', '01-home.webm', { state: ls({ 'savanna-onboarding.prefs': { lang: 'en' } }) }, async (p, h) => {
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await h.ready(); h.mark('home shown'); await h.wait(RESULT);
    await h.click(p.locator('label.dm-opt:has(input[value=listen])')); h.mark('"Listen and respond" chosen');
    await h.click(p.getByRole('button', { name: 'Continue' }));
    await p.getByText('You chose: Listen and respond').waitFor(); await h.ready(); h.mark('account step: "You chose: Listen and respond", Sign up / Log in'); await h.wait(RESULT + 500);
  });

  await scene('02', '02-voice-english.webm', { state: st('name-en.json'), wav: 'meron-en.wav',
    notes: ['English voice uses the browser engine ("Voice: your browser"). In this recording machine (Chrome for Testing, cloud container) Chrome has no Google speech service, so the site shows "No microphone was found" instead of "I heard…". This is a real result, not a usable demo take: re-record this scene on a normal desktop Chrome.'] }, async (p, h) => {
    await p.goto(B + '/signup.html', { waitUntil: 'networkidle' }); await h.ready(); await p.locator('.dm-engine').waitFor(); h.mark('name question; engine line: ' + await p.locator('.dm-engine').innerText()); await h.wait(RESULT);
    await h.click(p.locator('[data-act=speak]')); h.mark('voice consent shown'); await h.wait(RESULT);
    await h.click(p.locator('[data-act=voice-allow]')); await h.wait(4000);
    h.mark('result: ' + (await p.locator('.dm-status, [role=status]').allInnerTexts()).join(' / ').replace(/\s+/g, ' ').trim()); await h.wait(RESULT);
  });

  await scene('03', '03-voice-amharic.webm', { state: withConsent('name-en.json'), wav: 'meron-am.wav' }, async (p, h) => {
    await p.goto(B + '/signup.html', { waitUntil: 'networkidle' }); await h.ready(); await h.wait(1200);
    await h.click(p.getByRole('button', { name: /Language/ }));
    await h.click(p.getByText('አማርኛ', { exact: true }).filter({ visible: true }));
    await p.waitForFunction(() => /Addis/.test((document.querySelector('.dm-engine') || {}).textContent || ''), null, { timeout: 15000 });
    await h.ready(); h.mark('Amharic; engine line: ' + await p.locator('.dm-engine').innerText());
    await h.wait(1500); await h.audioIdle(20000); await h.wait(800); // let the Amharic clips play to the end
    const mic = p.locator('[data-act=speak]');
    await h.click(mic, 200); await p.waitForFunction(() => document.querySelector('[data-act=speak]')?.getAttribute('aria-pressed') === 'true', null, { timeout: 10000 });
    h.mark('microphone on (recording)'); await h.wait(3200);
    await h.click(mic, 200); h.mark('stop pressed; sent to the site proxy (Addis AI)');
    await p.locator('[data-act=heard-yes]').waitFor({ timeout: 40000 });
    h.mark('"I heard…" shown: ' + (await p.locator('.dm-heard').innerText()).replace(/\s+/g, ' ').slice(0, 160)); await h.wait(RESULT + 500);
    await h.click(p.locator('[data-act=heard-yes]')); h.mark('answer used: ' + await p.locator('[data-ref=input]').inputValue()); await h.wait(1000); await h.audioIdle(15000); await h.wait(RESULT);
  });

  await scene('04', '04-keyboard.webm', { state: st('phone-en.json'), cursor: false }, async (p, h) => {
    await p.goto(B + '/signup.html', { waitUntil: 'networkidle' }); await h.ready(); await h.wait(3000);
    await h.tabTo(h.focusIs, 'input[type=tel]'); await h.keys('0911234567');
    await h.tabTo(h.focusText, 'Continue'); await h.key('Enter'); h.mark('phone saved');
    await p.locator('select').first().waitFor(); await h.wait(3500);
    await h.tabTo(h.focusIs, 'input[type=radio]'); // calendar choice
    if (!(await p.evaluate(() => document.activeElement.value === 'eth' && document.activeElement.checked))) { await h.key('Space'); }
    await h.tabTo(() => { const a = document.activeElement; return a.tagName === 'INPUT' && a.type !== 'radio'; }); await h.keys('12');
    await h.tabTo(h.focusIs, 'select'); for (let i = 0; i < 5; i++) await h.key('ArrowDown', 350); await h.wait();
    await h.tabTo(() => { const a = document.activeElement; return a.tagName === 'INPUT' && a.type !== 'radio' && a.dataset.ref === 'y'; }); await h.keys('1990');
    await h.tabTo(h.focusText, 'Continue'); await h.key('Enter'); h.mark('date of birth saved');
    await p.locator('input[value=yes]').waitFor(); await h.wait(3500);
    await h.tabTo(h.focusIs, 'input[type=radio]'); if (!(await p.evaluate(() => document.activeElement.value === 'yes'))) await h.key('ArrowUp'); await h.key('Space');
    await h.tabTo(h.focusText, 'Continue'); await h.key('Enter');
    await p.getByRole('button', { name: 'Create my account' }).waitFor(); h.mark('check your answers'); await h.wait(3500);
    await h.tabTo(h.focusText, 'Create my account'); await h.key('Enter');
    await p.locator('.dm-q', { hasText: 'Your account is ready' }).waitFor(); await h.ready(); h.mark('account ready'); await h.wait(RESULT + 2000);
  });

  await scene('05', '05-passport.webm', { state: st('signed-en.json'), saveState: 'passport-05.json' }, async (p, h) => {
    await p.goto(B + '/passport.html', { waitUntil: 'networkidle' }); await h.ready(); await h.wait(1500);
    await h.click(opt(p, 'yes')); await h.click(next(p));
    await opt(p, 'screen_reader').waitFor(); await h.wait(1000);
    await h.click(opt(p, 'screen_reader')); await h.click(opt(p, 'extra_time')); h.mark('Screen reader + Extra time chosen'); await h.wait(1200);
    await h.click(next(p)); await h.wait(800); await h.click(next(p)); // "anything else" is optional
    await h.click(opt(p, 'ask')); await h.click(next(p));
    await p.getByRole('button', { name: 'Save my Support Passport' }).waitFor(); h.mark('check your answers'); await h.wait(RESULT);
    await h.click(p.getByRole('button', { name: 'Save my Support Passport' }));
    await p.locator('.dm-q', { hasText: 'Support Passport is saved' }).waitFor(); h.mark('saved'); await h.wait(RESULT);
    await h.click(p.getByRole('link', { name: 'My Profile' }).filter({ visible: true })); await h.ready(); await h.wait(1200);
    await h.click(p.getByRole('link', { name: 'Open my Support Passport' })); await h.ready();
    await p.getByRole('heading', { name: 'My Support Passport' }).waitFor(); h.mark('Support Passport card shown'); await h.wait(RESULT + 1500);
  });

  const jobs = async (p, h) => {
    await p.goto(B + '/dashboard.html', { waitUntil: 'networkidle' }); await h.ready(); await h.wait(1500);
    await h.click(p.getByRole('link', { name: 'Jobs', exact: true }).filter({ visible: true })); await h.ready();
    h.mark('jobs: ' + await p.locator('#jobs-status').innerText()); await h.wait(RESULT);
    await h.click(p.locator('label:has(#flt)'), 200);
    await h.wait(400); h.mark('filter on: ' + await p.locator('#jobs-status').innerText()); await h.wait(RESULT + 1000);
  };
  await scene('06', '06-jobs.webm', { state: st('passport-05.json'), notes: ['Uses the Support Passport saved in scene 05 (Screen reader + Extra time). No demo job offers both, so the filtered list is empty ("0 jobs shown"). See 06b for a passport with Screen reader only.'] }, jobs);
  await scene('06b', '06b-jobs-screen-reader-only.webm', { state: st('passport-sr.json'), notes: ['Support Passport with Screen reader only: the filter leaves 2 jobs.'] }, jobs);

  await scene('07', '07-host-demo.webm', { state: ls({ 'savanna-onboarding.prefs': PREFS('en') }) }, async (p, h) => {
    await p.goto(B + '/host-demo/', { waitUntil: 'networkidle' }); await h.ready(); await p.locator('#slot .dm-q').waitFor(); await h.wait(1500);
    await h.click(opt(p, 'self')); await h.click(next(p));
    await h.click(p.locator('#slot [data-ref=input]')); await h.type(p.locator('#slot [data-ref=input]'), 'Meron'); await h.click(next(p));
    await h.click(p.locator('#slot [data-ref=input]')); await h.type(p.locator('#slot [data-ref=input]'), '0911234567'); await h.click(next(p));
    await h.click(next(p)); // date of birth is optional
    await h.click(opt(p, 'yes')); await h.click(next(p));
    await h.click(p.locator('#slot .dm-form button[type=submit]')); h.mark('sign-up submitted');
    const row = p.locator('#rows tr', { hasText: 'savanna-onboarding:complete' }).first(); await row.waitFor();
    await p.waitForFunction(() => ![...document.querySelectorAll('#rows .badge')].some(b => /checking/.test(b.textContent)));
    await p.evaluate(() => document.getElementById('records-h').scrollIntoView({ behavior: 'smooth', block: 'start' })); await h.wait(1500);
    h.mark('records arrived: ' + (await p.locator('#rows .badge').allInnerTexts()).join(', ')); await h.wait(RESULT);
    await h.click(row.getByRole('button'));
    await p.locator('#detail-check').waitFor(); await p.evaluate(() => document.getElementById('detail-check').scrollIntoView({ behavior: 'smooth', block: 'center' })); await h.wait(1000);
    h.mark('record detail: ' + (await p.locator('#detail-check').innerText()).replace(/\s+/g, ' ').slice(0, 160)); await h.wait(RESULT + 1500);
  });

  await scene('08', '08-fallback.webm', { state: withConsent('name-en.json', { 'savanna-onboarding.prefs': JSON.stringify(PREFS('am')) }),
    notes: ['Recording browser only: GET /api/stt (the proxy readiness check) answered with HTTP 403 for this page, so the module falls back to the browser engine. The site is unchanged.'],
    route: async (ctx, log) => ctx.route(u => /\/api\/stt$/.test(u.pathname), r => { if (r.request().method() !== 'GET') return r.continue(); log({ type: 'readiness-check-blocked', url: r.request().url() }); return r.fulfill({ status: 403, contentType: 'text/plain', body: 'blocked for this recording' }); }) }, async (p, h) => {
    await p.goto(B + '/signup.html', { waitUntil: 'networkidle' }); await h.ready();
    await p.waitForFunction(() => (document.querySelector('.dm-engine') || {}).textContent, null, { timeout: 15000 });
    h.mark('engine line: ' + await p.locator('.dm-engine').innerText()); await h.wait(4000);
    const b = await p.locator('.dm-engine').boundingBox(); await p.mouse.move(b.x + b.width + 30, b.y + b.height / 2, { steps: 22 }); await h.wait(RESULT + 2000);
  });
})();
