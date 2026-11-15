// Run: node tools/audio-script.cjs  (from savanna-onboarding/). Builds docs/audio-script.md from the live form configs and interface strings (run in Chromium so the engine loads).
const { chromium } = require('@playwright/test');
const fs = require('fs');
const ROOT = require('path').join(__dirname, '..').split('\\').join('/') + '/';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file:///' + ROOT + 'index.html');
  await p.waitForFunction(() => window.SavannaOnboarding && window.SavannaOnboarding.forms.passport);
  const data = await p.evaluate(() => {
    const D = window.SavannaOnboarding, am = v => (v && (v.am || v)) || '';
    const ui = {}; // interface strings: read via a throwaway form in Amharic
    return {
      forms: ['signup', 'identity', 'passport'].map(id => ({ id, cfg: D.forms[id], fields: D.forms[id].fields.map(f => ({
        id: f.id, type: f.type, label: am(f.label), hint: am(f.hint), body: am(f.body), partner: !!(f.showIf && f.showIf.field === 'filler'),
        showIf: f.showIf && f.showIf.field ? f.showIf.field + (f.showIf.equals ? ' = ' + f.showIf.equals : ' is one of ' + (f.showIf.in || []).join(', ')) : '',
        options: (f.options === 'NEEDS' ? D.NEEDS : (f.options || [])).map(o => ({ value: o.value, text: am(o.label) }))
      })), reviewNote: am(D.forms[id].reviewNote), submit: am(D.forms[id].submitLabel), doneTitle: am(D.forms[id].doneTitle), doneText: am(D.forms[id].doneText) }))
    };
  });
  // interface strings come straight from the engine source (the UI.am object)
  const src = fs.readFileSync(ROOT + 'savanna-onboarding.js', 'utf8');
  const amBlock = src.slice(src.indexOf('    am: {'), src.indexOf('\n    }\n  };', src.indexOf('    am: {')));
  const S = k => { const m = amBlock.match(new RegExp("\\b" + k + ": '([^']*)'")); if (!m) throw new Error('no string ' + k); return m[1]; };
  await b.close();
  // the journey's home page (journey/journey.js): its own "How do you like to register?" wording
  const jsrc = fs.readFileSync(ROOT + 'journey/journey.js', 'utf8');
  const jam = jsrc.slice(jsrc.indexOf('    am: {'), jsrc.indexOf('\n    },', jsrc.indexOf('    am: {')));
  const J = k => { const m = jam.match(new RegExp("\\b" + k + ": '([^']*)'")); if (!m) throw new Error('no journey string ' + k); return m[1]; };
  const version = (src.match(/version: '([^']+)'/) || [])[1] || '';
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const secs = text => {
    const eth = (text.match(/[\u1200-\u137F]/g) || []).length;           // one Ethiopic character ≈ one syllable
    const lat = (text.match(/[A-Za-z]+/g) || []).length * 2;              // English words / names ≈ 2 syllables
    const digits = (text.match(/[0-9]/g) || []).length;                   // numbers read digit by digit
    return Math.max(2, Math.round((eth + lat + digits) / 4 + 1));         // slow, clear reading ≈ 4 syllables a second, plus a pause
  };
  const rows = []; let n = 0;
  const add = (section, file, text, note) => rows.push({ section, n: ++n, file: 'am/' + file + '.mp3', text, s: secs(text), note: note || '' });

  add('Start', 'home-question', J('modeTitle') + ' ' + J('modeHint'), 'Home page (the four answers below are shared)');
  add('Start', 'welcome-question', S('welcomeTitle') + ' ' + S('welcomeHint'), 'Inside the form (test page and other sites)');
  ['read_type', 'listen', 'speak', 'simple'].forEach(m => add('Start', 'welcome-option-' + m.replace('_', '-'), S('m_' + m)));
  const SECTIONS = { signup: 'Sign-up', identity: 'Add your ID (optional), from My profile', passport: 'Support Passport' };
  for (const form of data.forms) {
    const sec = SECTIONS[form.id];
    for (const f of form.fields) {
      const note = f.showIf ? 'Only when ' + f.showIf : '';
      add(sec, form.id + '-' + f.id.replace(/_/g, '-') + '-question', [f.label, f.body, f.hint].filter(Boolean).join(' '), note);
      for (const o of f.options) add(sec, form.id + '-' + f.id.replace(/_/g, '-') + '-option-' + o.value.replace(/_/g, '-'), o.text, '');
      if (f.type === 'ethdate') { // the calendar choice inside the date question
        add(sec, form.id + '-' + f.id + '-calendar', S('calendar'), 'Date question: calendar choice');
        add(sec, form.id + '-' + f.id + '-option-eth', S('calEth'), '');
        add(sec, form.id + '-' + f.id + '-option-greg', S('calGreg'), '');
      }
    }
    add(sec, form.id + '-check-answers', S('review') + '። ' + S('reviewHint'));
    if (form.reviewNote) add(sec, form.id + '-check-answers-note', form.reviewNote);
    add(sec, form.id + '-done', form.doneTitle + ' ' + form.doneText);
  }
  const common = [['help', S('helpTitle') + ' ' + S('helpText')], ['resumed', S('resumed')], ['prefilled', S('prefilled')],
    ['error-choose-one', S('errChoice')], ['error-choose-some', S('errMulti')], ['error-required', S('errRequired')],
    ['error-phone', S('errPhone')], ['error-date', S('errDate')], ['error-consent', S('errConsent')], ['error-mode', S('errMode')],
    ['voice-consent', S('voiceConsentTitle') + '። ' + S('voiceConsent')], ['voice-check', S('heardCheck')], ['voice-used', S('voiceUsed')],
    ['saved-for-later', S('savedTitle') + '። ' + S('savedText')]];
  common.forEach(([f, txt]) => add('On every screen when needed', f, txt));
  // Digits, for reading an ID number back on the phone only (never through an online voice)
  ['ዜሮ', 'አንድ', 'ሁለት', 'ሶስት', 'አራት', 'አምስት', 'ስድስት', 'ሰባት', 'ስምንት', 'ዘጠኝ'].forEach((w, d) => add('Digits (ID number read back, on the phone only)', 'digit-' + d, w));

  const total = rows.reduce((a, r) => a + r.s, 0);
  let md = `# Amharic audio script: sign-up, Add your ID and Support Passport

> Generated from the live text (\`forms.js\`, \`savanna-onboarding.js\` and \`journey/journey.js\`, module ${version}) on
> ${today}, so every line matches the screen word for word. Change the text **in the code first**, then regenerate this
> list (\`node tools/audio-script.cjs\`), so screen and audio never differ.
>
> **Demo audio:** the clips are generated with Microsoft's Amharic neural voice (edge-tts, an unofficial tool) by
> \`python tools/generate-audio.py\`. They will be replaced with human recordings, or Microsoft's official Azure service,
> in the hardening sprint. Human recordings use the same file names (see "How to record").
> Each clip plays from the "Listen" button and the per-option play buttons. Audio is never required: every clip has the
> same words on screen (WCAG 1.2.1). Amharic only: Afaan Oromo has no Microsoft voice and stays text only.

## How to record

- **Format:** MP3 (recommended), mono, 44.1 kHz or 48 kHz, 64–96 kbps, ideally under 300 KB (small files for 3G).
  M4A (AAC) also works: keep the same name with \`.m4a\`. One clip per file, file names exactly as listed.
- **Where:** \`savanna-onboarding/assets/audio/am/\`.
- **Check:** from \`savanna-onboarding/\`, run \`node tools/check-audio.cjs\`. It lists found, missing and broken clips
  and writes \`assets/audio/manifest.json\`. Commit the clips and the manifest together: a clip that is not in the
  manifest is never played.
- **Missing clips are fine:** the phone's voice reads instead (if it has one); otherwise a short message says the
  words are on the screen. Audio is never required.
- **Recorded for later:** six clips under "On every screen when needed" are not played yet: \`help\`, \`resumed\`,
  \`prefilled\`, \`voice-consent\`, \`voice-check\` and \`voice-used\`. Record them last. (The error clips and
  \`saved-for-later\` are played.)
- **Voice:** calm, slow and clear, as if to someone hearing it for the first time. Leave about half a second of silence
  at the start and end. No music.
- **Lengths** are estimates (about 4 syllables a second, plus a pause). Natural speech that runs longer is fine.
- **Names stay as written:** AAAPD, Tomorrow is Better, RRS / UNHCR, Fayda, ALX, Google.
- Read numbers as the learner will see them (for example "0911 234 567" digit by digit).

**${rows.length} clips, about ${Math.round(total / 60)} minutes of audio in total.**
`;
  let sec = '';
  for (const r of rows) {
    if (r.section !== sec) {
      sec = r.section;
      md += `\n## ${sec}\n\n| # | File | Exact Amharic text | About | Note |\n|---|---|---|---|---|\n`;
    }
    md += `| ${r.n} | \`${r.file}\` | <span lang="am">${r.text.replace(/\|/g, '\\|')}</span> | ${r.s} s | ${r.note} |\n`;
  }
  md += `\n## Not in this list (later, if time allows)\n\n- English versions (the device voice usually reads English well enough).\n- Job board, job application and employer form.\n- Messages that contain a changing number (for example "There are now 10 questions"): read by the device voice.\n`;
  fs.writeFileSync(ROOT + 'docs/audio-script.md', md);
  console.log(rows.length, 'clips', total, 'seconds');
})();
