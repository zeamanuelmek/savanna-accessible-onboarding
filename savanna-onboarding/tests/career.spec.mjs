// Phase 7: career gateway polish — application prefilled from the profile with reviewed voice for open questions,
// the employer accommodations form, the private "support I need" filter, and JobPosting output that matches
// docs/api-schema.md. Also: the screen-reader tip (welcome and Help) and the learner-controlled offline audio download.
import { test, expect } from '@playwright/test';
import { freshStart, go, pick, next, heading, signupTo, fakeSpeechEngine, speakAnswer } from './helpers.mjs';

const learner = page => page.evaluate(() => {
  localStorage.setItem('savanna-onboarding.profile', JSON.stringify({ name: 'Abebe Kebede', phone: '0911234567', id_route: 'kebele', assurance_level: 'self_declared', registered_by: null }));
  localStorage.setItem('savanna-onboarding.passport', JSON.stringify({ needs: ['remote', 'screen_reader'], other_need: 'quiet corner', sharing: 'ask' }));
});

test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); });

test('application: prefilled from the profile, and the open questions take voice with the check-before-use step', async ({ page }) => {
  await fakeSpeechEngine(page, { transcript: 'I enjoy helping customers' });
  await go(page, '#/');
  await learner(page);
  await go(page, '#/apply/s3');
  await expect(page.locator('[data-ref=input]')).toHaveValue('Abebe Kebede');
  await expect(page.locator('.dm-hint')).toContainText('We filled this in from your profile');
  await next(page);
  await expect(page.locator('[data-ref=input]')).toHaveValue('0911234567');
  await next(page);
  expect(await heading(page)).toBe('Why do you want this job?');
  await speakAnswer(page);
  await expect(page.locator('[data-ref=heard-edit]')).toHaveValue('I enjoy helping customers');
  await expect(page.locator('[data-ref=input]')).toHaveValue(''); // nothing used before the check
  await page.fill('[data-ref=heard-edit]', 'I enjoy helping customers in Amharic and English.');
  await page.locator('[data-act=heard-yes]').click();
  await next(page);
  await page.fill('[data-ref=input]', 'Volunteer at a youth centre.'); await next(page);
  await next(page); // interview: optional
  await expect(page.locator('[data-act=speak]')).toHaveCount(0); // sharing support: never by voice
  await pick(page, 'keep'); await next(page);
  expect(await heading(page)).toBe('Check your answers');
  await next(page);
  const packet = JSON.parse(await page.locator('.dm-done-slot pre code').innerText());
  expect(packet).toMatchObject({ name: 'Abebe Kebede', phone: '0911234567', why: 'I enjoy helping customers in Amharic and English.' });
  expect(packet.supportThatHelps).toBeUndefined();
  expect(JSON.stringify(packet)).not.toContain('quiet corner');
});

test('employer accommodations form: the job appears on the board with its support, and as schema.org JobPosting matching docs/api-schema.md', async ({ page }) => {
  await go(page, '#/employer');
  await page.fill('[data-ref=input]', 'Data entry assistant'); await next(page);
  await page.fill('[data-ref=input]', 'Gondar Data Services'); await next(page);
  await page.fill('[data-ref=input]', 'Piassa, Gondar'); await next(page);
  await pick(page, 'remote'); await next(page);
  await pick(page, 'screen_reader'); await pick(page, 'flexible_hours'); await next(page);
  await page.fill('[data-ref=input]', 'Type records from scanned forms.'); await next(page);
  await page.fill('[data-ref=input]', 'jobs@example.org'); await next(page);
  await expect(page.locator('.dm-review')).toContainText('Support offered');
  await next(page);
  await page.locator('.dm-done-slot summary').click();
  const ld = JSON.parse(await page.locator('.dm-done-slot pre code').innerText());
  expect(ld).toMatchObject({
    '@context': 'https://schema.org', '@type': 'JobPosting', title: 'Data entry assistant', description: 'Type records from scanned forms.',
    hiringOrganization: { '@type': 'Organization', name: 'Gondar Data Services' },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Piassa, Gondar', addressCountry: 'ET' } },
    jobLocationType: 'TELECOMMUTE',
    jobBenefits: 'Works with a screen reader; Flexible working hours',
    additionalProperty: [{ '@type': 'PropertyValue', name: 'workplaceSupportOffered', value: ['screen_reader', 'flexible_hours'] }],
    applicationContact: { '@type': 'ContactPoint', description: 'jobs@example.org' }
  });
  expect(ld.datePosted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await go(page, '#/jobs');
  await expect(page.locator('.job h2', { hasText: 'Data entry assistant' })).toHaveCount(1);
});

test('the job board publishes every job as JobPosting JSON-LD (Level 3), whatever the private filter shows', async ({ page }) => {
  await go(page, '#/');
  await learner(page);
  await go(page, '#/jobs');
  const read = () => page.evaluate(() => JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent));
  let ld = await read();
  expect(ld).toHaveLength(4);
  expect(ld.every(j => j['@type'] === 'JobPosting' && j.additionalProperty[0].name === 'workplaceSupportOffered')).toBe(true);
  expect(ld.find(j => j.title.startsWith('Remote content moderator')).jobLocationType).toBe('TELECOMMUTE');
  expect(ld.find(j => j.title.startsWith('Junior data entry')).jobLocationType).toBeUndefined(); // on site: omitted
  await page.locator('#flt').check();
  ld = await read();
  expect(ld).toHaveLength(4);
});

