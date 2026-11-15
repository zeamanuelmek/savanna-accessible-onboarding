// Phase 8: the realistic learner journey inside Savanna's own pages (ALX starter kit), the simulated log-in,
// the mount/unmount API and the separate test host page.
// The GATE task first: "sign up for Savanna and save a Support Passport", end to end, by mouse, in both languages,
// and with the keyboard only.
import { test, expect } from '@playwright/test';
import { freshStart, pick, next, heading, barLanguage } from './helpers.mjs';

const at = (page, path) => page.goto(path).then(() => page.waitForFunction(() => !!window.SavannaOnboarding));
const profile = page => page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.profile') || 'null'));
const passport = page => page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.passport') || 'null'));

/** Sign up from the Savanna home page, as a learner would. */
async function signUpFromHome(page, words) {
  await at(page, '/index.html');
  await pick(page, 'read_type'); // home, step 1: how would you like to use Savanna?
  await page.locator('#sj-mode button[type=submit]').click();
  await page.locator('.sj-split a[href="signup.html"]').click(); // step 2: sign up or log in
  await page.waitForSelector('.dm-q');
  await pick(page, 'self'); await next(page);
  await page.fill('[data-ref=input]', 'Abebe Kebede'); await next(page);
  await page.fill('[data-ref=input]', '0911234567'); await next(page);
  await next(page); // date of birth: optional (no ID question: that is "Add your ID (optional)", later)
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
  en: { check: 'Check your answers', ready: 'Your account is ready', saved: 'Your Support Passport is saved', dash: 'Abebe' },
  am: { check: 'መልሶችዎን ያረጋግጡ', ready: 'መለያዎ ዝግጁ ነው', saved: 'የድጋፍ ፓስፖርትዎ ተቀምጧል', dash: 'Abebe' }
})) {
  test(`GATE (${lang}): sign up for Savanna and save a Support Passport, inside the Savanna pages`, async ({ page }) => {
    await freshStart(page, { lang });
    await signUpFromHome(page, words);
    await expect(page.locator('.dm-done-slot a[href="dashboard.html"]')).toBeVisible(); // signed in (simulated)
    await savePassport(page, words);
    expect((await passport(page)).needs.sort()).toEqual(['captions', 'remote']);
    expect((await profile(page)).name).toBe('Abebe Kebede');
    await at(page, '/dashboard.html');
    await expect(page.locator('h1.sj-greeting [data-sj-name]')).toHaveText(words.dash); // ALX's self-paced homepage
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
  await tabTo('input[name=mode]'); await page.keyboard.press('Space');
  await tabTo('#sj-mode button[type=submit]'); await page.keyboard.press('Enter');
  await tabTo('.sj-split a[href="signup.html"]'); await page.keyboard.press('Enter');
  await page.waitForSelector('.dm-q');
  await tabTo('input[name=v]'); await page.keyboard.press('Space'); // Me, for myself
  await tabTo('button[type=submit]'); await page.keyboard.press('Enter');
  await tabTo('[data-ref=input]'); await page.keyboard.type('Abebe Kebede'); await page.keyboard.press('Enter');
  await tabTo('[data-ref=input]'); await page.keyboard.type('0911234567'); await page.keyboard.press('Enter');
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

test('Savanna frame: menu button, labelled navigation, no logo, language dropdown', async ({ page }, info) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/index.html');
  await expect(page.locator('#sidebar')).toHaveCount(0); // the home page has no sidebar menu
  await expect(page.locator('.sj-menu')).toHaveCount(0);
  await expect(page.locator('.sj-header img')).toHaveCount(0); // no logo: the module is for any organisation
  const langBtn = page.getByRole('button', { name: 'Language: English' });
  await expect(langBtn).toHaveAttribute('aria-expanded', 'false');
  await langBtn.click();
  await expect(langBtn).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#sj-lang-menu button')).toHaveText([/አማርኛ/, /English/, /Afaan Oromoo/]);
  await expect(page.locator('#sj-lang-menu button[aria-current]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(langBtn).toBeFocused();
  await barLanguage(page, 'am');
  await expect(page.locator('html')).toHaveAttribute('lang', 'am');
  await expect(page.locator('.sj h1')).toHaveText('ወደ ምዝገባ ገጽዎ እንኳን ደህና መጡ');
  await expect(page.getByRole('button', { name: 'ቋንቋ: አማርኛ' })).toBeFocused(); // focus stays on the Language button
  await barLanguage(page, 'en');
  await page.evaluate(() => {
    localStorage.setItem('savanna-onboarding.profile', JSON.stringify({ name: 'Abebe Kebede', phone: '0911234567', id_route: 'kebele', assurance_level: 'self_declared' }));
    localStorage.setItem('savanna-demo.session', '{"at":"x"}');
  });
  await at(page, '/jobs.html');
  await expect(page.locator('nav#sidebar')).toHaveAttribute('aria-label', 'Savanna'); // hidden on phones until the menu opens
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
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#sidebar').getByRole('link', { name: 'Jobs' })).toHaveCount(1);
  }
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
  await expect(page.locator('#sj-view .notice')).toContainText('Simulated log-in');
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
  await expect(page.locator('h1.sj-greeting [data-sj-name]')).toHaveText('Abebe');
  await page.getByRole('button', { name: /Abebe/ }).click(); // account menu, top right
  await page.locator('#sj-acct-menu').getByRole('link', { name: 'Log out' }).click();
  await page.waitForURL('**/index.html');
  await expect(page.locator('#sj-view .notice')).toContainText('You have logged out');
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
  await expect(page.locator('.sj-foot-links a[href="employer.html"]')).toHaveText('For employers: post a job'); // in the footer, not the learner menu
});

test('right after sign-up the dashboard offers "Add your ID (optional)", which opens on My profile', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await signUpFromHome(page, { check: 'Check your answers', ready: 'Your account is ready' });
  await at(page, '/dashboard.html');
  const link = page.locator('#sj-view a[href="profile.html?add=id"]');
  await expect(link).toHaveText('Add your ID (optional)');
  await link.click();
  await page.waitForSelector('.dm-q');
  expect(await heading(page)).toBe('Which ID do you have?');
  await expect(page).toHaveTitle(/Add your ID \(optional\)/);
  await expect(page.locator('.dm-opt:has(input[value=none]) .dm-badge')).toHaveText('Partner referral pending');
  await pick(page, 'refugee'); await next(page);
  await expect(page.locator('[data-act=speak]')).toHaveCount(0); // ID number: typed, never spoken
  await expect(page.locator('.dm-hint').first()).toContainText('For your privacy, ID numbers are typed, not spoken.');
  await next(page); await next(page);
  expect(await heading(page)).toContain('Your ID details are saved');
  expect((await profile(page)).id_route).toBe('refugee');
  await at(page, '/dashboard.html');
  await expect(page.locator('#sj-view a[href="profile.html?add=id"]')).toHaveCount(0); // done: no longer offered
});

test('job application and job post end with a plain confirmation on the Savanna pages, never raw data', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await signUpFromHome(page, { check: 'Check your answers', ready: 'Your account is ready' });
  await page.evaluate(() => localStorage.setItem('savanna-onboarding.passport', JSON.stringify({ needs: ['remote'], sharing: 'ask' })));
  await at(page, '/apply.html?job=s1');
  await page.waitForSelector('.dm-q');
  await next(page); await next(page); // name and phone: prefilled from the profile
  await page.fill('[data-ref=input]', 'I like working with people.'); await next(page);
  await page.fill('[data-ref=input]', 'Volunteering at my kebele.'); await next(page);
  await next(page); // interview: optional
  await pick(page, 'share'); await next(page);
  await next(page); // Send my application
  const slot = page.locator('.dm-done-slot');
  await expect(slot.locator('h2')).toHaveText(/^Your application was sent to /);
  await expect(slot.locator('.dm-review')).toContainText('I like working with people.');
  await expect(slot).toContainText('Support Passport: shared');
  await expect(slot).toContainText('This is a demo: nothing was actually sent.');
  await expect(slot.locator('pre, code')).toHaveCount(0);
  await at(page, '/employer.html');
  await page.fill('[data-ref=input]', 'Data entry assistant'); await next(page);
  await page.fill('[data-ref=input]', 'Addis Data'); await next(page);
  await page.fill('[data-ref=input]', 'Addis Ababa'); await next(page);
  await pick(page, 'remote'); await next(page);
  await pick(page, 'remote'); await next(page);
  await page.fill('[data-ref=input]', 'Type records.'); await next(page);
  await page.fill('[data-ref=input]', 'jobs@example.org'); await next(page);
  await next(page);
  await expect(page.locator('.dm-done-slot h2')).toHaveText('Your job "Data entry assistant" is on the job board');
  await expect(page.locator('.dm-done-slot')).toContainText('This is a demo');
  await expect(page.locator('.dm-done-slot pre, .dm-done-slot code')).toHaveCount(0);
});

test('mount and unmount: the test host page uses only the public API', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/test-host/');
  await page.locator('input[name=form][value=passport]').check();
  await page.locator('#mount').click();
  await expect(page.locator('#slot savanna-onboarding-form')).toHaveCount(1);
  await expect(page.locator('#slot .dm-q')).toBeFocused();
  await expect(page.locator('#slot h2.dm-q')).toHaveCount(1); // headingLevel 2: the page keeps its own h1
  await expect(page.locator('h1:visible')).toHaveCount(1); // (the closed dialogs have their own titles)
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

test('home: first "How do you like to register?", then "Sign up or log in"; Back returns to the first step', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/index.html');
  await expect(page.locator('.sj-split h1')).toHaveText('Welcome to your onboarding page');
  await expect(page.locator('.sj-split img')).toHaveCount(0); // generic: no ALX logo in the welcome panel
  await expect(page.getByText('Make this page work for you')).toHaveCount(0); // no visible sentence, on any page
  await expect(page.getByRole('region', { name: 'Accessibility options' })).toHaveCount(1);
  await expect(page.locator('.sj-split a[href="signup.html"]')).toHaveCount(0); // sign up comes after the choice
  await page.locator('#sj-mode button[type=submit]').click(); // nothing chosen
  await expect(page.locator('#sj-mode-errors')).toBeFocused();
  await expect(page.locator('#sj-mode-errors')).toContainText('Choose one way to continue.');
  await pick(page, 'simple');
  await page.locator('#sj-mode button[type=submit]').click();
  await expect(page.locator('#sj-step-h')).toHaveText('Sign up or log in');
  await expect(page.locator('#sj-step-h')).toBeFocused();
  await expect(page.locator('.sj-split a[href="login.html"]')).toBeVisible();
  const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.prefs')));
  expect(prefs).toMatchObject({ mode: 'simple', pictures: true, size: 'large' });
  await page.goBack();
  await expect(page.locator('#sj-step-h')).toHaveText('How do you like to register?');
  await expect(page.locator('input[value=simple]')).toBeChecked();
  await page.goForward();
  await page.locator('.sj-split a[href="signup.html"]').click();
  await page.waitForSelector('.dm-q');
  expect(await heading(page)).toBe('Who is filling in this form?'); // the sign-up does not ask again
});

test('"Accessibility options" bar: pressed states, saved, and applied before the page is drawn', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/jobs.html');
  const bar = page.getByRole('region', { name: 'Accessibility options' });
  for (const [key, attr, value] of [['size', 'data-dm-size', 'large'], ['contrast', 'data-dm-contrast', 'high'], ['motion', 'data-dm-motion', 'reduce']]) {
    const b = bar.locator(`.sj-tog[data-tog=${key}]`);
    await expect(b).toHaveAttribute('aria-pressed', 'false');
    await b.click();
    await expect(b).toHaveAttribute('aria-pressed', 'true');
    await expect(b).toBeFocused();
    await expect(page.locator('html')).toHaveAttribute(attr, value);
  }
  // on the next page the settings are on <html> before any of the module's scripts run (no jump in size or font)
  await page.route('**/savanna-onboarding.js', r => r.abort());
  await page.goto('/settings.html');
  await expect(page.locator('html')).toHaveAttribute('data-dm-size', 'large');
  await expect(page.locator('html')).toHaveAttribute('data-dm-contrast', 'high');
  await expect(page.locator('html')).toHaveAttribute('data-dm-motion', 'reduce');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('fonts are declared and preloaded in the page head, so text never flashes in another font', async ({ page }) => {
  await freshStart(page, { lang: 'am' });
  await page.goto('/index.html');
  expect(await page.locator('link[rel=preload][as=font]').count()).toBeGreaterThanOrEqual(4); // Poppins + Ethiopic (Amharic)
  await page.waitForFunction(() => !!window.SavannaOnboarding);
  await page.evaluate(() => document.fonts.ready);
  // the page's own font declarations are the ones used (the module does not add a second copy)
  expect(await page.evaluate(() => document.querySelector('#savanna-onboarding-styles').textContent.includes('@font-face'))).toBe(false);
  expect(await page.evaluate(() => [...document.fonts].some(f => f.family.includes('Poppins') && f.status === 'loaded'))).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.sj-header')).position)).toBe('sticky');
});

const signedIn = page => page.evaluate(() => {
  localStorage.setItem('savanna-onboarding.profile', JSON.stringify({ name: 'Abebe Kebede', phone: '0911234567', id_route: 'kebele', assurance_level: 'self_declared' }));
  localStorage.setItem('savanna-demo.session', '{"at":"x"}');
});

test('after onboarding the learner lands on ALX\'s self-paced homepage, with Savanna\'s own menu', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/index.html'); await signedIn(page);
  await at(page, '/dashboard.html');
  // ALX's page content, word for word
  for (const t of ['Course Progression', 'My activities', 'My Pacing Boost', 'My upcoming events', 'VA-1: VA Foundations & Professional Identity'])
    await expect(page.locator('.sj-alx').getByText(t, { exact: true }).first()).toBeVisible();
  await expect(page.locator('.sj-alx')).toHaveAttribute('lang', 'en'); // ALX's text is English, also when the page is in Amharic
  await expect(page.locator('h1:visible')).toHaveCount(1); // (the closed dialogs have their own titles)
  // Savanna's sidebar: the same items and order as ALX's page, plus Jobs in "My Campus"; My Profile at the bottom
  const names = await page.locator('#sidebar a').evaluateAll(as => as.map(a => a.textContent.trim()));
  expect(names).toEqual(['Home', 'Access my learning', 'My courses', 'Conference rooms', 'Servers', 'Sandboxes', 'Video on demand', 'Peers', 'Jobs', 'My Profile']);
  await expect(page.locator('#sidebar ul[aria-label="My resources"] a')).toHaveCount(5);
  // My activities: choosing a module shows it, and the buttons say which is chosen
  const m3 = page.getByRole('button', { name: 'Module 3: VA Skills and Mindsets' });
  await expect(m3).toHaveAttribute('aria-pressed', 'false');
  await m3.click();
  await expect(m3).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-section-host]')).toContainText('Mastery Project: VA Profile Video');
  // Program details dialog (Bootstrap's own): opens, and Escape closes it
  await page.getByRole('button', { name: 'Program details' }).click();
  await expect(page.getByRole('dialog', { name: 'ALX program' })).toBeVisible();
  await page.waitForFunction(() => !!document.activeElement.closest('#program-structure-modal')); // focus moves into the dialog
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'ALX program' })).toBeHidden();
  // a Savanna section that is not in the demo says so, instead of doing nothing
  if (await page.locator('.sj-menu').getAttribute('aria-expanded') === 'false') await page.locator('.sj-menu').click();
  await page.locator('#sidebar').getByRole('link', { name: 'Servers' }).click();
  await expect(page.locator('#sj-note')).toContainText('"Servers" is part of Savanna, but not of this demo.');
});

