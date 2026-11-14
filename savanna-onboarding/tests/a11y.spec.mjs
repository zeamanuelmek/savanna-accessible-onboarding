// Automated parts of the accessibility definition of done (CLAUDE.md section 8), on every learner screen:
//  - axe-core (WCAG 2.0/2.1/2.2 A+AA + best practice): zero critical or serious violations
//  - structure: one <main> (the module adds none), one <h1>, no skipped heading levels,
//    every control is a real <button> or link, no fake buttons
//  - language of parts: Amharic text sits inside lang="am"; English sentences on an Amharic page are marked lang="en"
//  - 400% zoom: at 320 CSS px wide there is no sideways scrolling (phone project)
import { test, expect } from '@playwright/test';
import { freshStart, go, next, signupTo, axe, summarise } from './helpers.mjs';

const fakeVoice = (p, consent) => p.evaluate(c => { window.SavannaOnboarding.setSpeech({ input: { supported: () => true, start: (l, h) => { setTimeout(() => { h.result(['Abebe Kebede', 'Abebe Kebedde']); h.end(); }, 10); return { stop() {}, abort() {} }; } } }); if (c) localStorage.setItem('savanna-onboarding.voiceConsent', 'true'); }, consent);

// Savanna journey pages (Phase 8): Savanna's own frame around the module.
const at = (p, path) => p.goto(path).then(() => p.waitForFunction(() => !!window.SavannaOnboarding));
const learner = p => p.evaluate(() => {
  localStorage.setItem('savanna-onboarding.profile', JSON.stringify({ name: 'Abebe Kebede', phone: '0911234567', id_route: 'kebele', assurance_level: 'self_declared', registered_by: null }));
  localStorage.setItem('savanna-onboarding.passport', JSON.stringify({ needs: ['remote', 'captions'], sharing: 'ask' }));
  localStorage.setItem('savanna-demo.session', JSON.stringify({ at: 'x' }));
});

const screens = {
  'savanna: home': async p => at(p, '/index.html'),
  'savanna: sign-up welcome': async p => at(p, '/signup.html'),
  'savanna: sign-up question with error': async p => { await at(p, '/signup.html'); await p.locator('.dm-opt:has(input[value=read_type])').click(); await next(p); await next(p); },
  'savanna: dashboard': async p => { await at(p, '/index.html'); await learner(p); await at(p, '/dashboard.html'); },
  'savanna: menu open': async p => { await at(p, '/index.html'); await learner(p); await at(p, '/dashboard.html'); if (await p.locator('.sj-menu').getAttribute('aria-expanded') === 'false') await p.locator('.sj-menu').click(); },
  'savanna: log-in': async p => at(p, '/login.html'),
  'savanna: log-in code with error': async p => { await at(p, '/index.html'); await learner(p); await at(p, '/login.html'); await p.fill('#sj-phone', '0911234567'); await p.locator('#sj-login button[type=submit]').click(); await p.fill('#sj-code', '1'); await p.locator('#sj-login button[type=submit]').click(); await p.locator('.sj-errors').waitFor(); },
  'savanna: Support Passport card': async p => { await at(p, '/index.html'); await learner(p); await at(p, '/passport.html'); },
  'savanna: jobs': async p => { await at(p, '/index.html'); await learner(p); await at(p, '/jobs.html'); },
  'savanna: employer form': async p => at(p, '/employer.html'),
  'test host: form mounted': async p => { await at(p, '/test-host/'); await p.locator('#mount').click(); await p.locator('#slot .dm-q').waitFor(); },
  'home': async p => go(p, '#/'),
  'signup: welcome': async p => go(p, '#/signup'),
  'signup: welcome error': async p => { await go(p, '#/signup'); await next(p); },
  'signup: choice question': async p => signupTo(p, 'filler'),
  'signup: text question with error': async p => { await signupTo(p, 'name'); await next(p); },
  'signup: ID choice': async p => signupTo(p, 'id_route'),
  'signup: Ethiopian date': async p => signupTo(p, 'dob'),
  'signup: date error': async p => { await signupTo(p, 'dob'); await p.fill('[data-ref=input]', '40'); await next(p); },
  'signup: consent': async p => signupTo(p, 'consent'),
  'signup: check answers': async p => signupTo(p, 'END'),
  'signup: done': async p => { await signupTo(p, 'END'); await next(p); },
  'signup: finish later': async p => { await signupTo(p, 'name'); await p.locator('[data-act=later]').click(); },
  'voice: consent panel': async p => { await go(p, '#/'); await fakeVoice(p, false); await signupTo(p, 'name'); await p.locator('[data-act=speak]').click(); await p.locator('.dm-heard, .dm-panel [data-act=voice-allow]').first().waitFor(); },
  'voice: check what I said': async p => { await go(p, '#/'); await fakeVoice(p, true); await signupTo(p, 'name'); await p.locator('[data-act=speak]').click(); await p.locator('[data-ref=heard-edit]').waitFor(); },
  'read aloud: Listen on every answer, player showing': async p => { await signupTo(p, 'id_route'); await p.locator('[data-act=easy]').click(); await p.evaluate(() => window.SavannaOnboarding.setSpeech({ output: { speak: () => true, stop() {}, pause() {}, resume() {} } })); await p.locator('[data-act=listen]').click(); await p.locator('[data-act=stop-audio]').waitFor(); },
  'pictures and big buttons': async p => { await go(p, '#/'); await p.evaluate(() => window.SavannaOnboarding.setPrefs({ pictures: true, easy: true })); await go(p, '#/passport'); },
  'offline message on a question': async p => { await signupTo(p, 'name'); await p.context().setOffline(true); await p.locator('.dm-offline:not([hidden])').waitFor(); },
  'signup: help open': async p => { await signupTo(p, 'filler'); await p.locator('.dm-bar [data-act=help]').click(); },
  'profile: summary': async p => { await signupTo(p, 'END'); await next(p); await go(p, '#/profile'); },
  'profile: no profile yet': async p => go(p, '#/profile'),
  'passport': async p => go(p, '#/passport'),
  'passport: private card': async p => { await go(p, '#/'); await p.evaluate(() => localStorage.setItem('savanna-onboarding.passport', JSON.stringify({ needs: ['remote', 'captions'], other_need: 'x', sharing: 'trainers' }))); await go(p, '#/passport'); },
  'partner: handover': async p => { await go(p, '#/'); await p.evaluate(() => localStorage.setItem('savanna-onboarding.profile', JSON.stringify({ name: 'Selam', phone: '0922334455', id_route: 'refugee', assurance_level: 'self_declared', registered_by: { org: 'aaapd', staff: 'Hana' }, takeover_pending: true }))); await go(p, '#/passport'); },
  'partner: takeover': async p => { await go(p, '#/'); await p.evaluate(() => localStorage.setItem('savanna-onboarding.profile', JSON.stringify({ name: 'Selam', phone: '0922334455', id_route: 'refugee', assurance_level: 'self_declared', registered_by: { org: 'aaapd', staff: 'Hana' }, takeover_pending: true }))); await go(p, '#/takeover'); },
  'jobs': async p => go(p, '#/jobs'),
  'employer': async p => go(p, '#/employer'),
  'apply': async p => go(p, '#/apply/s1'),
  'settings': async p => go(p, '#/settings'),
  'high contrast: question': async p => { await p.evaluate(() => window.SavannaOnboarding.setPrefs({ contrast: 'high' })); await signupTo(p, 'filler'); },
  'large text: question': async p => { await p.evaluate(() => window.SavannaOnboarding.setPrefs({ size: 'xlarge' })); await signupTo(p, 'id_route'); }
};

