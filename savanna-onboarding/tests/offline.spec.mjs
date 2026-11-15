// Phase 6 (minimum offline): the service worker keeps the module, pages, fonts and styles on the device; pages open
// again with no connection; the learner is told when they are offline; answers stay saved; voice says it needs a
// connection. (The tests switch the network off with the browser's own offline mode.)
import { test, expect } from '@playwright/test';
import { freshStart, pick, next } from './helpers.mjs';
import fs from 'node:fs';
import path from 'node:path';

const at = (page, path) => page.goto(path).then(() => page.waitForFunction(() => !!window.SavannaOnboarding));
async function swReady(page) {
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  // wait until the install step has saved the core files
  await expect.poll(() => page.evaluate(async () => {
    const c = await caches.open('savanna-onboarding-v5');
    return (await c.keys()).map(r => new URL(r.url).pathname);
  }), { timeout: 15000 }).toEqual(expect.arrayContaining(['/savanna-onboarding.js', '/forms.js', '/signup.html', '/assets/fonts/noto-sans-ethiopic-ethiopic.woff2', '/vendor/savanna-static-pages/assets/css/application_alx.css', '/assets/audio/manifest.json']));
}

test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); });

test('the module, pages, fonts and Savanna styles are kept on the device after one visit', async ({ page }) => {
  await at(page, '/index.html');
  await swReady(page);
});

test('with no connection, Savanna sign-up still opens, answers are kept, and the learner is told they are offline', async ({ page, context }) => {
  await at(page, '/index.html');
  await swReady(page);
  await context.setOffline(true);
  await at(page, '/signup.html');
  await expect(page.locator('.dm-q')).toBeVisible();
  await expect(page.locator('.dm-offline')).toContainText('You are offline');
  await expect(page.locator('.dm-offline')).toHaveAttribute('role', 'status');
  await pick(page, 'read_type'); await next(page);
  await pick(page, 'self'); await next(page);
  await page.fill('[data-ref=input]', 'Offline Learner'); await next(page);
  const draft = await page.evaluate(() => localStorage.getItem('savanna-onboarding.draft.signup'));
  expect(draft).toContain('Offline Learner');
  await context.setOffline(false);
  await expect(page.locator('.dm-offline')).toContainText('You are back online');
});

test('the message appears and goes when the connection drops and returns while answering', async ({ page, context }) => {
  await at(page, '/showroom.html#/signup');
  await expect(page.locator('.dm-offline')).toBeHidden();
  await context.setOffline(true);
  await expect(page.locator('.dm-offline')).toBeVisible();
  await expect(page.locator('.dm-offline')).toContainText('Voice answers need a connection');
  await context.setOffline(false);
  await expect(page.locator('.dm-offline')).toContainText('back online');
});

test('pages without a form (dashboard, jobs) also say they are offline', async ({ page, context }) => {
  await at(page, '/index.html');
  await swReady(page);
  await at(page, '/jobs.html');
  await context.setOffline(true);
  await expect(page.locator('#sj-offline')).toContainText('You are offline');
  await at(page, '/jobs.html');
  await expect(page.locator('.sj h1')).toHaveText('Jobs');
  await expect(page.locator('#sj-offline')).toBeVisible();
});

test('voice input says at once that it needs a connection when offline', async ({ page, context }) => {
  await page.addInitScript(() => {
    localStorage.setItem('savanna-onboarding.voiceConsent', 'true');
    window.SpeechRecognition = class { start() { window.__started = true; } stop() {} abort() {} };
  });
  await at(page, '/showroom.html#/signup');
  await pick(page, 'read_type'); await next(page);
  await pick(page, 'self'); await next(page);
  await context.setOffline(true);
  await page.locator('[data-act=speak]').click();
  await expect(page.locator('.dm-status')).toContainText('Voice answers need an internet connection');
  expect(await page.evaluate(() => !!window.__started)).toBe(false);
});

test('a recorded clip is kept for offline use the first time it is played', async ({ page, context }) => {
  // a temporary clip in a test-only language folder (removed afterwards)
  const dir = path.join(process.cwd(), 'assets', 'audio', 'zz'), file = path.join(dir, 'test-clip.mp3');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, Buffer.from('ID3' + 'x'.repeat(200)));
  try {
    await at(page, '/index.html');
    await swReady(page);
    const first = await page.evaluate(async () => (await fetch('assets/audio/zz/test-clip.mp3', { headers: { Range: 'bytes=0-' } })).status);
    expect(first).toBe(200); // the whole file, even when a media player asks for a byte range
    await expect.poll(() => page.evaluate(async () => !!(await (await caches.open('savanna-onboarding-v5')).match('/assets/audio/zz/test-clip.mp3')))).toBe(true);
    await context.setOffline(true);
    const again = await page.evaluate(async () => { const r = await fetch('assets/audio/zz/test-clip.mp3'); return [r.status, (await r.text()).slice(0, 3)]; });
    expect(again).toEqual([200, 'ID3']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
