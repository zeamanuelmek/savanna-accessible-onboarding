// Tiny static file server for tests (no dependencies).
//   /             -> this module folder (Savanna journey: /index.html; showroom: /showroom.html; test host: /test-host/)
//   /reference/   -> the frozen Savanna reference clone, served read only.
//                    Default location: next to this repository (../Savanna-static-pages).
//                    Override with REFERENCE_DIR=/path/to/Savanna-static-pages.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REFERENCE_ROOT = resolve(process.env.REFERENCE_DIR || join(MODULE_ROOT, '..', '..', 'Savanna-static-pages'));
const PORT = Number(process.env.PORT || 4173);
// The same security headers as the live site (vercel.json), so every test runs under the real Content Security Policy.
// Not applied to /reference/: those are ALX's frozen pages, audited as they are.
const VERCEL = JSON.parse(await readFile(join(MODULE_ROOT, 'vercel.json'), 'utf8'));
function securityHeaders(path) {
  const out = {};
  // Vercel's "(.*)" pattern; a later matching rule replaces the same header (for example the host demo's own CSP)
  for (const rule of VERCEL.headers) {
    const re = new RegExp('^' + rule.source.split('(.*)').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
    if (re.test(path)) for (const h of rule.headers) out[h.key.toLowerCase()] = h.value;
  }
  return out;
}
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.riv': 'application/octet-stream', '.mp3': 'audio/mpeg'
};

function resolvePath(urlPath) {
  const [root, rest] = urlPath.startsWith('/reference/')
    ? [REFERENCE_ROOT, urlPath.slice('/reference'.length)]
    : [MODULE_ROOT, urlPath];
  const file = normalize(join(root, rest));
  return file === root || file.startsWith(root + sep) ? file : null; // never serve outside the two roots
}

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = resolvePath(path);
    if (!file) { res.writeHead(403); return res.end(); }
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    const extra = path.startsWith('/reference/') ? {} : securityHeaders(path);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store', ...extra });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(PORT, () => console.log(`Module: ${MODULE_ROOT}\nReference: ${REFERENCE_ROOT}\nhttp://localhost:${PORT}/`));
