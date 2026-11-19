// Pitch-day fix 1 (19 Nov): the full loop. /host-demo/ mounts sign-up and the Support Passport with the public API,
// receives every event, saves each record in IndexedDB, checks it against the JSON Schemas in docs/api-schema.md,
// exports JSON / CSV, deletes all, and (only when turned on) POSTs each record to the host's endpoint.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { createRequire } from 'module';
import { freshStart, pick, next, axe, summarise } from './helpers.mjs';

const require = createRequire(import.meta.url);
const PAGE = '/host-demo/';
test.use({ serviceWorkers: 'block' });

async function open(page) {
  await page.goto(PAGE);
  await page.waitForFunction(() => !!window.SavannaOnboarding && !!document.querySelector('#slot .dm-q'));
}
const rows = page => page.locator('#rows tr');
const row = (page, event) => page.locator('#rows tr', { has: page.getByRole('button', { name: event, exact: true }) });

async function finishSignup(page) {
  await pick(page, 'self'); await next(page);
  await page.fill('[data-ref=input]', 'Abebe Kebede'); await next(page);
  await page.fill('[data-ref=input]', '0911234567'); await next(page);
  await next(page); // date of birth is optional
  await pick(page, 'yes'); await next(page);
  await expect(page.locator('#slot .dm-q')).toContainText(/check/i);
  await page.locator('#slot .dm-form button[type=submit]').click();
}
async function finishPassport(page) {
  await page.locator('input[name=form][value=passport]').check();
  await page.locator('#mount').click();
  await pick(page, 'yes'); await next(page);
  await pick(page, 'screen_reader'); await pick(page, 'captions'); await next(page);
  await next(page); // other need: optional
  await next(page); // sharing: "ask" is the default
  await page.locator('#slot .dm-form button[type=submit]').click();
}

test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); });

