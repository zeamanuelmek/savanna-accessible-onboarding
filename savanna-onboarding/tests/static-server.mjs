// Tiny static file server for tests (no dependencies).
//   /             -> this module folder (the demo is /index.html)
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
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.riv': 'application/octet-stream', '.mp3': 'audio/mpeg'
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
    let file = resolvePath(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file) { res.writeHead(403); return res.end(); }
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(PORT, () => console.log(`Module: ${MODULE_ROOT}\nReference: ${REFERENCE_ROOT}\nhttp://localhost:${PORT}/`));
