// Date of birth by voice (16 Nov): asked one part at a time (year, month, day), each with its own question and
// "I heard…" check; a whole date said at once goes straight to the read-back; "I don't know my exact date of birth"
// gives the year only or the age. Number words in English, Amharic and Afaan Oromo (drafts for native review).
import { test, expect } from '@playwright/test';
import { freshStart, go, next, signupTo, fakeSpeechEngine, say, speakAnswer } from './helpers.mjs';

const draft = page => page.evaluate(() => JSON.parse(localStorage.getItem('savanna-onboarding.draft.signup')));
const panelH = page => page.locator('[data-ref=dv-h]');
async function sayPart(page, words) { await say(page, { alts: [words] }); await speakAnswer(page); }

test.describe('parser', () => {
  test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); await go(page, '#/'); });

  test('parseSpokenNumber: digits and number words in three languages', async ({ page }) => {
    const cases = {
      '1990': 1990, '19 90': 1990, 'twenty-five': 25, 'twenty five': 25, 'nineteen ninety': 1990, 'nineteen ninety two': 1992,
      'two thousand and five': 2005, 'twenty twenty': 2020, 'one thousand nine hundred ninety two': 1992, 'nineteen oh five': 1905, 'the twelfth': 12,
      'thirty first': 31, 'I was born in 1990': 1990,
      'አንድ ሺህ ዘጠኝ መቶ ዘጠና ሁለት': 1992, 'ሃያ አምስት': 25, 'ሀያ አምስት': 25, 'አስራ ሁለት': 12, 'ሁለት ሺህ አምስት': 2005, 'ሠላሳ': 30, 'በ1990': 1990, '12ኛ': 12,
      'ዘጠና': 90, 'ሺ ዘጠኝ መቶ ሰማንያ': 1980, 'አስራ ዘጠኝ ዘጠና': 1990,
      'kuma tokko fi dhibba sagal fi sagaltamii lama': 1992, 'digdamii shan': 25, 'kudha lama': 12, 'kuma lama fi shan': 2005, 'soddoma': 30,
      'nothing here': null, '': null
    };
    const got = await page.evaluate(c => Object.fromEntries(Object.keys(c).map(k => [k, window.SavannaOnboarding.parseSpokenNumber(k)])), cases);
    expect(got).toEqual(cases);
  });

  test('two-digit years get the century that gives a plausible age, in the chosen calendar', async ({ page }) => {
    const r = await page.evaluate(() => { const y = window.SavannaOnboarding.eth.inferYear; return [y(90, 'eth'), y(5, 'greg'), y(5, 'eth'), y(1985, 'greg'), y(150, 'eth')]; });
    expect(r).toEqual([1990, 2005, 2005, 1985, null]);
  });

  test('month names: both calendars, three languages, small mistakes, and "month N"', async ({ page }) => {
    const r = await page.evaluate(() => {
      const m = window.SavannaOnboarding.eth.matchMonth, p = window.SavannaOnboarding.eth.parseParts;
      const pick = x => x && x.cal + '-' + x.m;
      return {
        meskeram: pick(m('Meskeram', 'eth')), tahsas: pick(m('ታህሳስ', 'eth')), hidar: pick(m('ሕዳር', 'eth')), pagume: pick(m('ጳጉሜ', 'eth')),
        yekattit: pick(m('yekattit', 'eth')), sept: pick(m('sept', 'eth')), march: pick(m('in March', 'eth')), mar: pick(m('ማርች', 'eth')),
        omEth: pick(m('Onkoloolessa', 'eth')), omGreg: pick(m('Onkoloolessa', 'greg')), none: pick(m('I do not remember', 'eth')),
        month3: p('month 3', 'eth').d, // not a month on its own in a sentence: "month 3" is for the month question
      };
    });
    expect(r).toEqual({ meskeram: 'eth-1', tahsas: 'eth-4', hidar: 'eth-3', pagume: 'eth-13', yekattit: 'eth-6', sept: 'greg-9', march: 'greg-3', mar: 'greg-3',
      omEth: 'eth-2', omGreg: 'greg-10', none: null, month3: 3 });
  });

  test('a whole date in one sentence, in three languages', async ({ page }) => {
    const r = await page.evaluate(() => {
      const p = window.SavannaOnboarding.eth.parseParts;
      return [p('12 Meskerem 1990', 'eth'), p('March 5 1990', 'eth'), p('5 3 1990', 'greg'), p('Meskerem 90', 'eth'),
        p('መስከረም 12 አንድ ሺህ ዘጠኝ መቶ ዘጠና', 'eth'), p('12 Fulbaana 1990', 'eth'), p('twelve meskerem nineteen ninety', 'eth')];
    });
    expect(r).toEqual([{ cal: 'eth', d: 12, m: 1, y: 1990 }, { cal: 'greg', d: 5, m: 3, y: 1990 }, { cal: 'greg', d: 5, m: 3, y: 1990 }, { cal: 'eth', m: 1, y: 1990 },
      { cal: 'eth', d: 12, m: 1, y: 1990 }, { cal: 'eth', d: 12, m: 1, y: 1990 }, { cal: 'eth', d: 12, m: 1, y: 1990 }]);
  });
});

