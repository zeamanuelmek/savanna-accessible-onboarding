// Generates the Afaan Oromo number clips num-0 … num-99 ONCE with Addis AI (voice om-bikila), so phone numbers and
// ID numbers are read on the phone and never sent to an online voice when learners use the site.
//
//   ADDIS_API_KEY=sk_… node tools/generate-oromo-numbers.cjs        (from savanna-onboarding/; PowerShell:
//   $env:ADDIS_API_KEY="sk_…"; node tools/generate-oromo-numbers.cjs)
//
// Only the numbers' words are sent (never a learner's number). Uses only Addis AI's documented TTS endpoint
// (docs.addisassistant.com): POST /api/v1/voice/generations, then downloads data.audio_url. Then runs the audio check,
// which adds the clips to assets/audio/manifest.json. The words are the same as numberWords() in savanna-onboarding.js
// (a draft for native-speaker review). Cost: 100 short clips, a few seconds of audio each.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const key = process.env.ADDIS_API_KEY;
if (!key) { console.error('Set ADDIS_API_KEY first (it is never stored or printed).'); process.exit(1); }
const ONES = ['zeeroo', 'tokko', 'lama', 'sadii', 'afur', 'shan', 'jaha', 'torba', 'saddeet', 'sagal'];
const TENS = ['', 'kudhan', 'digdama', 'soddoma', 'afurtama', 'shantama', 'jaatama', 'torbaatama', 'saddeettama', 'sagaltama'];
const words = n => n < 10 ? ONES[n] : n < 20 ? (n === 10 ? TENS[1] : 'kudha ' + ONES[n - 10]) : (n % 10 ? TENS[Math.floor(n / 10)].replace(/a$/, 'ii') + ' ' + ONES[n % 10] : TENS[n / 10]);
const out = path.join(__dirname, '..', 'assets', 'audio', 'om');
fs.mkdirSync(out, { recursive: true });

(async () => {
  let ok = 0;
  for (let n = 0; n < 100; n++) {
    const dest = path.join(out, 'num-' + n + '.mp3');
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) { ok++; continue; } // generated once: kept
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const r = await fetch('https://api.addisassistant.com/api/v1/voice/generations', {
          method: 'POST', headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: words(n), voice_id: 'om-bikila', language: 'om', output_format: 'mp3_44100' })
        });
        if (r.status === 402) { console.error('No credit left (402). Stopped; run again after topping up.'); process.exit(1); }
        if (!r.ok) throw new Error('status ' + r.status);
        const url = (await r.json()).data.audio_url;
        const a = await fetch(url);
        if (!a.ok) throw new Error('download ' + a.status);
        fs.writeFileSync(dest, Buffer.from(await a.arrayBuffer()));
        ok++; console.log('  ok  om/num-' + n + '.mp3  (' + words(n) + ')');
        break;
      } catch (e) {
        if (attempt === 4) console.log('  FAIL om/num-' + n + ': ' + e.message);
        else await new Promise(res => setTimeout(res, 2000 * attempt));
      }
    }
  }
  console.log(`\n${ok} of 100 Oromo number clips in assets/audio/om/. Running the audio check…\n`);
  spawnSync(process.execPath, [path.join(__dirname, 'check-audio.cjs')], { stdio: 'inherit', cwd: path.join(__dirname, '..') });
})();