test('account menu (top right): Support Passport, My profile, Accessibility settings, Log out; keyboard and Escape', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/index.html'); await signedIn(page);
  await at(page, '/dashboard.html');
  const btn = page.getByRole('button', { name: /Abebe/ });
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await btn.focus(); await page.keyboard.press('Enter');
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  const menu = page.locator('#sj-acct-menu');
  expect(await menu.locator('a').allInnerTexts()).toEqual(['Support Passport', 'My profile', 'Accessibility settings', 'Log out']);
  await expect(menu.locator('a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(btn).toBeFocused();
});

test('nobody logged in: the dashboard asks to log in and shows none of the learner\'s Savanna content', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/dashboard.html');
  await expect(page.locator('#sj-view h1')).toHaveText('Please log in');
  await expect(page.locator('.sj-alx')).toBeHidden();
  await expect(page.locator('#sidebar')).toHaveCount(0);
});

test('Accessibility settings: opening them keeps the language; Back and Done return to where the learner was; no loop with Log in', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/index.html');
  await page.getByRole('link', { name: 'Accessibility settings' }).click();
  await page.waitForURL('**/settings.html'); await page.waitForFunction(() => !!window.SavannaOnboarding);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en'); // it used to fall back to Amharic (bug fixed 15 Nov)
  await expect(page.locator('.dm-settings h1')).toBeFocused();
  // every setting of the bar is also here, with a live preview
  await expect(page.getByRole('group', { name: 'Motion' })).toHaveCount(1);
  await expect(page.getByRole('group', { name: 'Preview' })).toHaveCount(1);
  await page.getByRole('radio', { name: 'Stop motion' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-dm-motion', 'reduce');
  await expect(page.locator('.sj-tog[data-tog=motion]')).toHaveAttribute('aria-pressed', 'true'); // bar and settings agree
  await expect(page.locator('.sj-back a')).toHaveText(/Back to the home page/);
  await expect(page.locator('#sj-set-done a')).toHaveText('Done: back to the home page');
  // log in from here, then back: settings again, and settings still goes back home (never to log in)
  await page.locator('.sj-head-link').click(); await page.waitForURL('**/login.html');
  await expect(page.locator('.sj-back a')).toHaveText(/Back to settings/);
  await page.locator('.sj-back a').click(); await page.waitForURL('**/settings.html');
  await expect(page.locator('.sj-back a')).toHaveText(/Back to the home page/);
  // language changed in Settings: Back and Done follow it
  await page.locator('input[name=lang][value=om]').check();
  await expect(page.locator('#sj-set-done a')).toHaveText("Xumureera: gara fuula jalqabaa deebi'i");
  await page.locator('#sj-set-done a').click(); await page.waitForURL('**/index.html');
});

test('sign-up question 1 has Back, to "Sign up or log in"', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  await at(page, '/index.html');
  await pick(page, 'read_type'); await page.locator('#sj-mode button[type=submit]').click();
  await page.locator('.sj-split a[href="signup.html"]').click();
  await page.waitForSelector('.dm-q');
  const back = page.locator('.dm-bar').getByRole('link', { name: '← Back' });
  await expect(back).toHaveAttribute('href', 'index.html?step=account');
  await back.click();
  await expect(page.locator('#sj-step-h')).toHaveText('Sign up or log in');
});

