// Phase 5: identity and private support. Honest trust badges (never "verified"), the private Support Passport card
// with revocable sharing, sharing with employers only per application, and the learner takeover after partner sign-up.
import { test, expect } from '@playwright/test';
import { freshStart, go, pick, next, heading, signupTo } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); });

const profile = page => page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.profile') || 'null'));
const fill = (page, v) => page.fill('[data-ref=input]', v);

/** Partner-assisted sign-up, up to and including "Create my account". */
async function partnerSignup(page, { idRoute = 'refugee', number = '' } = {}) {
  await go(page, '#/'); // a different page first, so the sign-up form is drawn afresh
  await go(page, '#/signup');
  await pick(page, 'read_type'); await next(page);
  await pick(page, 'partner'); await next(page);
  await pick(page, 'aaapd'); await next(page);
  await fill(page, 'Hana Staff'); await next(page);
  await pick(page, 'yes'); await next(page);
  await fill(page, 'Selam Bekele'); await next(page);
  await fill(page, '0922334455'); await next(page);
  await pick(page, idRoute); await next(page);
  if (idRoute === 'none') { await pick(page, 'aaapd'); await next(page); }
  else { if (number) await fill(page, number); await next(page); }
  await next(page); // date of birth: optional
  await pick(page, 'yes'); await next(page);
  expect(await heading(page)).toBe('Check your answers');
  await next(page);
}

/** Visible text must never claim an ID is verified ("not verified" is fine). */
async function noVerifiedClaim(page) {
  const text = await page.locator('body').innerText();
  const claims = (text.match(/.{0,20}\bverified\b/gi) || []).filter(s => !/not verified/i.test(s));
  expect(claims, 'claims that an ID is verified').toEqual([]);
}

test('every ID choice shows an honest trust badge, and nothing claims "verified"', async ({ page }) => {
  await signupTo(page, 'id_route');
  for (const v of ['fayda', 'kebele', 'passport', 'refugee', 'other']) {
    await expect(page.locator(`.dm-opt:has(input[value=${v}]) .dm-badge`)).toHaveText('Self-declared · not verified');
  }
  await expect(page.locator('.dm-opt:has(input[value=none]) .dm-badge')).toHaveText('Partner referral pending');
  await expect(page.locator('.dm-hint').first()).toContainText('Nobody checks IDs automatically');
  await noVerifiedClaim(page);
});

test('the badge is part of the option name for screen readers', async ({ page }) => {
  await signupTo(page, 'id_route');
  await expect(page.getByRole('radio', { name: /Fayda national ID Self-declared · not verified/ })).toHaveCount(1);
});

test('ID status after sign-up: "Number recorded — not verified" when a number is given', async ({ page }) => {
  await signupTo(page, 'id_number');
  await fill(page, 'FAYDA-1234');
  await next(page); await next(page); await pick(page, 'yes'); await next(page);
  await expect(page.locator('.dm-review')).toContainText('Fayda national ID (Self-declared · not verified)');
  await next(page);
  await expect(page.locator('.badge')).toHaveText('Number recorded — not verified');
  expect((await profile(page)).assurance_level).toBe('document_number_recorded');
  expect(JSON.stringify(await profile(page))).not.toContain('FAYDA-1234'); // the number itself is not kept by the demo host
  await noVerifiedClaim(page);
});

test('ID status: "Self-declared" without a number, "Partner referral pending" without an ID', async ({ page }) => {
  await signupTo(page, 'END'); await next(page);
  await expect(page.locator('.badge')).toHaveText('Self-declared');
  await page.evaluate(() => Object.keys(localStorage).filter(k => !k.endsWith('.prefs') && k !== '__seeded').forEach(k => localStorage.removeItem(k)));
  await partnerSignup(page, { idRoute: 'none' });
  await expect(page.locator('.badge')).toHaveText('Partner referral pending');
});

test('partner sign-up ends with a handover to the learner, not the Support Passport', async ({ page }) => {
  await partnerSignup(page);
  await expect(page.locator('.handover h2')).toHaveText('Please hand the phone to the learner now');
  await expect(page.locator('.dm-done-slot a[href="#/passport"]')).toHaveCount(0);
  await expect(page.locator('.dm-done-slot')).toContainText('Signed up with help from AAAPD');
  const p = await profile(page);
  expect(p.takeover_pending).toBe(true);
  // while the helper may still be there, the Support Passport waits for the takeover
  await go(page, '#/passport');
  await expect(page.locator('#view')).toContainText('First, take over your account');
  await expect(page.locator('savanna-onboarding-form')).toHaveCount(0);
});