test('the full loop: every event is received, saved and passes the schema; sign-up and Support Passport arrive', async ({ page }) => {
  await open(page);
  await expect(row(page, 'savanna-onboarding:ready')).toHaveCount(1); // listened before the module loaded
  await finishSignup(page);
  await expect(page.locator('#count')).toContainText('Record');
  await finishPassport(page);
  await expect(row(page, 'savanna-onboarding:complete')).toHaveCount(2);
  // every record passes, and none is still "checking"
  const verdicts = await page.locator('#rows .badge').allInnerTexts();
  expect(verdicts.length).toBeGreaterThan(10);
  expect(verdicts.filter(v => v !== 'Pass'), 'records that fail the schema').toEqual([]);
  // open the sign-up record: the full JSON and the schema check
  const signup = row(page, 'savanna-onboarding:complete').last(); // newest first: the last row is sign-up
  await signup.getByRole('button').click();
  await expect(page.locator('#detail-h')).toBeFocused();
  await expect(page.locator('#detail-check')).toHaveText(/Schema check: pass \(against savanna-onboarding\/complete and savanna-onboarding\/answers\/signup/);
  const json = JSON.parse(await page.locator('#detail-json').innerText());
  expect(json.detail).toMatchObject({ form: 'signup', lang: 'en', answers: { filler: 'self', name: 'Abebe Kebede', phone: '0911234567', consent: 'yes' } });
  await expect(signup.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  // the passport record
  await row(page, 'savanna-onboarding:complete').first().getByRole('button').click();
  const pj = JSON.parse(await page.locator('#detail-json').innerText());
  expect(pj.detail.answers).toMatchObject({ want: 'yes', needs: ['screen_reader', 'captions'], sharing: 'ask' });
  await expect(page.locator('#detail-check')).toContainText('answers/passport');
});

test('records stay after a reload (IndexedDB); Download JSON and CSV; Delete all asks first, then empties', async ({ page }) => {
  await open(page);
  await finishSignup(page);
  await expect(row(page, 'savanna-onboarding:complete')).toHaveCount(1);
  const n = await rows(page).count();
  await page.reload();
  await page.waitForFunction(() => !!window.SavannaOnboarding);
  await expect(row(page, 'savanna-onboarding:complete')).toHaveCount(1);
  await expect.poll(() => rows(page).count()).toBeGreaterThan(n); // the old records, plus this load's ready and step

  const [dj] = await Promise.all([page.waitForEvent('download'), page.locator('#dl-json').click()]);
  const data = JSON.parse(fs.readFileSync(await dj.path(), 'utf8'));
  expect(dj.suggestedFilename()).toBe('savanna-records.json');
  expect(data.find(r => r.event === 'savanna-onboarding:complete').detail.answers.name).toBe('Abebe Kebede');
  expect(data.every(r => r.schema && r.schema.ok)).toBe(true);

  const [dc] = await Promise.all([page.waitForEvent('download'), page.locator('#dl-csv').click()]);
  const csv = fs.readFileSync(await dc.path(), 'utf8');
  expect(csv.split('\r\n')[0]).toBe('﻿id,event,received_at,form,lang_or_mode,schema,endpoint,fields,detail_json');
  expect(csv).toContain('savanna-onboarding:complete,');
  expect(csv).toContain('""name"":""Abebe Kebede""'); // JSON inside a quoted CSV cell

  await page.locator('#del').click();
  await expect(page.locator('#del-yes')).toBeFocused();
  await expect(rows(page).first()).not.toContainText('No records yet'); // nothing deleted before confirming
  await page.locator('#del-no').click();
  await expect(page.locator('#del')).toBeFocused();
  await page.locator('#del').click();
  await page.locator('#del-yes').click();
  await expect(page.locator('#count')).toHaveText('All records deleted.');
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText('No records yet');
  await page.reload();
  await page.waitForFunction(() => !!window.SavannaOnboarding);
  await expect(row(page, 'savanna-onboarding:complete')).toHaveCount(0);
});

test('Send to your endpoint: off by default (nothing sent); when on, each new record is POSTed as JSON', async ({ page }) => {
  const posts = [];
  await page.route('https://collector.example/**', async r => {
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST' } });
    posts.push({ type: r.request().headers()['content-type'], body: JSON.parse(r.request().postData()) });
    return r.fulfill({ status: 201, headers: { 'access-control-allow-origin': '*' }, body: '' });
  });
  await open(page);
  await expect(page.locator('#send-on')).not.toBeChecked();
  await pick(page, 'self'); await next(page);
  await page.waitForTimeout(300);
  expect(posts).toEqual([]); // off by default

  // turning it on without an address: refused with a plain message, focus on the address
  await page.locator('#send-on').click(); // refused: the box unticks itself
  await expect(page.locator('#send-on')).not.toBeChecked();
  await expect(page.locator('#send-err')).toContainText('Type a full address');
  await expect(page.locator('#send-url')).toBeFocused();

  await page.fill('#send-url', 'https://collector.example/savanna/events');
  await page.locator('#send-on').check();
  await expect(page.locator('#count')).toContainText('Sending is on');
  await page.locator('#slot [data-ref=input]').fill('Abebe Kebede'); await next(page);
  await expect.poll(() => posts.length).toBeGreaterThan(0);
  expect(posts[0].type).toContain('application/json');
  expect(posts[0].body).toMatchObject({ event: 'savanna-onboarding:step', detail: { form: 'signup', mode: 'question' } });
  expect(posts[0].body.receivedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  await expect(page.locator('#rows tr').first()).toContainText('sent (201)');
});

test('an endpoint that cannot be reached is shown as failed; the page keeps working', async ({ page }) => {
  await page.route('https://nocors.example/**', r => r.abort('connectionrefused'));
  await open(page);
  await page.fill('#send-url', 'https://nocors.example/in');
  await page.locator('#send-on').check();
  await pick(page, 'self'); await next(page);
  await expect(page.locator('#rows tr').first()).toContainText('failed');
  await expect(page.locator('#slot .dm-q')).toBeVisible();
});

test('the schema check really fails a bad record (validator, against the published api-schema.md)', async () => {
  const S = require('../host-demo/schema-check.js');
  const schemas = S.parseSchemas(fs.readFileSync(new URL('../docs/api-schema.md', import.meta.url), 'utf8'));
  expect(schemas.problems).toEqual([]);
  for (const id of ['savanna-onboarding/no-detail', 'savanna-onboarding/prefs', 'savanna-onboarding/step', 'savanna-onboarding/complete',
    'savanna-onboarding/answers/signup', 'savanna-onboarding/answers/passport', 'savanna-onboarding/answers/profile', 'savanna-onboarding/answers/takeover',
    'savanna-onboarding/answers/identity', 'savanna-onboarding/answers/apply', 'savanna-onboarding/answers/employer']) expect(schemas.byId[id], id).toBeTruthy();
  const ok = { form: 'passport', instance: null, lang: 'en', answers: { want: 'yes', needs: ['captions'], sharing: 'ask' } };
  expect(S.checkEvent('savanna-onboarding:complete', ok, schemas).ok).toBe(true);
  const bad = S.checkEvent('savanna-onboarding:complete', { ...ok, answers: { want: 'yes', needs: ['diagnosis'], sharing: 'employers' } }, schemas);
  expect(bad.ok).toBe(false);
  expect(bad.errors.join('\n')).toMatch(/needs\[0\]/);
  expect(bad.errors.join('\n')).toMatch(/sharing/);
  const date = d => S.checkEvent('savanna-onboarding:complete', { form: 'signup', instance: null, lang: 'am', answers: { filler: 'self', name: 'አበበ', phone: '0911234567', consent: 'yes', dob: d } }, schemas).ok;
  expect(date({ cal: 'eth', d: 1, m: 1, y: 2000, gregorian: '2007-09-12' })).toBe(true);
  expect(date({ cal: 'eth', precision: 'year', y: 2000 })).toBe(true);
  expect(date({ cal: 'eth', d: 1, m: 14, y: 2000, gregorian: '2007-09-12' })).toBe(false);
  expect(S.checkEvent('savanna-onboarding:ready', null, schemas).ok).toBe(true);
  expect(S.checkEvent('savanna-onboarding:step', { form: 'signup', mode: 'question', step: 1 }, schemas).ok).toBe(false); // summary missing
});

test('host demo: axe finds no serious or critical issues, also with a record open', async ({ page }) => {
  await open(page);
  await pick(page, 'self'); await next(page);
  await row(page, 'savanna-onboarding:ready').getByRole('button').click();
  const { serious } = await axe(page);
  expect(summarise(serious)).toEqual([]);
});

test('learner pages never link to the host demo', async () => {
  const dir = new URL('..', import.meta.url);
  const pages = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'showroom.html');
  for (const f of pages) expect(fs.readFileSync(new URL(f, dir), 'utf8'), f).not.toContain('host-demo');
  for (const f of fs.readdirSync(new URL('journey/', dir))) expect(fs.readFileSync(new URL('journey/' + f, dir), 'utf8'), f).not.toContain('host-demo');
});