test('no demo sentence in the footer, and no logo in the header, on any page', async ({ page }) => {
  await freshStart(page, { lang: 'en' });
  for (const p of ['/index.html', '/signup.html', '/login.html', '/jobs.html', '/settings.html', '/employer.html']) {
    await at(page, p);
    await expect(page.locator('body')).not.toContainText('Demo of the Savanna Accessible Onboarding Module');
    await expect(page.locator('.sj-header img')).toHaveCount(0);
  }
});

test('emoji only in "Simple steps with pictures"; there, a picture per question, step circles and picture tiles', async ({ page }) => {
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{23E9}-\u{23FA}]/u;
  await freshStart(page, { lang: 'en' });
  await at(page, '/index.html');
  await pick(page, 'read_type'); await page.locator('#sj-mode button[type=submit]').click();
  await page.locator('.sj-split a[href="signup.html"]').click();
  await page.waitForSelector('.dm-q');
  expect(await page.locator('main').innerText()).not.toMatch(EMOJI);
  await expect(page.locator('.dm-pic, .dm-steps')).toHaveCount(0);
  await page.evaluate(() => window.SavannaOnboarding.setPrefs(window.SavannaOnboarding.prefsForMode('simple')));
  await at(page, '/signup.html');
  await expect(page.locator('.dm-pic')).toHaveText('👥');
  await expect(page.locator('.dm-steps .dm-step-now')).toHaveText('1');
  await expect(page.locator('.dm-opt .dm-ico')).toHaveCount(2); // picture tiles
  for (const sel of ['.dm-pic', '.dm-steps']) await expect(page.locator(sel)).toHaveAttribute('aria-hidden', 'true'); // decorative: the words carry the meaning
});
