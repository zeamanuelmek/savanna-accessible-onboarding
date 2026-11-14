// Copies the files our Savanna journey pages need from the official starter (alx-africa/Savanna-static-pages),
// UNCHANGED, into vendor/savanna-static-pages/. ALX's own repository is only read, never written.
//
// Run from savanna-onboarding/:   node tools/vendor-savanna.cjs [path-to-starter]   (default ../../Savanna-static-pages)
// Re-run after pulling the starter if ALX updates it.
//
// What is copied: assets/css/application_alx.css and app.css (Savanna's own stylesheets), every font and image those two
// stylesheets reference, and the ALX logo used in the header. What is NOT copied: the Adobe Typekit fonts and their
// stylesheet (licensed to ALX's domains), the frozen pages themselves, and Bootstrap's JavaScript (not needed).
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const src = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', '..', 'Savanna-static-pages'));
const out = path.join(__dirname, '..', 'vendor', 'savanna-static-pages');
const CSS = ['application_alx.css', 'app.css'];
const EXTRA = ['assets/img/holberton-logo-full-alx.png'];

if (!fs.existsSync(path.join(src, 'assets', 'css', 'application_alx.css'))) {
  console.error('Starter not found at ' + src); process.exit(1);
}
let commit = 'unknown';
try { commit = execSync('git -C "' + src + '" log -1 --format="%H %ad" --date=short').toString().trim(); } catch (e) {}

fs.rmSync(out, { recursive: true, force: true });
const files = new Set(EXTRA);
// Follow url() references, including stylesheets imported by other stylesheets (Savanna's app.css imports Google Fonts CSS).
const queue = CSS.map(css => 'assets/css/' + css);
while (queue.length) {
  const rel = queue.shift();
  files.add(rel);
  if (!fs.existsSync(path.join(src, rel))) continue;
  const text = fs.readFileSync(path.join(src, rel), 'utf8');
  for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    const u = m[1];
    if (/^(data:|https?:|#)/.test(u)) continue;
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(rel), u.split(/[?#]/)[0]));
    if (/typekit/i.test(target) || files.has(target) || queue.includes(target)) continue;
    if (target.endsWith('.css')) queue.push(target); else files.add(target);
  }
}
let copied = 0, missing = [];
for (const rel of [...files].sort()) {
  const from = path.join(src, rel);
  if (!fs.existsSync(from)) { missing.push(rel); continue; }
  const to = path.join(out, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  copied++;
}
const note = `# Savanna starter files (vendored, unchanged)

Copied by \`tools/vendor-savanna.cjs\` from the official hackathon starter
https://github.com/alx-africa/Savanna-static-pages, commit \`${commit}\`.

- **These files belong to ALX** and are **not** covered by this project's licence. They are included only so the demo
  can show the module inside real Savanna pages. They are byte-for-byte copies: nothing here is edited.
- Copied: \`assets/css/application_alx.css\`, \`assets/css/app.css\`, the fonts and images those two stylesheets
  reference, and the ALX logo. ${copied} files.
- **Not copied:** the Adobe Typekit fonts and their stylesheet (licensed to ALX's own domains), the frozen pages,
  Bootstrap's JavaScript.${missing.length ? '\n- Referenced by the CSS but missing from the starter (so the browser shows nothing for them): ' + missing.length + ' files.' : ''}

To update: pull the starter, then run \`node tools/vendor-savanna.cjs\` from \`savanna-onboarding/\`.
`;
fs.writeFileSync(path.join(out, 'VENDOR.md'), note);
console.log('copied', copied, 'files from', commit, missing.length ? '(missing: ' + missing.length + ')' : '');
