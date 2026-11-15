// Checks the recorded clips against docs/audio-script.md and writes assets/audio/manifest.json, the list the module
// uses to find recordings. Run from savanna-onboarding/ after adding or changing clips:
//
//     node tools/check-audio.cjs
//
// Clips go in assets/audio/am/ (and assets/audio/en/ if English recordings are ever added), named exactly as in the
// script, for example am/signup-name-question.mp3. MP3 is recommended; M4A (AAC) also works.
// Only clips listed in the manifest are played; anything missing is read by the phone's voice or shown as text.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const audioDir = path.join(root, 'assets', 'audio');
const script = fs.readFileSync(path.join(root, 'docs', 'audio-script.md'), 'utf8');
const FORMATS = ['.mp3', '.m4a'];

// expected clips: rows like  | 12 | `am/signup-name-question.mp3` | <span lang="am">…</span> | 6 s | |
const expected = [];
for (const line of script.split(/\r?\n/)) {
  const m = line.match(/^\|\s*(\d+)\s*\|\s*`(am|en|om)\/([a-z0-9-]+)\.mp3`\s*\|\s*(?:<span[^>]*>)?(.*?)(?:<\/span>)?\s*\|/);
  if (m) expected.push({ n: +m[1], lang: m[2], key: m[3], text: m[4] });
}
if (!expected.length) { console.error('No clips found in docs/audio-script.md.'); process.exit(1); }

function kind(file) {
  const b = Buffer.alloc(12), fd = fs.openSync(file, 'r');
  const n = fs.readSync(fd, b, 0, 12, 0); fs.closeSync(fd);
  if (n < 4) return 'empty';
  if (b.slice(0, 3).toString() === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return '.mp3';
  if (b.slice(4, 8).toString() === 'ftyp') return '.m4a';
  if (b.slice(0, 4).toString() === 'RIFF') return '.wav';
  if (b.slice(0, 4).toString() === 'OggS') return '.ogg';
  return 'unknown';
}

const manifest = {}, found = [], problems = [], extra = [], sizes = {};
const langs = fs.existsSync(audioDir) ? fs.readdirSync(audioDir).filter(d => fs.statSync(path.join(audioDir, d)).isDirectory()) : [];
const byName = {};
for (const lang of langs) {
  for (const f of fs.readdirSync(path.join(audioDir, lang))) {
    if (f.startsWith('.') || f.toLowerCase() === 'readme.md') continue;
    const ext = path.extname(f).toLowerCase(), key = path.basename(f, path.extname(f));
    const full = path.join(audioDir, lang, f), size = fs.statSync(full).size;
    const real = size ? kind(full) : 'empty';
    if (!FORMATS.includes(ext)) { problems.push(`${lang}/${f}: format ${ext || '(none)'} is not used. Convert it to MP3.`); continue; }
    if (real === 'empty') { problems.push(`${lang}/${f}: the file is empty.`); continue; }
    if (real !== ext) { problems.push(`${lang}/${f}: the name says ${ext} but the file is ${real === 'unknown' ? 'not a recognised audio format' : real}. Convert it, or rename it to ${real}.`); continue; }
    if (size > 1024 * 1024) problems.push(`${lang}/${f}: ${(size / 1048576).toFixed(1)} MB is large for 3G. Aim for under 300 KB (mono, 64–96 kbps). It is still used.`);
    byName[lang + '/' + key] = f;
    (sizes[lang] = sizes[lang] || {})[f] = size;
  }
}
for (const e of expected) {
  const f = byName[e.lang + '/' + e.key];
  if (f) { (manifest[e.lang] = manifest[e.lang] || {})[e.key] = f; found.push(e); delete byName[e.lang + '/' + e.key]; }
}
// clips that are not in the script are listed but still allowed (for example extra English recordings)
for (const k of Object.keys(byName)) {
  const [lang, key] = k.split('/');
  (manifest[lang] = manifest[lang] || {})[key] = byName[k];
  extra.push(lang + '/' + byName[k]);
}
const missing = expected.filter(e => !found.includes(e));
// file sizes of the listed clips, shown in Settings as "Download Amharic audio for offline use (about X MB)"
let totalBytes = 0;
for (const lang of Object.keys(manifest)) {
  for (const f of Object.values(manifest[lang])) {
    ((manifest.bytes = manifest.bytes || {})[lang] = manifest.bytes[lang] || {})[f] = sizes[lang][f];
    totalBytes += sizes[lang][f];
  }
}

fs.mkdirSync(audioDir, { recursive: true });
fs.writeFileSync(path.join(audioDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(`Audio check: ${found.length} of ${expected.length} clips from docs/audio-script.md found in assets/audio/.`);
if (missing.length) {
  console.log(`\nMissing (${missing.length}) — these are read by the phone's voice, or shown as text:`);
  for (const e of missing) console.log(`  #${String(e.n).padStart(2)}  ${e.lang}/${e.key}.mp3`);
}
if (extra.length) { console.log(`\nNot in the script (used anyway, check the names):`); extra.forEach(x => console.log('  ' + x)); }
if (problems.length) { console.log(`\nProblems (${problems.length}):`); problems.forEach(p => console.log('  ' + p)); }
console.log(`\nWrote assets/audio/manifest.json (${found.length + extra.length} clips, ${(totalBytes / 1048576).toFixed(1)} MB). Commit the clips and the manifest together.`);
process.exitCode = problems.some(p => !p.includes('still used')) ? 1 : 0;
