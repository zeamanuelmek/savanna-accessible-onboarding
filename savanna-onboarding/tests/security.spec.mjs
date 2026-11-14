// Phase 9: privacy and security checks that a machine can make (docs/privacy-security.md has the full review).
// - every page is served with the security headers from vercel.json (the test server uses the same file)
// - no page breaks the Content Security Policy
// - during the whole gate task nothing is requested from any other site (no CDN, no analytics, no fonts from Google)
// - no secrets in the repository
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { freshStart, pick, next } from './helpers.mjs';

const PAGES = ['/index.html', '/signup.html', '/login.html', '/dashboard.html', '/profile.html', '/passport.html', '/jobs.html',
  '/apply.html?job=s1', '/employer.html', '/settings.html', '/takeover.html', '/showroom.html', '/test-host/'];

test('every page has the security headers', async ({ page }) => {
  for (const p of PAGES) {
    const res = await page.goto(p);
    const h = res.headers();
    expect(h['content-security-policy'], p).toContain("script-src 'self'");
    expect(h['content-security-policy'], p).toContain("object-src 'none'");
    expect(h['x-content-type-options'], p).toBe('nosniff');
    expect(h['referrer-policy'], p).toBe('no-referrer');
    expect(h['permissions-policy'], p).toContain('camera=()');
    expect(h['x-frame-options'], p).toBe('SAMEORIGIN');
  }
});

test('no page breaks the Content Security Policy', async ({ page }) => {
  const problems = [];
  page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) problems.push(m.text()); });
  await freshStart(page, { lang: 'en' });
  await page.goto('/index.html');
  await page.evaluate(() => {
    localStorage.setItem('savanna-onboarding.profile', JSON.stringify({ name: 'Abebe', phone: '0911234567', id_route: 'kebele', assurance_level: 'self_declared' }));
    localStorage.setItem('savanna-onboarding.passport', JSON.stringify({ needs: ['remote'], sharing: 'ask' }));
    localStorage.setItem('savanna-demo.session', '{"at":"x"}');
  });
  for (const p of PAGES) { await page.goto(p); await page.waitForFunction(() => !!window.SavannaOnboarding); await page.waitForTimeout(150); }
  await page.goto('/test-host/');
  await page.locator('#mount').click();
  await page.locator('#slot .dm-q').waitFor();
  expect(problems).toEqual([]);
});

test('during the gate task nothing is requested from any other site', async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin, elsewhere = [];
  page.on('request', r => { const u = new URL(r.url()); if (/^https?:$/.test(u.protocol) && u.origin !== origin) elsewhere.push(r.url()); });
  await freshStart(page, { lang: 'en' });
  await page.goto('/index.html');
  await page.locator('.sj-hero a[href="signup.html"]').click();
  await page.waitForSelector('.dm-q');
  await pick(page, 'read_type'); await next(page);
  await pick(page, 'self'); await next(page);
  await page.fill('[data-ref=input]', 'Abebe'); await next(page);
  await page.fill('[data-ref=input]', '0911234567'); await next(page);
  await pick(page, 'kebele'); await next(page); await next(page); await next(page);
  await pick(page, 'yes'); await next(page); await next(page);
  await page.locator('.dm-done-slot a[href="passport.html"]').click();
  await page.waitForSelector('.dm-q');
  await pick(page, 'yes'); await next(page);
  await pick(page, 'remote'); await next(page); await next(page); await next(page); await next(page);
  await expect(page.locator('.dm-q')).toContainText('Support Passport is saved');
  expect(elsewhere).toEqual([]);
});

test('no secrets in the repository (keys, tokens, passwords, private keys, .env files)', async () => {
  const root = path.resolve(process.cwd(), '..');
  const skip = /(^|[\\/])(node_modules|\.git|test-results|playwright-report|fonts|img)([\\/]|$)/;
  const PATTERNS = [
    [/-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/, 'private key'],
    [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
    [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/, 'GitHub token'],
    [/\bsk-[A-Za-z0-9]{32,}\b/, 'API secret key'],
    [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, 'Slack token'],
    [/\bAIza[0-9A-Za-z_-]{35}\b/, 'Google API key'],
    [/(api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"'\s]{12,}["']/i, 'hard-coded credential']
  ];
  const found = [];
  (function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (skip.test(full)) continue;
      const st = fs.statSync(full);
      if (st.isDirectory()) { walk(full); continue; }
      if (/^\.env/.test(f)) found.push(`${path.relative(root, full)}: .env file`);
      if (st.size > 2e6 || /\.(woff2?|ttf|png|jpe?g|mp3|m4a|riv|svg)$/i.test(f)) continue;
      const text = fs.readFileSync(full, 'utf8');
      for (const [re, what] of PATTERNS) if (re.test(text)) found.push(`${path.relative(root, full)}: ${what}`);
    }
  })(root);
  expect(found).toEqual([]);
});
