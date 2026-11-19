// Pitch-day screenshots (21 Nov) at 1440×900, from the LIVE site by default, into ../pitch-screenshots/.
//   node tools/pitch-screenshots.mjs                    (BASE=https://savanna-accessible-onboarding.vercel.app)
//   BASE=http://localhost:8080 node tools/pitch-screenshots.mjs
// The voice shots are REAL: Chrome's fake microphone plays one of our recorded Amharic clips
// (assets/audio/am/signup-filler-option-self.mp3, "እኔ፣ ለራሴ" = "Me, for myself"), the module records it and sends it to
// the site's speech proxy, and the "I heard…" panel shows what Addis AI returned. Needs ffmpeg (to make the WAV).
// Prints a JSON summary of what was verified (engine lines, transcripts, schema results).
import { chromium } from '@playwright/test';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(ROOT, '..', 'pitch-screenshots');
const BASE = (process.env.BASE || 'https://savanna-accessible-onboarding.vercel.app').replace(/\/$/, '');
const VIEW = { width: 1440, height: 900 };
fs.mkdirSync(OUT, { recursive: true });
const summary = { base: BASE, at: new Date().toISOString(), shots: [], checks: {} };

// The fake microphone: the recorded clip, then 3 seconds of silence, played once.
const wav = path.join(os.tmpdir(), 'savanna-fake-mic.wav');
const ff = spawnSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-v', 'error', '-i', path.join(ROOT, 'assets/audio/am/signup-filler-option-self.mp3'),
  '-af', 'apad=pad_dur=3', '-ac', '1', '-ar', '48000', '-sample_fmt', 's16', wav]);
if (ff.status !== 0) { console.error('ffmpeg failed: ' + ff.stderr); process.exit(1); }

const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + wav + '%noloop', '--autoplay-policy=no-user-gesture-required'] });

/** A new learner on a clean device: chosen language, automatic reading off (screenshots are silent). */
async function learner({ lang = 'en', consent = false, signedIn = false } = {}) {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, permissions: ['microphone'], reducedMotion: 'reduce' });
  await ctx.addInitScript(([l, c, s]) => {
    if (sessionStorage.getItem('__seeded')) return;
    localStorage.clear();
    localStorage.setItem('savanna-onboarding.prefs', JSON.stringify({ lang: l, autoRead: 'off' }));
    if (c) localStorage.setItem('savanna-onboarding.voiceConsent', 'true'); // the learner agreed to voice earlier
    if (s) {
      localStorage.setItem('savanna-onboarding.profile', JSON.stringify({ name: 'Abebe Kebede', phone: '0911234567', id_route: null, assurance_level: 'no_id_yet', registered_by: null }));
      localStorage.setItem('savanna-onboarding.passport', JSON.stringify({ needs: ['screen_reader', 'captions', 'remote'], sharing: 'ask', updated: new Date().toISOString() }));
      localStorage.setItem('savanna-demo.session', JSON.stringify({ at: new Date().toISOString() }));
    }
    sessionStorage.setItem('__seeded', '1');
  }, [lang, consent, signedIn]);
  const page = await ctx.newPage();
  return { ctx, page };
}
async function at(page, p) { await page.goto(BASE + p, { waitUntil: 'networkidle' }); await page.waitForFunction(() => !!window.SavannaOnboarding); await page.evaluate(() => document.fonts.ready); }
async function shot(page, name, what) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, name) });
  summary.shots.push({ file: 'pitch-screenshots/' + name, what });
  console.log('saved', name);
}
const next = page => page.locator('.dm-form button[type=submit]').click();
const pick = (page, v) => page.locator(`.dm-opt:has(input[value="${v}"])`).first().click();
/** Sign-up up to the given question, typing (as a learner who chose "speak" on the welcome screen). */
async function signupTo(page, stop, mode = 'speak') {
  await at(page, '/signup.html');
  await pick(page, mode); await next(page);
  if (stop === 'filler') return;
  await pick(page, 'self'); await next(page);
}
/** Answer by voice through the fake microphone: press, let the clip play, press Stop, wait for "I heard…". */
async function speakLive(page) {
  const mic = page.locator('[data-act=speak]');
  await mic.click();
  await page.waitForFunction(() => document.querySelector('[data-act=speak]')?.getAttribute('aria-pressed') === 'true');
  await page.waitForTimeout(3500);
  await mic.click();
  await page.locator('.dm-heard, [data-ref=heard-edit], .dm-status:has-text("…")').first().waitFor({ timeout: 30000 }).catch(() => {});
  await page.waitForFunction(() => document.querySelector('[data-act=heard-yes]') || /service|አገልግሎት|not|አል/.test(document.querySelector('.dm-status')?.textContent || ''), null, { timeout: 30000 });
}

