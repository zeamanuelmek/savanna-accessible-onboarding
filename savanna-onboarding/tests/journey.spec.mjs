// Phase 8: the realistic learner journey inside Savanna's own pages (ALX starter kit), the simulated log-in,
// the mount/unmount API and the separate test host page.
// The GATE task first: "sign up for Savanna and save a Support Passport", end to end, by mouse, in both languages,
// and with the keyboard only.
import { test, expect } from '@playwright/test';
import { freshStart, pick, next, heading } from './helpers.mjs';

const at = (page, path) => page.goto(path).then(() => page.waitForFunction(() => !!window.SavannaOnboarding));
const profile = page => page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.profile') || 'null'));
const passport = page => page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.passport') || 'null'));

/** Sign up from the Savanna home page, as a learner would. */
async function signUpFromHome(page, words) {
  await at(page, '/index.html');
  await page.locator('.sj-hero a[href="signup.html"]').click();
  await page.waitForSelector('.dm-q');
  await pick(page, 'read_type'); await next(page);
  await pick(page, 'self'); await next(page);
  await page.fill('[data-ref=input]', 'Abebe Kebede'); await next(page);
  await page.fill('[data-ref=input]', '0911234567'); await next(page);
  await pick(page, 'kebele'); await next(page);
  await next(page); // ID number: optional
  await next(page); // date of birth: optional
  await pick(page, 'yes'); await next(page);
  expect(await heading(page)).toBe(words.check);
  await next(page);
  expect(await heading(page)).toContain(words.ready);
}
async function savePassport(page, words) {
  await page.locator('.dm-done-slot a[href="passport.html"]').click();
  await page.waitForSelector('.dm-q');
  await pick(page, 'yes'); await next(page);
  await pick(page, 'remote'); await pick(page, 'captions'); await next(page);
  await next(page); // anything else: optional
  await expect(page.locator('input[value=ask]')).toBeChecked(); // private by default
  await next(page);
  expect(await heading(page)).toBe(words.check);
  await next(page);
  expect(await heading(page)).toContain(words.saved);
}

for (const [lang, words] of Object.entries({
  en: { check: 'Check your answers', ready: 'Your account is ready', saved: 'Your Support Passport is saved', dash: 'Welcome, Abebe Kebede' },
  am: { check: 'መልሶችዎን ያረጋግጡ', ready: 'መለያዎ ዝግጁ ነው', saved: 'የድጋፍ ፓስፖርትዎ ተቀምጧል', dash: 'እንኳን ደህና መጡ፣ Abebe Kebede' }
})) {
  test(`GATE (${lang}): sign up for Savanna and save a Support Passport, inside the Savanna pages`, async ({ page }) => {
    await freshStart(page, { lang });
    await signUpFromHome(page, words);
    await expect(page.locator('.dm-done-slot a[href="dashboard.html"]')).toBeVisible(); // signed in (simulated)
    await savePassport(page, words);
    expect((await passport(page)).needs.sort()).toEqual(['captions', 'remote']);
    expect((await profile(page)).name).toBe('Abebe Kebede');
    await at(page, '/dashboard.html');
    await expect(page.locator('.sj h1')).toHaveText(words.dash);
    await expect(page.locator('#sidebar a[aria-current=page]')).toHaveAttribute('href', 'dashboard.html');
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
  });
}