test('the private "support I need" filter works on the phone only, and says how many jobs are shown', async ({ page }) => {
  await go(page, '#/');
  await learner(page);
  const sent = [];
  page.on('request', r => { if (!/\.(js|css|woff2|png|svg|json)(\?|$)|\.html|\/$/.test(r.url())) sent.push(r.url()); });
  await go(page, '#/jobs');
  await expect(page.locator('.filter label')).toContainText('Only show jobs that offer all the support I need');
  await expect(page.locator('.filter')).toContainText('The job board never sees it');
  await page.locator('#flt').check();
  await expect(page.locator('#flt')).toBeFocused();
  await expect(page.locator('#jobs-status')).toHaveText('1 job shown');
  await expect(page.locator('.job h2')).toHaveText(['Remote content moderator']);
  await page.locator('#flt').uncheck();
  await expect(page.locator('#jobs-status')).toHaveText('4 jobs shown');
  expect(sent).toEqual([]); // nothing about the learner's needs leaves the page
});

test('screen-reader tip: on the welcome screen before the first question, and in Help, in English and Amharic', async ({ page }) => {
  await go(page, '#/');
  await page.evaluate(() => window.SavannaOnboarding.setPrefs({ lang: 'am' }));
  await go(page, '#/signup');
  await expect(page.locator('.dm')).toHaveAttribute('lang', 'am');
  const tip = page.locator('.dm-sr-tip').first();
  await expect(tip.locator('p[lang=en]')).toHaveText('If your screen reader spells Amharic letters one by one, turn on Read aloud to hear recorded Amharic, or switch to English.');
  await expect(tip.locator('p[lang=am]')).toContainText('የስክሪን አንባቢዎ');
  // reading order: question heading, then the tip, then the first answer
  const order = await page.evaluate(() => {
    const all = [...document.querySelectorAll('.dm-q, .dm-sr-tip, .dm-opt')].filter(e => e.getClientRects().length); // visible only (Help is closed)
    return all.slice(0, 3).map(e => e.className.split(' ')[0]);
  });
  expect(order).toEqual(['dm-q', 'dm-note', 'dm-opt']);
  await pick(page, 'read_type'); await next(page);
  await page.locator('.dm-bar [data-act=help]').click();
  await expect(page.locator('[data-ref=help] .dm-sr-tip p[lang=en]')).toBeVisible();
});

test.describe('offline audio download (Settings)', () => {
  test.use({ serviceWorkers: 'block' });
  const manifest = { am: { 'signup-filler-question': 'signup-filler-question.mp3', 'signup-filler-option-self': 'signup-filler-option-self.mp3' },
    bytes: { am: { 'signup-filler-question.mp3': 600000, 'signup-filler-option-self.mp3': 450000 } } };
  async function serve(page, { clips = true } = {}) {
    await page.route('**/assets/audio/manifest.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(manifest) }));
    await page.route(/assets\/audio\/am\/[^/]+\.mp3$/, r => clips ? r.fulfill({ contentType: 'audio/mpeg', body: Buffer.from('ID3' + 'x'.repeat(100)) }) : r.abort());
  }

  test('shows the size, downloads with progress, and can be removed', async ({ page }) => {
    await serve(page);
    await go(page, '#/settings');
    const box = page.locator('.dm-offline-audio');
    await expect(box.locator('h2')).toHaveText('Amharic audio for offline use');
    await expect(box).toContainText('No recordings are downloaded yet.');
    const dl = box.getByRole('button', { name: 'Download Amharic audio for offline use (about 1.0 MB)' });
    await dl.click();
    await expect(box.locator('[data-ref=audio-status]')).toContainText('Done. 2 recordings are on this phone and work offline.');
    await expect(box).toContainText('2 of 2 recordings are on this phone.');
    await expect(box.locator('[data-act=audio-download]')).toHaveCount(0);
    await box.getByRole('button', { name: 'Remove downloaded audio' }).click();
    await expect(box.locator('[data-ref=audio-status]')).toContainText('Downloaded audio was removed from this phone.');
    await expect(box.locator('[data-act=audio-download]')).toHaveCount(1);
    expect(await page.evaluate(async () => (await caches.keys()).includes('savanna-onboarding-audio'))).toBe(false);
  });

  test('a downloaded recording plays from the phone even when the network fails', async ({ page }) => {
    await serve(page);
    await page.addInitScript(() => {
      window.__clips = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () { window.__clips.push(this.src.slice(0, 5)); return play.call(this).catch(() => {}); };
    });
    await freshStart(page, { lang: 'am' });
    await go(page, '#/settings');
    await page.locator('[data-act=audio-download]').click();
    await expect(page.locator('[data-ref=audio-status]')).toContainText('2');
    await page.unroute(/assets\/audio\/am\/[^/]+\.mp3$/);
    await page.route(/assets\/audio\/am\/[^/]+\.mp3$/, r => r.abort()); // the network fails from now on
    await page.evaluate(() => window.SavannaOnboarding.setPrefs({ lang: 'am', easy: true }));
    await go(page, '#/signup');
    await pick(page, 'read_type'); await next(page);
    await page.locator('[data-act=listen]').click();
    await expect.poll(() => page.evaluate(() => window.__clips)).toContain('blob:'); // played from the downloaded copy
  });

  test('before recordings exist, Settings says so instead of offering an empty download', async ({ page }) => {
    await go(page, '#/settings');
    await expect(page.locator('.dm-offline-audio')).toContainText('Amharic recordings are not available yet.');
    await expect(page.locator('[data-act=audio-download]')).toHaveCount(0);
  });
});