test('learner takeover: the learner checks the details, then the staff name is removed', async ({ page }) => {
  await partnerSignup(page);
  await page.locator('a[href="#/takeover"]').click();
  expect(await heading(page)).toBe('Take over your account');
  await expect(page.locator('.dm-hint').first()).toContainText('Hana Staff from AAAPD helped you sign up');
  await expect(page.locator('.dm-review')).toContainText('Selam Bekele');
  await page.locator('.dm-review > div', { hasText: 'Name' }).first().locator('[data-act=change]').click();
  await fill(page, 'Selam T. Bekele'); await next(page);
  expect(await heading(page)).toBe('Take over your account');
  await next(page);
  expect(await heading(page)).toContain('Your account is now yours');
  const p = await profile(page);
  expect(p.name).toBe('Selam T. Bekele');
  expect(p.takeover_pending).toBe(false);
  expect(p.registered_by).toEqual({ org: 'aaapd' });
  expect(JSON.stringify(p)).not.toContain('Hana Staff');
  await go(page, '#/passport');
  await expect(page.locator('savanna-onboarding-form')).toHaveCount(1); // now the learner can fill it in
  await go(page, '#/takeover');
  await expect(page.locator('#view')).toContainText('nothing to take over');
});

test('Support Passport: private by default', async ({ page }) => {
  await go(page, '#/passport');
  await pick(page, 'yes'); await next(page);
  await pick(page, 'remote'); await next(page);
  await next(page); // other need: optional
  await expect(page.locator('input[value=ask]')).toBeChecked();
  await expect(page.locator('.dm-hint').first()).toContainText('Private is chosen for you');
});

test('Support Passport card: who can see it, and trainer sharing can be given and withdrawn', async ({ page }) => {
  await go(page, '#/');
  await page.evaluate(() => localStorage.setItem('savanna-onboarding.passport', JSON.stringify({ needs: ['remote', 'captions'], other_need: 'quiet room', sharing: 'ask' })));
  await go(page, '#/passport');
  await expect(page.locator('#who-h')).toHaveText('Who can see this');
  await expect(page.locator('section', { has: page.locator('#who-h') })).toContainText('Only you.');
  await expect(page.locator('#view')).toContainText('Never shared with anyone');
  await page.locator('#sharing').click();
  await expect(page.locator('section', { has: page.locator('#who-h') })).toContainText('You and your trainers at ALX');
  await expect(page.locator('#view')).toContainText('nothing is sent to anyone'); // labelled demo
  await expect(page.locator('#sharing')).toBeFocused();
  await expect(page.locator('#pp-status')).toContainText('Saved.');
  await page.locator('#sharing').click(); // withdraw
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.passport')).sharing)).toBe('ask');
});

async function applyTo(page) {
  await go(page, '#/jobs'); // a different page first, so the application form is drawn afresh
  await go(page, '#/apply/s1');
  await next(page); await next(page); // name, phone: prefilled
  await fill(page, 'I like helping people.'); await next(page);
  await fill(page, 'Volunteer at a youth centre.'); await next(page);
  await next(page); // interview: optional
}

test('job application: the learner sees exactly what would be shared, and nothing is shared without "yes"', async ({ page }) => {
  await signupTo(page, 'END'); await next(page);
  await page.evaluate(() => localStorage.setItem('savanna-onboarding.passport', JSON.stringify({ needs: ['remote', 'captions'], other_need: 'quiet room', sharing: 'ask' })));
  await applyTo(page);
  await expect(page.locator('.dm-note')).toContainText('the employer sees exactly this list: Work from home; Captions on videos and calls');
  await expect(page.locator('input[name=v]:checked')).toHaveCount(0); // no default: an explicit choice
  await pick(page, 'keep'); await next(page); await next(page);
  let packet = await page.locator('pre code').innerText();
  expect(packet).not.toContain('supportThatHelps');
  expect(packet).not.toContain('quiet room');

  await applyTo(page);
  await pick(page, 'share'); await next(page); await next(page);
  packet = await page.locator('pre code').innerText();
  expect(packet).toContain('Work from home');
  expect(packet).not.toContain('quiet room'); // own words are never shared
});

test('sharing with an employer can be withdrawn from the Support Passport card', async ({ page }) => {
  await signupTo(page, 'END'); await next(page);
  await page.evaluate(() => localStorage.setItem('savanna-onboarding.passport', JSON.stringify({ needs: ['remote'], sharing: 'ask' })));
  await applyTo(page);
  await pick(page, 'share'); await next(page); await next(page);
  await go(page, '#/passport');
  await expect(page.locator('#view')).toContainText('Customer support agent');
  await page.locator('[data-withdraw]').click();
  await expect(page.locator('#view')).toContainText('withdrawn on');
  await expect(page.locator('#pp-status')).toContainText('only the copy on this phone changed');
  const apps = await page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.applications')));
  expect(apps[0].packet.supportThatHelps).toBeUndefined();
});

test('the module only gives employers support data with consent for that application (supportForEmployer)', async ({ page }) => {
  await go(page, '#/');
  const r = await page.evaluate(() => {
    localStorage.setItem('savanna-onboarding.passport', JSON.stringify({ needs: ['remote'], other_need: 'secret', sharing: 'trainers' }));
    const D = window.SavannaOnboarding;
    return { none: D.supportForEmployer({}), keep: D.supportForEmployer({ share_passport: 'keep' }), share: D.supportForEmployer({ share_passport: 'share' }).map(n => n.value) };
  });
  expect(r.none).toEqual([]);
  expect(r.keep).toEqual([]); // trainer sharing never means employer sharing
  expect(r.share).toEqual(['remote']);
});