test.describe('in the form', () => {
  test.beforeEach(async ({ page }) => { await freshStart(page, { lang: 'en' }); await fakeSpeechEngine(page); await signupTo(page, 'dob', 'speak'); });

  test('year, then month, then day: each heard and checked; a wrong day is asked again; then the read-back', async ({ page }) => {
    await page.locator('[data-act=date-voice]').click();
    await expect(page.locator('.dm-dv .dm-progress')).toHaveText('Part 1 of 3');
    await expect(panelH(page)).toHaveText('Which year were you born?');
    await expect(panelH(page)).toBeFocused();
    await sayPart(page, 'nineteen ninety');
    await expect(page.locator('[data-ref=dv-shown]')).toHaveText('Year: 1990');
    await expect(page.locator('input[name=y]')).toHaveValue(''); // nothing used before the check
    await page.locator('[data-act=heard-yes]').click();
    await expect(page.locator('input[name=y]')).toHaveValue('1990');
    await expect(panelH(page)).toHaveText('Which month were you born?');
    await sayPart(page, 'meskeram');
    await expect(page.locator('[data-ref=dv-shown]')).toHaveText('Month: Meskerem');
    await page.locator('[data-act=heard-yes]').click();
    await expect(page.locator('select[name=m]')).toHaveValue('1');
    await expect(page.locator('.dm-dv .dm-hint')).toHaveText('Say a number from 1 to 30.');
    await sayPart(page, 'thirty one');
    await expect(page.locator('[data-ref=dv-msg]')).toHaveText('Meskerem has 30 days. Say the day again.');
    await expect(panelH(page)).toHaveText('Which day of the month were you born?'); // only the day is asked again
    await sayPart(page, 'the twelfth');
    await page.locator('[data-act=heard-yes]').click();
    await expect(panelH(page)).toHaveText('You said 12 Meskerem 1990. That is 22 September 1997. Is that right?');
    await page.locator('[data-act=dv-use]').click();
    await expect(page.locator('.dm-dv')).toHaveCount(0);
    await expect(page.locator('[data-ref=date-conv]')).toHaveText('In the Gregorian calendar this is 22 September 1997.');
    await next(page);
    expect((await draft(page)).answers.dob).toEqual({ cal: 'eth', d: 12, m: 1, y: 1990, gregorian: '1997-09-22' });
  });

  test('the whole date in one sentence goes straight to the read-back; a Gregorian month switches the calendar', async ({ page }) => {
    await page.locator('[data-act=date-voice]').click();
    await sayPart(page, '12 Meskerem 1995');
    await expect(panelH(page)).toHaveText('You said 12 Meskerem 1995. That is 22 September 2002. Is that right?');
    await expect(page.locator('input[name=d]')).toHaveValue(''); // not used before "Use this answer"
    await next(page); // Continue before checking: asked to check first
    await expect(page.locator('.dm-status')).toContainText('First check the answer from your voice');
    await page.locator('[data-act=dv-use]').click();
    await expect(page.locator('input[name=d]')).toHaveValue('12');
    await expect(page.locator('select[name=m]')).toHaveValue('1');
    await expect(page.locator('input[name=y]')).toHaveValue('1995');
    await page.locator('[data-act=date-voice]').click();
    await expect(panelH(page)).toHaveText('You said 12 Meskerem 1995. That is 22 September 2002. Is that right?'); // what is typed counts
    await page.locator('[data-act=dv-again]').click();
    await sayPart(page, 'March 5 1990');
    await expect(panelH(page)).toHaveText('You said 5 March 1990. That is 26 Yekatit 1982. Is that right?');
    await page.locator('[data-act=dv-use]').click();
    await expect(page.getByRole('radio', { name: 'Gregorian (European) calendar' })).toBeChecked();
    await expect(page.locator('select[name=m]')).toHaveValue('3');
    await expect(page.locator('[data-ref=date-conv]')).toHaveText('In the Ethiopian calendar this is 26 Yekatit 1982.');
  });

  test('two parts at once fill both; "Change the month" asks only the month again', async ({ page }) => {
    await page.locator('[data-act=date-voice]').click();
    await sayPart(page, 'Meskerem 1990');
    await expect(page.locator('[data-ref=dv-shown]')).toHaveText('Year: 1990, Month: Meskerem');
    await page.locator('[data-act=heard-yes]').click();
    await expect(panelH(page)).toHaveText('Which day of the month were you born?');
    await sayPart(page, '12');
    await page.locator('[data-act=heard-yes]').click();
    await page.locator('[data-act=dv-change][data-part=month]').click();
    await expect(panelH(page)).toHaveText('Which month were you born?');
    await sayPart(page, 'month 2');
    await expect(page.locator('[data-ref=dv-shown]')).toHaveText('Month: Tikimt');
    await page.locator('[data-act=heard-yes]').click();
    await expect(panelH(page)).toHaveText('You said 12 Tikimt 1990. That is 22 October 1997. Is that right?');
  });

  test('invalid dates: a day not in the month, Pagume in a short year, an impossible year', async ({ page }) => {
    await page.locator('[data-act=date-voice]').click();
    await sayPart(page, '31 Meskerem 1990'); // the year and month are fine: only the day is asked again
    await expect(page.locator('[data-ref=dv-shown]')).toHaveText('Year: 1990, Month: Meskerem');
    await page.locator('[data-act=heard-yes]').click();
    await expect(panelH(page)).toHaveText('Which day of the month were you born?');
    await expect(page.locator('[data-ref=dv-msg]')).toHaveText('Meskerem has 30 days. Say the day again.');
    await page.locator('[data-act=heard-type]').click(); // type it instead: the parts already used stay
    await expect(page.locator('.dm-dv')).toHaveCount(0);
    await expect(page.locator('input[name=y]')).toHaveValue('1990');
    await expect(page.locator('input[name=d]')).toBeFocused();
    await page.locator('[data-act=date-voice]').click();
    await expect(panelH(page)).toHaveText('Which day of the month were you born?'); // what is typed counts
    await page.locator('[data-act=heard-type]').click();
    await page.fill('input[name=y]', ''); await page.selectOption('select[name=m]', '');
    await page.locator('[data-act=date-voice]').click();
    await sayPart(page, '6 Pagume 1998'); // 1998 has 5 days of Pagume
    await expect(page.locator('[data-ref=dv-shown]')).toHaveText('Year: 1998, Month: Pagume');
    await expect(page.locator('.dm-dv .dm-heard-warn')).toHaveText('Pagume has 5 days. Say the day again.');
    await page.locator('[data-act=heard-yes]').click();
    await expect(panelH(page)).toHaveText('Which day of the month were you born?');
    await expect(page.locator('.dm-dv .dm-hint')).toHaveText('Say a number from 1 to 5.');
  });

  test('a year that cannot be right is asked again', async ({ page }) => {
    await page.locator('[data-act=date-voice]').click();
    await sayPart(page, '2019');
    await expect(page.locator('[data-ref=dv-msg]')).toHaveText('That would make you 0 years old. Say the year again.');
    await expect(panelH(page)).toHaveText('Which year were you born?');
    await sayPart(page, 'I do not remember');
    await expect(page.locator('[data-ref=dv-msg]')).toContainText('I did not catch a year.');
  });

  test('"I don\'t know my exact date of birth": the year only, or the age', async ({ page }) => {
    await page.locator('[data-act=date-voice]').click();
    await page.locator('[data-act=dv-unknown]').click();
    await expect(panelH(page)).toHaveText("I don't know my exact date of birth");
    await page.locator('[data-act=dv-mode][data-mode=year]').click();
    await expect(panelH(page)).toHaveText('Which year were you born?');
    await expect(page.locator('.dm-dv .dm-progress')).toHaveCount(0);
    await sayPart(page, 'ninety');
    await expect(page.locator('[data-ref=dv-shown]')).toHaveText('Year: 1990');
    await page.locator('[data-act=heard-yes]').click();
    await expect(panelH(page)).toHaveText('You said about 1990. Is that right?');
    await page.locator('[data-act=dv-use]').click();
    await expect(page.locator('[data-ref=date-about]')).toHaveText('About 1990 (in the Gregorian calendar 1997 or 1998)');
    await next(page);
    expect((await draft(page)).answers.dob).toEqual({ cal: 'eth', precision: 'year', y: 1990 });
    await page.locator('[data-act=back]').click();
    await expect(page.locator('[data-ref=date-about]')).toHaveCount(1);
    await page.locator('[data-act=date-voice]').click();
    await page.locator('[data-act=dv-unknown]').click();
    await page.locator('[data-act=dv-mode][data-mode=age]').click();
    await expect(panelH(page)).toHaveText('How old are you?');
    await sayPart(page, 'twenty five');
    await page.locator('[data-act=heard-yes]').click();
    await expect(panelH(page)).toHaveText('You said you are 25 years old. Is that right?');
    await page.locator('[data-act=dv-use]').click();
    await expect(page.locator('[data-ref=date-about]')).toHaveText('About 25 years old');
    await next(page);
    const dob = (await draft(page)).answers.dob;
    expect(dob).toMatchObject({ cal: 'eth', precision: 'age', age: 25 });
    expect(dob.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // and back to an exact date
    await page.locator('[data-act=back]').click();
    await page.locator('[data-act=dv-exact]').click();
    await expect(page.locator('input[name=d]')).toBeFocused();
  });
});

test('Amharic: the read-back is made of recorded clips, all on the phone (a date of birth never goes to an online voice)', async ({ page }) => {
  await freshStart(page, { lang: 'am' }); await fakeSpeechEngine(page);
  await signupTo(page, 'dob', 'speak');
  await page.locator('[data-act=date-voice]').click();
  await expect(panelH(page)).toHaveText('በየትኛው ዓመት ተወለዱ?');
  await sayPart(page, 'መስከረም 12 አንድ ሺህ ዘጠኝ መቶ ዘጠና');
  await expect(panelH(page)).toContainText('12 መስከረም 1990 ብለዋል።');
  const items = await page.evaluate(() => window.SavannaOnboarding.player.last.items.map(i => [i.key, !!i.local]));
  expect(items.map(i => i[0])).toEqual(['num-12', 'month-eth-1', 'num-1', 'num-1000', 'num-9', 'num-100', 'num-90', 'dv-readback-b',
    'num-22', 'month-greg-9', 'num-1', 'num-1000', 'num-9', 'num-100', 'num-97', 'dv-readback-c']);
  expect(items.every(i => i[1])).toBe(true);
  // every piece has a recorded clip in the catalog
  const keys = await page.evaluate(() => window.SavannaOnboarding.speechCatalog('am').map(x => x.key));
  for (const [k] of items) expect(keys).toContain(k);
});
