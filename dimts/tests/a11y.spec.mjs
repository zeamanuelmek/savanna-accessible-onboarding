// Baseline: axe-core scan of every learner-facing screen.
// Pass = no critical or serious violations. Minor ones are logged, not failed.
import { test, expect } from '@playwright/test';
import { freshStart, go, pick, next, signupTo, axe, summarise } from './helpers.mjs';

const screens = {
  'home': async p => go(p, '#/'),
  'signup: welcome': async p => go(p, '#/signup'),
  'signup: welcome error': async p => { await go(p, '#/signup'); await next(p); },
  'signup: choice question': async p => signupTo(p, 'filler'),
  'signup: text question with error': async p => { await signupTo(p, 'name'); await next(p); },
  'signup: ID choice': async p => signupTo(p, 'id_route'),
  'signup: Ethiopian date': async p => signupTo(p, 'dob'),
  'signup: date error': async p => { await signupTo(p, 'dob'); await p.fill('#dm-input', '40'); await next(p); },
  'signup: consent': async p => signupTo(p, 'consent'),
  'signup: check answers': async p => signupTo(p, 'END'),
  'signup: done': async p => { await signupTo(p, 'END'); await next(p); },
  'signup: finish later': async p => { await signupTo(p, 'name'); await p.locator('[data-act=later]').click(); },
  'signup: help open': async p => { await signupTo(p, 'filler'); await p.locator('.dm-bar [data-act=help]').click(); },
  'passport': async p => go(p, '#/passport'),
  'jobs': async p => go(p, '#/jobs'),
  'employer': async p => go(p, '#/employer'),
  'apply': async p => go(p, '#/apply/s1'),
  'settings': async p => go(p, '#/settings'),
  'developers page': async p => go(p, '#/developers'),
  'high contrast: question': async p => { await p.evaluate(() => window.Dimts.setPrefs({ contrast: 'high' })); await signupTo(p, 'filler'); },
  'large text: question': async p => { await p.evaluate(() => window.Dimts.setPrefs({ size: 'xlarge' })); await signupTo(p, 'id_route'); }
};

for (const lang of ['en', 'am']) {
  test.describe(`axe baseline (${lang})`, () => {
    for (const [name, open] of Object.entries(screens)) {
      test(name, async ({ page }, info) => {
        await freshStart(page, { lang });
        if (name.startsWith('high contrast') || name.startsWith('large text')) await go(page, '#/');
        await open(page);
        const r = await axe(page);
        await info.attach('axe-violations.json', { body: JSON.stringify(r.all, null, 2), contentType: 'application/json' });
        if (r.minor.length) console.log(`[${info.project.name}/${lang}] ${name} minor:`, summarise(r.minor).join('\n  '));
        expect(summarise(r.serious), 'critical/serious axe violations').toEqual([]);
      });
    }
  });
}
