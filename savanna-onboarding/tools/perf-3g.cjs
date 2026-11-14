// Cheap phone on 3G: runs the gate task ("sign up for Savanna and save a Support Passport") on a small, slow Android
// phone profile with Chrome DevTools' "Slow 3G" network and a 4x slower CPU, and reports page weight and timings.
//
//   node tools/perf-3g.cjs [base URL]        (default: the live demo)
//
// Network: 2000 ms latency, 50 KB/s down and up (Chrome DevTools "Slow 3G"). CPU: 4x slowdown. Device: Moto G4 profile.
// A first visit, with an empty cache, like a learner opening the link for the first time.
const { chromium, devices } = require('@playwright/test');

const BASE = (process.argv[2] || 'https://savanna-accessible-onboarding.vercel.app').replace(/\/$/, '');
const KB = n => (n / 1024).toFixed(0) + ' KB';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices['Moto G4'], serviceWorkers: 'block' });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 2000, downloadThroughput: 50 * 1024, uploadThroughput: 50 * 1024 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  // bytes on the wire, per request, as Chrome reports them
  const sizes = new Map(), urls = new Map();
  cdp.on('Network.requestWillBeSent', e => urls.set(e.requestId, e.request.url));
  cdp.on('Network.loadingFinished', e => sizes.set(e.requestId, e.encodedDataLength));
  const wire = () => [...sizes.values()].reduce((a, b) => a + b, 0);

  const t0 = Date.now();
  await page.goto(BASE + '/index.html', { waitUntil: 'load', timeout: 300000 });
  const firstLoad = Date.now() - t0;
  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0], p = performance.getEntriesByType('paint');
    const fcp = p.find(x => x.name === 'first-contentful-paint');
    return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), fcp: fcp ? Math.round(fcp.startTime) : null };
  });
  const firstBytes = wire(), firstRequests = sizes.size;
  const biggest = [...sizes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => `${KB(n)}  ${(urls.get(id) || '').replace(BASE, '')}`);

  // the gate task, with automated taps (no reading or thinking time)
  await page.evaluate(() => localStorage.setItem('savanna-onboarding.prefs', JSON.stringify({ lang: 'en' })));
  const pick = v => page.locator(`.dm-opt:has(input[value="${v}"])`).first().click();
  const next = () => page.locator('.dm-form button[type=submit]').click();
  const t1 = Date.now();
  await page.goto(BASE + '/signup.html', { timeout: 300000 });
  await page.waitForSelector('.dm-q', { timeout: 300000 });
  const signupReady = Date.now() - t1;
  await pick('read_type'); await next();
  await pick('self'); await next();
  await page.fill('[data-ref=input]', 'Abebe'); await next();
  await page.fill('[data-ref=input]', '0911234567'); await next();
  await pick('kebele'); await next(); await next(); await next();
  await pick('yes'); await next(); await next();
  await page.locator('.dm-done-slot a[href="passport.html"]').click();
  await page.waitForSelector('.dm-q', { timeout: 300000 });
  await pick('yes'); await next();
  await pick('remote'); await next(); await next(); await next(); await next();
  await page.waitForSelector('text=Your Support Passport is saved', { timeout: 300000 });
  const gate = Date.now() - t1;

  const out = {
    base: BASE, profile: 'Moto G4, Slow 3G (2000 ms, 50 KB/s), CPU 4x slower, empty cache, service worker off',
    firstPage: { url: '/index.html', bytesOnWire: firstBytes, requests: firstRequests, firstContentfulPaintMs: nav.fcp, domContentLoadedMs: nav.dcl, loadMs: nav.load, wallClockMs: firstLoad, biggest },
    signupFirstQuestionMs: signupReady,
    gateTaskMs: gate, totalBytesOnWire: wire(), totalRequests: sizes.size
  };
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