test('GATE: the whole task with the keyboard only (Tab, Space, Enter)', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/index.html');
  async function tabTo(selector, max = 40) {
    for (let i = 0; i < max; i++) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(s => document.activeElement.matches(s), selector)) return;
    }
    throw new Error('could not reach ' + selector);
  }
  const choose = async v => { await tabTo(`input[value="${v}"], input[name=v]:first-of-type`); };
  await tabTo('.sj-hero a[href="signup.html"]'); await page.keyboard.press('Enter');
  await page.waitForSelector('.dm-q');
  await tabTo('input[name=mode]'); await page.keyboard.press('Space');
  await tabTo('button[type=submit]'); await page.keyboard.press('Enter');
  await tabTo('input[name=v]'); await page.keyboard.press('Space'); // Me, for myself
  await tabTo('button[type=submit]'); await page.keyboard.press('Enter');
  await tabTo('[data-ref=input]'); await page.keyboard.type('Abebe Kebede'); await page.keyboard.press('Enter');
  await tabTo('[data-ref=input]'); await page.keyboard.type('0911234567'); await page.keyboard.press('Enter');
  await tabTo('input[name=v]'); await page.keyboard.press('Space'); // Fayda
  await tabTo('button[type=submit]'); await page.keyboard.press('Enter');
  await tabTo('[data-ref=input]'); await page.keyboard.press('Enter'); // ID number: skip
  await tabTo('button[type=submit]'); await page.keyboard.press('Enter'); // date: skip
  await tabTo('input[name=v]'); await page.keyboard.press('Space'); // consent: yes
  await tabTo('button[type=submit]'); await page.keyboard.press('Enter');
  await tabTo('button[type=submit]'); await page.keyboard.press('Enter'); // create my account
  expect(await heading(page)).toContain('Your account is ready');
  await tabTo('.dm-done-slot a[href="passport.html"]'); await page.keyboard.press('Enter');
  await page.waitForSelector('.dm-q');
  await tabTo('input[name=v]'); await page.keyboard.press('Space'); // yes
  await tabTo('button[type=submit]'); await page.keyboard.press('Enter');
  await tabTo('input[name=v]'); await page.keyboard.press('Space'); // first need
  await tabTo('button[type=submit]'); await page.keyboard.press('Enter');
  await tabTo('button[type=submit]'); await page.keyboard.press('Enter'); // anything else: skip
  await tabTo('button[type=submit]'); await page.keyboard.press('Enter'); // who can see: only me (default)
  await tabTo('button[type=submit]'); await page.keyboard.press('Enter'); // save
  expect(await heading(page)).toContain('Your Support Passport is saved');
  expect((await passport(page)).sharing).toBe('ask');
});

test('Savanna frame: menu button, labelled navigation, logo with a name, language switch', async ({ page }, info) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/index.html');
  await expect(page.locator('nav#sidebar')).toHaveAttribute('aria-label', 'Savanna'); // hidden on phones until the menu opens
  await expect(page.getByRole('link', { name: 'Savanna home' })).toHaveCount(1);
  const menu = page.getByRole('button', { name: 'Menu' });
  await expect(menu).toHaveAttribute('aria-controls', 'sidebar');
  if (info.project.name === 'mobile') {
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#sidebar')).toBeHidden();
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#sidebar a[aria-current=page]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeFocused();
  } else {
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await menu.click(); // collapse to the icon rail: link names stay for screen readers
    await expect(page.getByRole('link', { name: 'Jobs' })).toHaveCount(1);
  }
  await page.locator('.sj-lang').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'am');
  await expect(page.locator('.sj h1')).toHaveText('በሳቫና ይማሩ');
});

test('pages for learners ask to log in when nobody is logged in', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  for (const p of ['/dashboard.html', '/passport.html', '/profile.html']) {
    await at(page, p);
    await expect(page.locator('.sj h1')).toHaveText('Please log in');
    await expect(page.locator('.sj a[href="login.html"]')).toBeVisible();
  }
});

test('simulated log-in: labelled, no password to remember, code can be pasted, no time limit (WCAG 3.3.8)', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await signUpFromHome(page, { check: 'Check your answers', ready: 'Your account is ready' });
  await page.evaluate(() => localStorage.removeItem('savanna-demo.session'));
  await at(page, '/login.html');
  await expect(page.locator('.sj .notice')).toContainText('Simulated log-in');
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  const phone = page.locator('#sj-phone');
  await expect(phone).toHaveAttribute('autocomplete', 'tel');
  await phone.fill('0911 111 111'); await page.locator('#sj-login button[type=submit]').click();
  await expect(page.locator('.sj-errors')).toBeFocused();
  await expect(page.locator('.sj-errors')).toContainText('no Savanna account with this phone number');
  await expect(page.locator('#sj-phone')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#sj-phone')).toHaveAttribute('aria-describedby', /sj-err/);
  await page.locator('#sj-phone').fill('+251 911 234 567'); await page.locator('#sj-login button[type=submit]').click();
  const code = (await page.locator('.sj-sms samp').innerText()).match(/\d{6}/)[0];
  const box = page.locator('#sj-code');
  await expect(box).toBeFocused();
  await expect(box).toHaveAttribute('autocomplete', 'one-time-code');
  // paste, as a learner would (a real clipboard paste event: nothing blocks it)
  await box.evaluate((el, c) => { const dt = new DataTransfer(); dt.setData('text/plain', c); const ok = el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, cancelable: true, bubbles: true })); if (ok) el.value = c; }, code);
  await expect(box).toHaveValue(code);
  await page.waitForTimeout(1500); // no time limit
  await page.locator('#sj-login button[type=submit]').click();
  await page.waitForURL('**/dashboard.html');
  await expect(page.locator('.sj h1')).toHaveText('Welcome, Abebe Kebede');
  await page.locator('#sidebar a[data-logout]').evaluate(a => a.click());
  await page.waitForURL('**/index.html');
  await expect(page.locator('.sj .notice')).toContainText('You have logged out');
});

