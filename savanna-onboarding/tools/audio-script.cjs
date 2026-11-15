// Run: node tools/audio-script.cjs  (from savanna-onboarding/). Builds docs/audio-script.md: every fixed text that is
// read aloud, in Amharic and Afaan Oromo, with the exact clip name the player looks for. The words come from the
// live code (SavannaOnboarding.speechCatalog, SavannaJourney.speechCatalog, SavannaDemoHost.speechCatalog), loaded in
// Chromium, so a clip always matches the screen word for word. Change wording in the code first, then run this.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const ROOT = require('path').join(__dirname, '..').split('\\').join('/') + '/';
const LANGS = { am: 'Amharic', om: 'Afaan Oromo' };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file:///' + ROOT + 'index.html');
  await p.waitForFunction(() => window.SavannaOnboarding && window.SavannaOnboarding.forms.passport && window.SavannaJourney && window.SavannaDemoHost);
  const data = await p.evaluate(langs => {
    const out = {};
    langs.forEach(l => {
      const seen = {}, rows = [];
      [window.SavannaJourney.speechCatalog(l), window.SavannaOnboarding.speechCatalog(l), window.SavannaDemoHost.speechCatalog(l)].forEach(list =>
        list.forEach(x => { if (!seen[x.key] && x.text && x.text.trim()) { seen[x.key] = 1; rows.push(x); } }));
      out[l] = rows;
    });
    return { rows: out, version: window.SavannaOnboarding.version };
  }, Object.keys(LANGS));
  await b.close();

  const secs = text => {
    const eth = (text.match(/[\u1200-\u137F]/g) || []).length;  // one Ethiopic character ≈ one syllable
    const lat = (text.match(/[A-Za-z]+/g) || []).length * 2;     // Latin words ≈ 2 syllables
    const digits = (text.match(/[0-9]/g) || []).length;
    return Math.max(1, Math.round((eth + lat + digits) / 4 + 0.5));
  };
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  let total = 0, count = 0, n = 0;
  let body = '';
  for (const l of Object.keys(LANGS)) {
    let sec = '';
    for (const r of data.rows[l]) {
      if (r.section !== sec) {
        sec = r.section;
        body += `\n## ${LANGS[l]} — ${sec}\n\n| # | File | Exact text | About |\n|---|---|---|---|\n`;
      }
      const s = secs(r.text); total += s; count++;
      body += `| ${++n} | \`${l}/${r.key}.mp3\` | <span lang="${l}">${r.text.replace(/\|/g, '\\|').replace(/\n/g, ' ')}</span> | ${s} s |\n`;
    }
  }
  const md = `# Audio script: every fixed text that is read aloud (Amharic and Afaan Oromo)

> Generated from the live code (module ${data.version}) on ${today} by \`node tools/audio-script.cjs\`, so every line
> matches the screen word for word. Change the text **in the code first**, then regenerate this list and the clips.
>
> **Reading never depends on a live service for fixed text:** every page summary, question, answer, hint, message and
> number below has a recorded clip. The online voice (Addis AI, through the host's proxy) is used only for dynamic
> text: names, typed answers, job text written by employers, lists built from the learner's own answers.
>
> **Amharic:** demo Amharic audio was generated with Microsoft's Amharic neural voice (edge-tts, an unofficial tool)
> from our reviewed text: \`python tools/generate-audio.py\` (Mekdes). It will be replaced with human recordings, or
> Microsoft's official Azure service, in the hardening sprint. **Afaan Oromo:** generated once with Addis AI (voice
> om-bikila): \`node tools/generate-audio-addis.cjs\` (needs \`ADDIS_API_KEY\`). Both tools only make clips that are
> missing or whose words changed, then convert them and run \`node tools/check-audio.cjs\` (writes
> \`assets/audio/manifest.json\`). Human recordings use the same file names (\`node tools/convert-audio.cjs <folder>\`).
> Audio is never required: every clip has the same words on screen (WCAG 1.2.1). Amharic and Oromo text are drafts for
> native-speaker review. Numbers are read on the phone only (never sent to an online voice).

**${count} clips, about ${Math.round(total / 60)} minutes of audio in total.**
` + body;
  fs.writeFileSync(ROOT + 'docs/audio-script.md', md);
  console.log(count, 'clips', Object.keys(LANGS).map(l => l + ' ' + data.rows[l].length).join(', '), total, 'seconds');
})();