/** Structural and language checks that axe does not make. Returns a list of problems (empty = pass). */
function structure(page) {
  return page.evaluate(() => {
    const problems = [];
    const visible = el => el.getClientRects().length > 0;
    const mains = document.querySelectorAll('main, [role=main]');
    if (mains.length !== 1) problems.push(`expected 1 main landmark, found ${mains.length}`);
    if (document.querySelector('savanna-onboarding-form main, savanna-onboarding-settings main, savanna-onboarding-form [role=main]')) problems.push('module adds a <main>');
    const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible);
    const h1s = hs.filter(h => h.tagName === 'H1').length;
    if (h1s !== 1) problems.push(`expected 1 visible h1, found ${h1s}`);
    let prev = 0;
    for (const h of hs) {
      const l = Number(h.tagName[1]);
      if (prev && l > prev + 1) problems.push(`heading level skips h${prev} -> h${l}: "${h.textContent.trim().slice(0, 40)}"`);
      prev = l;
    }
    document.querySelectorAll('[data-act]').forEach(el => { if (!['BUTTON', 'A'].includes(el.tagName)) problems.push(`control is a <${el.tagName.toLowerCase()}>, not a button`); });
    document.querySelectorAll('[role=button], [onclick]').forEach(el => problems.push(`fake button: ${el.outerHTML.slice(0, 60)}`));
    // language of parts
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || !visible(el) || el.closest('pre, code, script, style, [aria-hidden=true]')) continue;
      const text = n.textContent.trim();
      if (!text) continue;
      const lang = (el.closest('[lang]')?.getAttribute('lang') || '').slice(0, 2);
      if (/[ሀ-᎟]/.test(text) && lang !== 'am') problems.push(`Amharic text not marked lang="am": "${text.slice(0, 40)}"`);
      if (lang === 'am' && /\b[A-Za-z]{2,}(\s+[A-Za-z'’]+){3,}/.test(text)) problems.push(`English sentence on Amharic page without lang="en": "${text.slice(0, 50)}"`);
    }
    return problems;
  });
}

for (const lang of ['en', 'am']) {
  test.describe(`accessibility (${lang})`, () => {
    for (const [name, open] of Object.entries(screens)) {
      test(name, async ({ page }, info) => {
        await freshStart(page, { lang });
        if (name.startsWith('high contrast') || name.startsWith('large text')) await go(page, '#/');
        await open(page);
        const r = await axe(page);
        await info.attach('axe-violations.json', { body: JSON.stringify(r.all, null, 2), contentType: 'application/json' });
        if (r.minor.length) console.log(`[${info.project.name}/${lang}] ${name} minor:`, summarise(r.minor).join('\n  '));
        expect(summarise(r.serious), 'critical/serious axe violations').toEqual([]);
        expect(await structure(page), 'structure and language problems').toEqual([]);
        if (info.project.name === 'mobile') {
          await page.setViewportSize({ width: 320, height: 640 }); // = 1280px at 400% zoom
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow, 'sideways scrolling at 320px (400% zoom)').toBeLessThanOrEqual(0);
        }
      });
    }
  });
}
