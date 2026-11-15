// Shared helpers for the onboarding module tests.
import AxeBuilder from '@axe-core/playwright';

export const APP = '/showroom.html';

/** Open the demo with a clean device: no drafts, no profile, chosen language. */
export async function freshStart(page, { lang = 'en', prefs = {}, extra = {} } = {}) {
  await page.addInitScript(([p, x]) => {
    if (sessionStorage.getItem('__seeded')) return; // seed once per test, keep data across reloads
    localStorage.clear();
    localStorage.setItem('savanna-onboarding.prefs', JSON.stringify(p));
    for (const [k, v] of Object.entries(x)) localStorage.setItem(k, JSON.stringify(v));
    sessionStorage.setItem('__seeded', '1');
  }, [{ lang, ...prefs }, extra]);
}

export async function go(page, hash = '#/') {
  await page.goto(APP + hash);
  await page.waitForFunction(() => !!window.SavannaOnboarding);
}

/** Pick an option (radio or checkbox) by its value inside the current form. */
export async function pick(page, value) {
  await page.locator(`.dm-opt:has(input[value="${value}"])`).first().click();
}
export async function next(page) {
  await page.locator('.dm-form button[type=submit]').click();
}
export async function heading(page) {
  return (await page.locator('.dm-q').first().innerText()).trim();
}

/** Run axe with WCAG 2.0/2.1/2.2 A + AA rules. Returns violations split by impact. */
export async function axe(page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  const serious = r.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
  const minor = r.violations.filter(v => v.impact !== 'critical' && v.impact !== 'serious');
  return { serious, minor, all: r.violations };
}
export function summarise(violations) {
  return violations.map(v => `${v.impact}: ${v.id} (${v.nodes.length}) ${v.help} -> ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
}

/** Walk the sign-up journey up to (and including) the given field id. */
export async function signupTo(page, stopAt) {
  await go(page, '#/signup');
  await pick(page, 'read_type'); await next(page);
  const steps = [
    ['filler', async () => pick(page, 'self')],
    ['name', async () => page.fill('[data-ref=input]', 'Abebe Kebede')],
    ['phone', async () => page.fill('[data-ref=input]', '0911234567')],
    ['id_route', async () => pick(page, 'fayda')],
    ['id_number', async () => {}],
    ['dob', async () => {}],
    ['consent', async () => pick(page, 'yes')]
  ];
  for (const [id, act] of steps) {
    if (id === stopAt) return;
    await act(); await next(page);
  }
}

/** Fake browser speech engine, behaving like the real one in continuous mode: words arrive while listening, and
 *  listening ends only on stop() or after an error. window.__say = { alts: [...] } | { error: 'network' } | { hold: true }
 *  decides what is heard next (once); { alts, autoEnd: true } imitates the browser stopping by itself after a pause. */
export function fakeSpeechEngine(page, { consent = true, transcript = null } = {}) {
  return page.addInitScript(([c, t]) => {
    if (c) localStorage.setItem('savanna-onboarding.voiceConsent', 'true');
    window.__starts = 0; window.__used = false;
    window.__say = t != null ? { alts: [t] } : { alts: ['nothing'] };
    window.SpeechRecognition = class {
      start() { window.__starts++; this.t = setTimeout(() => this.deliver(), 30); }
      deliver() {
        const say = window.__say;
        if (!say || say.hold || window.__used) return;
        window.__used = true;
        if (say.error) { this.onerror?.({ error: say.error }); this.end(); return; }
        this.onresult?.({ resultIndex: 0, results: [Object.assign(say.alts.map(x => ({ transcript: x })), { isFinal: true })] });
        if (say.autoEnd) this.end();
      }
      end() { clearTimeout(this.t); if (this.ended) return; this.ended = true; setTimeout(() => this.onend?.(), 0); }
      stop() { this.deliver(); this.end(); }
      abort() { this.end(); }
    };
  }, [consent, transcript]);
}
/** What the fake engine hears next. */
export const say = (page, value) => page.evaluate(v => { window.__say = v; window.__used = false; }, value);
/** Answer by voice: press the microphone, then press it again to stop (the microphone never stops by itself). */
export async function speakAnswer(page) {
  const mic = page.locator('[data-act=speak]');
  await mic.click();
  await page.waitForFunction(() => document.querySelector('[data-act=speak]')?.getAttribute('aria-pressed') === 'true');
  await mic.click();
}
