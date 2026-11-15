// Phase 9: automated dry run of the judging gate's main task — "sign up for Savanna and save a Support Passport" —
// inside the Savanna pages, with the KEYBOARD ONLY, at 200% ZOOM and with SOUND OFF, on phone and desktop sizes.
// At every Tab stop: a visible focus outline, fully on screen, not hidden under the fixed header (WCAG 2.4.7, 2.4.11),
// and no sideways scrolling (1.4.10). axe-core on every screen of the task: zero critical or serious issues.
// This is evidence for the gate, not a replacement for the co-designer session with NVDA and TalkBack.
import { test, expect } from '@playwright/test';
import { freshStart, axe, summarise } from './helpers.mjs';

test('GATE dry run: keyboard only, 200% zoom, sound off', async ({ page }, info) => {
  test.setTimeout(240000);
  // Sound off: no speech, no audio at all. The task must not need it.
  await page.addInitScript(() => {
    delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; delete window.SpeechRecognition; delete window.webkitSpeechRecognition;
    window.Audio = function () { throw new Error('sound is off'); };
  });
  // 200% zoom. Desktop: a 1280×800 screen at 200% is 640×400 CSS pixels. Phone: text at 200% (Android "font size").
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 640, height: 400 });
  // (applied from the very start, as a phone's own text setting is; see DEVELOPMENT_PROGRESS Phase 9)
  else await page.addInitScript(() => { document.documentElement.style.fontSize = '200%'; });
  // Savanna's Bootstrap scrolls smoothly; 'reduce motion' (a setting some learners use) makes it instant, so each focus
  // position can be measured at once. Where things end up is the same either way.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await freshStart(page, { lang: 'en' });

  const stops = [], screens = [];
  const axeErrors = [];
  async function checkScreen(name) {
    screens.push(name);
    const r = await axe(page);
    if (r.serious.length) axeErrors.push(name + ': ' + summarise(r.serious).join('; '));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) axeErrors.push(`${name}: sideways scrolling by ${overflow}px`);
  }
  async function tabTo(selector, max = 60) {
    for (let i = 0; i < max; i++) {
      await page.keyboard.press('Tab');
      // Savanna's Bootstrap scrolls smoothly: measure once the scroll has settled
      await page.evaluate(() => new Promise(done => { let last = -1, same = 0; const tick = () => { if (scrollY === last && ++same > 2) return done(); if (scrollY !== last) same = 0; last = scrollY; requestAnimationFrame(tick); }; tick(); setTimeout(done, 2000); }));
      const s = await page.evaluate(sel => {
        const el = document.activeElement, cs = getComputedStyle(el), r = el.getBoundingClientRect();
        const header = document.querySelector('.sj-header'), hb = header ? header.getBoundingClientRect().bottom : 0;
        return {
          match: el.matches(sel), tag: el.tagName, name: (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().slice(0, 30),
          outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2,
          onScreen: r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight + 0.5 && r.right <= innerWidth + 0.5,
          // not hidden behind the fixed header (or anything else): what is drawn at the item's centre is the item itself
          clearOfHeader: (() => { const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(innerHeight - 1, Math.max(0, r.top + Math.min(r.height / 2, 20))); const hit = document.elementFromPoint(x, y); return !!hit && (hit === el || el.contains(hit) || (el.labels && [...el.labels].some(l => l.contains(hit)))); })()
        };
      }, selector);
      stops.push(s);
      if (s.match) return;
    }
    throw new Error('could not reach ' + selector + ' with Tab');
  }
  const enter = () => page.keyboard.press('Enter'), space = () => page.keyboard.press('Space');
  const heading = async () => (await page.locator('.dm-q').first().innerText()).trim();

  await page.goto('/index.html');
  await page.waitForFunction(() => !!window.SavannaOnboarding);
  await checkScreen('Savanna home: how would you like to use Savanna?');
  await tabTo('input[name=mode]'); await space(); // Read and type
  await tabTo('#sj-mode button[type=submit]'); await enter();
  await checkScreen('Savanna home: sign up or log in');
  await tabTo('.sj-split a[href="signup.html"]'); await enter();
  await page.waitForSelector('.dm-q');
  await checkScreen('who is filling in');
  await tabTo('input[name=v]'); await space(); // Me, for myself
  await tabTo('button[type=submit]'); await enter();
  expect(await heading()).toBe('What should we call you?');
  await checkScreen('name');
  await tabTo('[data-ref=input]'); await page.keyboard.type('Abebe'); await enter();
  await tabTo('[data-ref=input]'); await page.keyboard.type('0911234567'); await enter();
  await checkScreen('ID type');
  await tabTo('input[name=v]'); await page.keyboard.press('ArrowDown'); // Kebele ID (arrow keys inside the group)
  await tabTo('button[type=submit]'); await enter();
  await tabTo('[data-ref=input]'); await enter(); // ID number: skip
  await checkScreen('date of birth');
  await tabTo('button[type=submit]'); await enter(); // date: skip
  await tabTo('input[name=v]'); await space(); // consent: yes
  await tabTo('button[type=submit]'); await enter();
  expect(await heading()).toBe('Check your answers');
  await checkScreen('check your answers');
  await tabTo('button[type=submit]'); await enter();
  expect(await heading()).toContain('Your account is ready');
  await checkScreen('account ready');
  await tabTo('.dm-done-slot a[href="passport.html"]'); await enter();
  await page.waitForSelector('.dm-q');
  await checkScreen('Support Passport: would you like');
  await tabTo('input[name=v]'); await space(); // yes
  await tabTo('button[type=submit]'); await enter();
  await checkScreen('Support Passport: what would help');
  await tabTo('input[name=v]'); await space(); // first support need
  await tabTo('button[type=submit]'); await enter();
  await tabTo('button[type=submit]'); await enter(); // anything else: skip
  await checkScreen('who can see this');
  await tabTo('button[type=submit]'); await enter(); // only me (preselected)
  await tabTo('button[type=submit]'); await enter(); // save
  expect(await heading()).toContain('Your Support Passport is saved');
  await checkScreen('saved');

  const noOutline = stops.filter(s => !s.outline).map(s => `${s.tag} "${s.name}"`);
  const offScreen = stops.filter(s => !s.onScreen).map(s => `${s.tag} "${s.name}"`);
  const underHeader = stops.filter(s => !s.clearOfHeader).map(s => `${s.tag} "${s.name}"`);
  await info.attach('gate-dry-run.json', { body: JSON.stringify({ project: info.project.name, screens, tabStops: stops.length }, null, 2), contentType: 'application/json' });
  console.log(`[gate ${info.project.name}] ${screens.length} screens, ${stops.length} Tab stops, keyboard only, 200% zoom, sound off`);
  expect(axeErrors, 'axe critical/serious or sideways scrolling').toEqual([]);
  expect(noOutline, 'Tab stops without a visible focus outline').toEqual([]);
  expect(offScreen, 'Tab stops not fully on screen').toEqual([]);
  expect(underHeader, 'Tab stops hidden under the fixed header').toEqual([]);
  const pp = await page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.passport')));
  expect(pp.sharing).toBe('ask');
});

