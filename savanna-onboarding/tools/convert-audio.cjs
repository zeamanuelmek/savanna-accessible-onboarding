// Converts a folder of recordings (WAV, M4A, MP3, AAC, OGG, OPUS, FLAC, WEBM, 3GP, AMR) into the format the module
// needs — mono MP3, 44.1 kHz, 64–96 kbps (default 80), even loudness — keeping each file's name, and puts them in
// assets/audio/am/. Then it runs the audio check (tools/check-audio.cjs), which also writes assets/audio/manifest.json.
//
// Needs ffmpeg (free). On Windows:   winget install Gyan.FFmpeg      (once; then open a new terminal)
// Run from savanna-onboarding/:     node tools/convert-audio.cjs "C:\Users\me\Recordings"
//
// Options: --kbps 64..96 (default 80) · --out <folder> (default assets/audio/am) · --no-check · --no-loudnorm
// The original recordings are never changed. Set FFMPEG=<path to ffmpeg.exe> if ffmpeg is not on the PATH.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i === -1 ? dflt : args[i + 1]; };
const flag = name => args.includes(name);
const input = args.find((a, i) => !a.startsWith('--') && !['--kbps', '--out'].includes(args[i - 1]));
const root = path.join(__dirname, '..');
const out = path.resolve(opt('--out', path.join(root, 'assets', 'audio', 'am')));
const kbps = parseInt(opt('--kbps', '80'), 10);
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const shell = process.platform === 'win32' && /\.(cmd|bat)$/i.test(ffmpeg);
const INPUTS = ['.wav', '.m4a', '.mp3', '.aac', '.ogg', '.opus', '.flac', '.webm', '.3gp', '.amr', '.mp4'];

if (!input) {
  console.log('Usage: node tools/convert-audio.cjs <folder with recordings> [--kbps 80] [--out folder] [--no-check]');
  process.exit(1);
}
if (!fs.existsSync(input) || !fs.statSync(input).isDirectory()) { console.error(`Not a folder: ${input}`); process.exit(1); }
if (!(kbps >= 64 && kbps <= 96)) { console.error('--kbps must be between 64 and 96.'); process.exit(1); }
const probe = spawnSync(ffmpeg, ['-version'], { encoding: 'utf8', shell });
if (probe.error || probe.status !== 0) {
  console.error('ffmpeg was not found. It is free. On Windows run:  winget install Gyan.FFmpeg  then open a new terminal.');
  console.error('On macOS: brew install ffmpeg. On Ubuntu: sudo apt install ffmpeg. Or set FFMPEG to the full path of ffmpeg.');
  process.exit(1);
}

fs.mkdirSync(out, { recursive: true });
const files = fs.readdirSync(input).filter(f => INPUTS.includes(path.extname(f).toLowerCase())).sort();
if (!files.length) { console.error(`No recordings found in ${input} (${INPUTS.join(' ')}).`); process.exit(1); }

let ok = 0; const failed = [];
for (const f of files) {
  const name = path.basename(f, path.extname(f)).trim();
  const src = path.join(input, f), dest = path.join(out, name + '.mp3'), tmp = dest + '.tmp.mp3';
  const a = ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '44100'];
  if (!flag('--no-loudnorm')) a.push('-af', 'loudnorm=I=-16:TP=-1.5:LRA=11');
  a.push('-codec:a', 'libmp3lame', '-b:a', kbps + 'k', '-map_metadata', '-1', tmp);
  const r = spawnSync(ffmpeg, a, { encoding: 'utf8', shell });
  if (r.status === 0 && fs.existsSync(tmp)) {
    fs.renameSync(tmp, dest); // written to a temporary file first, so a recording is never overwritten half-way
    const other = path.join(out, name + '.m4a'); if (fs.existsSync(other)) fs.rmSync(other); // one format per clip
    ok++;
    console.log(`  ok   ${f} -> ${path.relative(root, dest)} (${Math.round(fs.statSync(dest).size / 1024)} KB)`);
  } else {
    if (fs.existsSync(tmp)) fs.rmSync(tmp);
    failed.push(f);
    console.log(`  FAIL ${f}: ${(r.stderr || r.error || '').toString().trim().split('\n').pop()}`);
  }
}
console.log(`\nConverted ${ok} of ${files.length} recordings to mono MP3 at ${kbps} kbps in ${path.relative(root, out) || out}.`);
if (failed.length) console.log(`Not converted: ${failed.join(', ')}`);
if (!flag('--no-check')) {
  console.log('\nRunning the audio check…\n');
  const c = spawnSync(process.execPath, [path.join(__dirname, 'check-audio.cjs')], { stdio: 'inherit', cwd: root });
  process.exitCode = c.status || (failed.length ? 1 : 0);
} else process.exitCode = failed.length ? 1 : 0;
