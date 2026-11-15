// Generates the Afaan Oromo clips in docs/audio-script.md ONCE with Addis AI (voice om-bikila), so fixed text is read
// from files and never depends on a live service. Only clips that are missing, or whose words changed since they were
// made, are generated (the words used are kept in assets/audio/om/.texts.json). Then the clips are converted
// (tools/convert-audio.cjs: mono MP3, even loudness) and checked (tools/check-audio.cjs writes the manifest).
//
//   node tools/generate-audio-addis.cjs            (from savanna-onboarding/; the key is read from ../.env or the
//                                                    environment variable ADDIS_API_KEY, and is never printed)
//   options: --only key1,key2   --dry (list what would be made, with an estimate)   --lang om
//
// Uses only Addis AI's documented TTS: POST /api/v1/voice/generations with text, voice_id, language, output_format and
// client_request_id (required for paid generation; here a hash of the words, so a re-run is an idempotent replay).
// Only fixed interface text is sent: never a learner's answer, name or number.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
const LANG = opt('--lang', 'om');
const VOICE = { om: 'om-bikila', am: 'am-hamen' }[LANG];
const only = (opt('--only', '') || '').split(',').filter(Boolean);
const dry = args.includes('--dry');

function readKey() {
  if (process.env.ADDIS_API_KEY) return process.env.ADDIS_API_KEY.trim();
  try { const m = fs.readFileSync(path.join(ROOT, '..', '.env'), 'utf8').match(/^ADDIS_API_KEY=(.*)$/m); return m ? m[1].trim() : ''; } catch (e) { return ''; }
}
const unescape = t => t.replace(/\\\|/g, '|');
const rows = [];
for (const line of fs.readFileSync(path.join(ROOT, 'docs', 'audio-script.md'), 'utf8').split(/\r?\n/)) {
  const m = line.match(new RegExp('^\\|\\s*\\d+\\s*\\|\\s*`' + LANG + '/([a-z0-9-]+)\\.mp3`\\s*\\|\\s*<span[^>]*>(.*)</span>\\s*\\|'));
  if (m) rows.push({ key: m[1], text: unescape(m[2]).trim() });
}
const outDir = path.join(ROOT, 'assets', 'audio', LANG);
fs.mkdirSync(outDir, { recursive: true });
const textsFile = path.join(outDir, '.texts.json');
const made = fs.existsSync(textsFile) ? JSON.parse(fs.readFileSync(textsFile, 'utf8')) : {};
const todo = rows.filter(r => (only.length ? only.includes(r.key) : true) && (only.length || !fs.existsSync(path.join(outDir, r.key + '.mp3')) || made[r.key] !== r.text));
const estSeconds = todo.reduce((a, r) => a + Math.max(1, r.text.length / 14), 0);
console.log(`${rows.length} ${LANG} clips in the script; ${todo.length} to make (about ${Math.round(estSeconds / 60)} min of audio, roughly ${Math.round(estSeconds / 60 * 5)} ETB).`);
if (dry || !todo.length) { if (!todo.length) runCheck(); process.exit(0); }
const key = readKey();
if (!key) { console.error('No ADDIS_API_KEY (environment or ../.env).'); process.exit(1); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'savanna-addis-'));
let done = 0, failed = [], stop = false;
async function one(r) {
  for (let attempt = 1; attempt <= 4 && !stop; attempt++) {
    try {
      const res = await fetch('https://api.addisassistant.com/api/v1/voice/generations', {
        method: 'POST', headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: r.text, voice_id: VOICE, language: LANG, output_format: 'mp3_44100',
          client_request_id: 'savanna-clip-' + crypto.createHash('sha256').update(LANG + '\n' + VOICE + '\n' + r.text).digest('hex').slice(0, 40) })
      });
      if (res.status === 402) { stop = true; console.error('No credit left (402): stopped. Top up and run again; finished clips are kept.'); return; }
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).split(key).join('[key]').slice(0, 200));
      const d = (await res.json()).data || {};
      let buf = null;
      if (typeof d.audio === 'string' && d.audio.includes('base64,')) buf = Buffer.from(d.audio.slice(d.audio.indexOf(',') + 1), 'base64');
      else if (d.audio_url) buf = Buffer.from(await (await fetch(d.audio_url)).arrayBuffer());
      if (!buf || buf.length < 500) throw new Error('no audio');
      fs.writeFileSync(path.join(tmp, r.key + '.mp3'), buf);
      made[r.key] = r.text; done++;
      if (done % 20 === 0) console.log(`  ${done}/${todo.length}`);
      return;
    } catch (e) {
      if (attempt === 4) { failed.push(r.key); console.log(`  FAIL ${r.key}: ${e.message}`); }
      else await new Promise(res => setTimeout(res, 1500 * attempt));
    }
  }
}
function runCheck() { spawnSync(process.execPath, [path.join(__dirname, 'check-audio.cjs')], { stdio: 'inherit', cwd: ROOT }); }

(async () => {
  const queue = todo.slice();
  await Promise.all([1, 2, 3, 4].map(async () => { while (queue.length && !stop) await one(queue.shift()); }));
  console.log(`\nMade ${done} of ${todo.length} ${LANG} clips${failed.length ? '; failed: ' + failed.join(', ') : ''}. Converting…`);
  if (done) {
    const c = spawnSync(process.execPath, [path.join(__dirname, 'convert-audio.cjs'), tmp, '--out', outDir, '--no-check'], { stdio: 'inherit', cwd: ROOT, env: process.env });
    if (c.status !== 0) console.log('Conversion failed (is ffmpeg installed? set FFMPEG). The raw clips are in ' + tmp);
    fs.writeFileSync(textsFile, JSON.stringify(made, null, 1) + '\n');
  }
  runCheck();
})();