test('privacy: the learner can delete their data from the dashboard (the consent promises it)', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await page.goto('/index.html');
  await page.evaluate(() => {
    localStorage.setItem('savanna-onboarding.profile', JSON.stringify({ name: 'Abebe', phone: '0911234567', id_route: 'kebele', assurance_level: 'self_declared' }));
    localStorage.setItem('savanna-onboarding.passport', JSON.stringify({ needs: ['remote'], sharing: 'ask' }));
    localStorage.setItem('savanna-onboarding.applications', '[]');
    localStorage.setItem('savanna-onboarding.draft.passport', '{"answers":{"want":"yes"}}');
    localStorage.setItem('savanna-demo.session', '{"at":"x"}');
  });
  await page.goto('/dashboard.html');
  const del = page.getByRole('button', { name: 'Delete my data' });
  await expect(del).toHaveAttribute('aria-expanded', 'false');
  await del.click();
  await expect(page.locator('#sj-del-no')).toBeFocused();
  await page.locator('#sj-del-no').click(); // changed my mind
  await expect(del).toBeFocused();
  expect(await page.evaluate(() => !!localStorage.getItem('savanna-onboarding.profile'))).toBe(true);
  await del.click();
  await page.locator('#sj-del-yes').click();
  await page.waitForURL('**/index.html');
  await expect(page.locator('#sj-view .notice')).toContainText('Your data was deleted from this phone.');
  const left = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('savanna-')).sort());
  expect(left).toEqual(['savanna-onboarding.prefs']); // only the settings stay
});