try {
  // 1. Savanna home page
  { const { ctx, page } = await learner(); await at(page, '/index.html'); await shot(page, '01-savanna-home.png', 'The Savanna home page (ALX starter pages) with the module'); await ctx.close(); }

  // 2. A sign-up question with Listen and Answer by voice (English: the browser's own recognition)
  { const { ctx, page } = await learner({ lang: 'en' }); await signupTo(page, 'name');
    await page.locator('[data-act=speak]').waitFor();
    summary.checks.englishEngineLine = await page.locator('.dm-engine').innerText().catch(() => '(none)');
    await shot(page, '02-signup-listen-and-voice.png', 'Sign-up question "What should we call you?" with Listen and Answer by voice; engine line: ' + summary.checks.englishEngineLine);
    await ctx.close(); }

  // 3. "I heard…" voice review: Amharic, LIVE Addis AI, on "Who is filling in this form?" (a recorded clip as the voice)
  { const { ctx, page } = await learner({ lang: 'am', consent: true }); await signupTo(page, 'filler');
    await page.locator('.dm-engine').waitFor(); await page.waitForTimeout(800);
    summary.checks.amharicEngineLineFiller = await page.locator('.dm-engine').innerText();
    const stt = page.waitForResponse(r => r.url().includes('/api/stt?lang=am'), { timeout: 40000 }).catch(() => null);
    await speakLive(page);
    const r = await stt; summary.checks.liveSttFiller = r ? { status: r.status(), body: await r.text().catch(() => '') } : 'no request (browser engine used)';
    summary.checks.heardFiller = await page.locator('.dm-heard').innerText().catch(() => page.locator('.dm-status').innerText());
    await shot(page, '03-voice-i-heard.png', '"I heard…" review after a real Amharic voice answer transcribed live by Addis AI');
    await ctx.close(); }

  // 3b. (check, no screenshot) the same live path on the NAME question
  { const { ctx, page } = await learner({ lang: 'am', consent: true }); await signupTo(page, 'name');
    await page.locator('.dm-engine').waitFor(); await page.waitForTimeout(800);
    summary.checks.amharicEngineLineName = await page.locator('.dm-engine').innerText();
    const stt = page.waitForResponse(r => r.url().includes('/api/stt?lang=am'), { timeout: 40000 }).catch(() => null);
    await speakLive(page);
    const r = await stt; summary.checks.liveSttName = r ? { status: r.status(), body: await r.text().catch(() => '') } : 'no request';
    summary.checks.heardNameEditable = await page.locator('[data-ref=heard-edit]').inputValue().catch(() => '(no review panel)');
    await ctx.close(); }

  // 4. The Support Passport card
  { const { ctx, page } = await learner({ signedIn: true }); await at(page, '/passport.html'); await shot(page, '04-support-passport-card.png', 'The private Support Passport card'); await ctx.close(); }

  // 5. Jobs with the private filter on
  { const { ctx, page } = await learner({ signedIn: true }); await at(page, '/jobs.html');
    const f = page.locator('#flt'); if (await f.count()) { await f.check(); await page.waitForTimeout(300); }
    summary.checks.jobsStatus = await page.locator('#jobs-status').innerText().catch(() => '');
    await shot(page, '05-jobs-private-filter.png', 'Jobs with the on-device "support I need" filter on: ' + summary.checks.jobsStatus); await ctx.close(); }

  // 6. The host demo with saved records (sign-up and Support Passport completed through the public API)
  { const { ctx, page } = await learner({ lang: 'en' }); await at(page, '/host-demo/');
    await page.locator('#slot .dm-q').waitFor();
    await pick(page, 'self'); await next(page);
    await page.fill('#slot [data-ref=input]', 'Abebe Kebede'); await next(page);
    await page.fill('#slot [data-ref=input]', '0911234567'); await next(page);
    await next(page); await pick(page, 'yes'); await next(page);
    await page.locator('#slot .dm-form button[type=submit]').click();
    await page.locator('input[name=form][value=passport]').check(); await page.locator('#mount').click();
    await pick(page, 'yes'); await next(page); await pick(page, 'screen_reader'); await pick(page, 'captions'); await next(page);
    await next(page); await next(page); await page.locator('#slot .dm-form button[type=submit]').click();
    await page.locator('#rows tr', { hasText: 'savanna-onboarding:complete' }).first().waitFor();
    await page.waitForFunction(() => ![...document.querySelectorAll('#rows .badge')].some(b => b.textContent.includes('checking')));
    const verdicts = await page.locator('#rows .badge').allInnerTexts();
    summary.checks.hostDemo = { records: verdicts.length, pass: verdicts.filter(v => v === 'Pass').length, fail: verdicts.filter(v => v === 'Fail').length };
    await page.locator('#rows tr', { hasText: 'savanna-onboarding:complete' }).first().getByRole('button').click();
    summary.checks.hostDemoDetail = await page.locator('#detail-check').innerText();
    await page.locator('#records-h').scrollIntoViewIfNeeded(); await page.evaluate(() => document.getElementById('records-h').scrollIntoView({ block: 'start' }));
    await shot(page, '06-host-demo-records.png', 'Host demo: "Records received by the platform", each checked against the JSON Schema (' + summary.checks.hostDemo.pass + ' pass, ' + summary.checks.hostDemo.fail + ' fail)');
    await ctx.close(); }

  // 7. The Accessibility menu open
  { const { ctx, page } = await learner(); await at(page, '/index.html'); await page.locator('.sj-a11y-btn').click(); await page.locator('#sj-a11y-panel').waitFor();
    await shot(page, '07-accessibility-menu.png', 'The Accessibility menu open on the Savanna home page'); await ctx.close(); }

  // 8. One Amharic screen: the name question, with the engine line
  { const { ctx, page } = await learner({ lang: 'am' }); await signupTo(page, 'name'); await page.locator('.dm-engine').waitFor(); await page.waitForTimeout(800);
    await shot(page, '08-amharic-screen.png', 'Amharic sign-up question with Listen and Answer by voice; engine line: ' + await page.locator('.dm-engine').innerText()); await ctx.close(); }
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'README.md'), '# Pitch screenshots\n\nCaptured ' + summary.at + ' from ' + summary.base + ' at 1440×900 by `savanna-onboarding/tools/pitch-screenshots.mjs`.\n\n' +
    summary.shots.map(s => '- `' + path.basename(s.file) + '`: ' + s.what).join('\n') + '\n\nVoice shots: a recorded Amharic clip ("እኔ፣ ለራሴ") played into Chrome\'s fake microphone; the transcript is what the live speech proxy returned.\n');
  console.log(JSON.stringify(summary, null, 2));
}