test('profile page, jobs with the on-device filter, application and employer form all run inside Savanna', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await signUpFromHome(page, { check: 'Check your answers', ready: 'Your account is ready' });
  await page.evaluate(() => localStorage.setItem('savanna-onboarding.passport', JSON.stringify({ needs: ['remote'], sharing: 'ask' })));
  await at(page, '/profile.html');
  expect(await heading(page)).toBe('My profile');
  await expect(page.locator('.dm-review')).toContainText('Abebe Kebede');
  await at(page, '/jobs.html');
  await page.locator('#flt').check();
  await expect(page.locator('#jobs-status')).toContainText('jobs shown');
  await page.locator('.job a[href^="apply.html?job="]').first().click();
  await page.waitForSelector('.dm-q');
  await expect(page.locator('[data-ref=input]')).toHaveValue('Abebe Kebede'); // prefilled from the profile
  await at(page, '/employer.html');
  expect(await heading(page)).toBe('What is the job title?');
  await expect(page.locator('#sidebar a[aria-current=page]')).toHaveAttribute('href', 'employer.html');
});

test('mount and unmount: the test host page uses only the public API', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/test-host/');
  await page.locator('input[name=form][value=passport]').check();
  await page.locator('#mount').click();
  await expect(page.locator('#slot savanna-onboarding-form')).toHaveCount(1);
  await expect(page.locator('#slot .dm-q')).toBeFocused();
  await expect(page.locator('#slot h2.dm-q')).toHaveCount(1); // headingLevel 2: the page keeps its own h1
  await expect(page.locator('h1')).toHaveCount(1);
  await pick(page, 'later'); await next(page); await next(page);
  await expect(page.locator('#log')).toContainText('"form": "passport"');
  await expect(page.locator('#log')).toContainText('savanna-onboarding:complete');
  await page.locator('#unmount').click();
  await expect(page.locator('#slot savanna-onboarding-form')).toHaveCount(0);
  await expect(page.locator('#status')).toContainText('Unmounted');
});

test('mount() API: options, handle.unmount(), and errors for a wrong target', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/test-host/');
  const r = await page.evaluate(() => {
    const D = window.SavannaOnboarding, out = {};
    const box = document.createElement('div'); document.body.appendChild(box);
    const h = D.mount(box, { form: 'employer', lang: 'am', focus: false });
    out.lang = h.element.querySelector('.dm').getAttribute('lang');
    out.count = box.querySelectorAll('savanna-onboarding-form').length;
    D.mount(box, { form: 'passport', focus: false }); // mounting again replaces, never duplicates
    out.countAfter = box.querySelectorAll('savanna-onboarding-form').length;
    out.formAfter = box.querySelector('savanna-onboarding-form').getAttribute('form');
    D.unmount(box);
    out.afterUnmount = box.children.length;
    try { D.mount('#does-not-exist', { form: 'signup' }); } catch (e) { out.error = e.message; }
    return out;
  });
  expect(r).toMatchObject({ lang: 'am', count: 1, countAfter: 1, formAfter: 'passport', afterUnmount: 0 });
  expect(r.error).toContain('no element matches');
});

test('the showroom stays reachable as the developer and test page', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/index.html');
  await page.locator('.sj-foot a[href="showroom.html"]').click();
  await page.waitForSelector('#nav a', { state: 'attached' });
  await expect(page).toHaveTitle(/Savanna Accessible Onboarding Module/);
});
