/* Reference proxy for Addis AI speech (Amharic and Afaan Oromo), for the DEMO HOST only. The module itself never
   needs a server: a host passes the address of a proxy like this one to mount({ speechProxy }).

   Used by the Vercel functions api/stt.js and api/tts.js, and by the optional Node service in docker-compose.yml
   (proxy/server.cjs). Only Addis AI's documented API is used (docs.addisassistant.com, read 15 Nov 2026):
     STT  POST https://api.addisassistant.com/api/v2/stt                multipart: audio + request_data {"language_code"}
          -> { "status": "success", "data": { "transcription": "…", "confidence": 0.98 } }
     TTS  POST https://api.addisassistant.com/api/v1/voice/generations  JSON: text, voice_id, language, output_format,
          client_request_id (REQUIRED for paid generation: without it Addis AI answers 422 CLIENT_REQUEST_ID_REQUIRED,
          found 15 Nov) -> JSON with the MP3 inline in data.audio (a data: URL) and a signed data.audio_url
     Auth header x-api-key. Languages: am and om for both. Voices: am-hamen, om-bikila.

   Our contract with the module (same origin as the page):
     POST /api/stt?lang=am|om   body: the recording (audio/webm, audio/mp4, audio/wav or audio/mpeg), at most 2 MB
                                -> 200 { "text": "…" }
     POST /api/tts              JSON { "text": "…", "lang": "am"|"om" }, text at most 600 characters
                                -> 200 audio/mpeg
     Errors -> { "error": code }: not_configured (503), no_credit (402), busy / rate_limited (429), origin (403),
     too_long / too_large (413), language / bad_request (400), unsupported_type (415), unavailable (502).

   Protecting the balance: recordings are stopped by the module at 30 seconds and refused here above 2 MB; TTS text
   above 600 characters is refused; a simple per-IP rate limit; only our own site's origin; TTS results are cached by
   text + language + voice, so the same words are never paid for twice (here in memory, and in the browser).

   The key is read ONLY from the environment variable ADDIS_API_KEY. It is never logged, never sent to the browser,
   and never part of an error message. */
'use strict';
const crypto = require('crypto');

const API = 'https://api.addisassistant.com';
const VOICES = { am: 'am-hamen', om: 'om-bikila' };
const LIMITS = { ttsChars: 600, sttBytes: 2 * 1024 * 1024, jsonBytes: 16 * 1024, upstreamMs: 25000 };
const STT_TYPES = { 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3' };
const RATE = { windowMs: 10 * 60 * 1000, stt: 20, tts: 120 }; // per IP, per 10 minutes
const DEFAULT_ORIGINS = ['https://savanna-accessible-onboarding.vercel.app', 'http://localhost:8080'];

/* ---- small helpers ---- */
function send(res, status, body, headers) {
  const isBuf = Buffer.isBuffer(body);
  res.statusCode = status;
  res.setHeader('Content-Type', isBuf ? 'audio/mpeg' : 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  Object.keys(headers || {}).forEach(k => res.setHeader(k, headers[k]));
  res.end(isBuf ? body : JSON.stringify(body));
}
const fail = (res, status, code) => send(res, status, { error: code });

function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || String(req.headers['x-real-ip'] || '') || (req.socket && req.socket.remoteAddress) || 'unknown';
}

/** Only our own site may use the proxy: the page's Origin must be listed (ALLOWED_ORIGINS, comma-separated) or be the
 *  same host the request came to (this covers preview deployments and docker compose on another port). */
function originAllowed(req) {
  // Browsers mark a request from the same site; with a strict referrer policy the Origin can be "null"
  if (String(req.headers['sec-fetch-site'] || '') === 'same-origin') return true;
  const origin = req.headers.origin;
  if (!origin || origin === 'null') return false;
  const list = (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : DEFAULT_ORIGINS).map(s => s.trim()).filter(Boolean);
  if (list.includes(origin)) return true;
  // The same host and scheme the proxy itself is served on: every Vercel preview deployment and branch alias of this
  // project (the page and the proxy share the address), and docker compose. Look-alike names on vercel.app are other
  // hosts, so they are refused; no wildcard is needed.
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  const proto = String(req.headers['x-forwarded-proto'] || (req.socket && req.socket.encrypted ? 'https' : 'http')).split(',')[0].trim();
  try { const o = new URL(origin); return !!host && o.host === host && o.protocol === proto + ':'; } catch (e) { return false; }
}

const hits = new Map();
function rateLimited(ip, kind) {
  const now = Date.now(), key = kind + ':' + ip;
  const list = (hits.get(key) || []).filter(t => now - t < RATE.windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear(); // memory guard
  return list.length > RATE[kind];
}

/** Reads the request body up to `limit` bytes (works on plain Node and on Vercel's Node runtime). */
function readBody(req, limit) {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body.length > limit ? null : req.body);
  if (req.body && typeof req.body === 'object') { const b = Buffer.from(JSON.stringify(req.body)); return Promise.resolve(b.length > limit ? null : b); }
  if (typeof req.body === 'string') { const b = Buffer.from(req.body); return Promise.resolve(b.length > limit ? null : b); }
  return new Promise((resolve, reject) => {
    const parts = []; let size = 0, over = false;
    req.on('data', c => { size += c.length; if (size > limit) over = true; else parts.push(c); });
    req.on('end', () => resolve(over ? null : Buffer.concat(parts)));
    req.on('error', reject);
  });
}

/** Logs Addis AI's own error message (to see the reason next time), cut to 300 characters, without the key and
 *  without the learner's text. Never sent to the browser. */
async function logUpstream(kind, r, text) {
  let msg = '';
  try { msg = await r.text(); } catch (e) {}
  const key = process.env.ADDIS_API_KEY || '';
  if (key) msg = msg.split(key).join('[key]');
  if (text) msg = msg.split(text).join('[text]');
  console.warn('[addis-proxy] ' + kind + ' upstream ' + r.status + ': ' + msg.replace(/\s+/g, ' ').slice(0, 300));
}

/** Addis AI's HTTP status -> our short code (the key and the upstream message are never passed on). */
function upstreamCode(status) {
  if (status === 401 || status === 403) return { status: 503, code: 'not_configured' }; // missing or invalid key
  if (status === 402) return { status: 402, code: 'no_credit' };
  if (status === 429) return { status: 429, code: 'busy' };
  if (status === 413) return { status: 413, code: 'too_large' };
  return { status: 502, code: 'unavailable' };
}

function guard(req, res, kind) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); fail(res, 405, 'bad_request'); return null; }
  if (!originAllowed(req)) { fail(res, 403, 'origin'); return null; }
  const key = process.env.ADDIS_API_KEY;
  if (!key) { fail(res, 503, 'not_configured'); return null; }
  if (rateLimited(clientIp(req), kind)) { fail(res, 429, 'rate_limited'); return null; }
  return key;
}

/* ---- TTS cache: text + language + voice -> MP3 (in memory, oldest out first) ---- */
const ttsCache = new Map(); let ttsBytes = 0;
const TTS_CACHE_MAX = 40 * 1024 * 1024;
function cacheKey(text, lang, voice) { return crypto.createHash('sha256').update(lang + '\n' + voice + '\n' + text).digest('hex'); }
function cachePut(k, buf) {
  if (buf.length > TTS_CACHE_MAX / 4) return;
  ttsCache.set(k, buf); ttsBytes += buf.length;
  for (const [old, b] of ttsCache) { if (ttsBytes <= TTS_CACHE_MAX) break; ttsCache.delete(old); ttsBytes -= b.length; }
}

async function handleTts(req, res) {
  const key = guard(req, res, 'tts');
  if (!key) return;
  let input;
  try { const raw = await readBody(req, LIMITS.jsonBytes); if (!raw) return fail(res, 413, 'too_large'); input = JSON.parse(raw.toString('utf8')); }
  catch (e) { return fail(res, 400, 'bad_request'); }
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  const lang = input.lang;
  if (!VOICES[lang]) return fail(res, 400, 'language');
  if (!text) return fail(res, 400, 'bad_request');
  if (text.length > LIMITS.ttsChars) return fail(res, 413, 'too_long');
  const voice = VOICES[lang], k = cacheKey(text, lang, voice);
  const hit = ttsCache.get(k);
  if (hit) return send(res, 200, hit, { 'X-Cache': 'hit' });
  try {
    const r = await fetch(API + '/api/v1/voice/generations', {
      method: 'POST',
      headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
      // the same words always get the same request id (a hash), so a repeat is an idempotent replay, not a new charge
      body: JSON.stringify({ text, voice_id: voice, language: lang, output_format: 'mp3_44100', client_request_id: 'savanna-' + k.slice(0, 40) }),
      signal: AbortSignal.timeout(LIMITS.upstreamMs)
    });
    if (!r.ok) { const u = upstreamCode(r.status); await logUpstream('tts', r, text); return fail(res, u.status, u.code); }
    const json = await r.json();
    const d = (json && json.data) || {};
    let buf = null;
    if (typeof d.audio === 'string' && /^data:audio\/[a-z0-9.+-]+;base64,/i.test(d.audio)) buf = Buffer.from(d.audio.slice(d.audio.indexOf(',') + 1), 'base64');
    else if (d.audio_url) {
      const a = await fetch(d.audio_url, { headers: { 'x-api-key': key }, signal: AbortSignal.timeout(LIMITS.upstreamMs) });
      if (a.ok) buf = Buffer.from(await a.arrayBuffer());
    }
    if (!buf || !buf.length) { console.warn('[addis-proxy] tts: no audio in the response'); return fail(res, 502, 'unavailable'); }
    cachePut(k, buf);
    return send(res, 200, buf, { 'X-Cache': 'miss' });
  } catch (e) {
    console.warn('[addis-proxy] tts failed:', e && e.name); // never the key, never the text
    return fail(res, 502, 'unavailable');
  }
}

async function handleStt(req, res) {
  const key = guard(req, res, 'stt');
  if (!key) return;
  const url = new URL(req.url || '/', 'http://local');
  const lang = url.searchParams.get('lang');
  if (!VOICES[lang]) return fail(res, 400, 'language');
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const ext = STT_TYPES[type];
  if (!ext) return fail(res, 415, 'unsupported_type');
  let audio;
  try { audio = await readBody(req, LIMITS.sttBytes); } catch (e) { return fail(res, 400, 'bad_request'); }
  if (!audio) return fail(res, 413, 'too_large');
  if (!audio.length) return fail(res, 400, 'bad_request');
  try {
    const form = new FormData();
    form.append('audio', new Blob([audio], { type }), 'answer.' + ext);
    form.append('request_data', JSON.stringify({ language_code: lang }));
    const r = await fetch(API + '/api/v2/stt', { method: 'POST', headers: { 'x-api-key': key }, body: form, signal: AbortSignal.timeout(LIMITS.upstreamMs) });
    if (!r.ok) { const u = upstreamCode(r.status); await logUpstream('stt', r, ''); return fail(res, u.status, u.code); }
    const json = await r.json();
    const text = json && json.data && typeof json.data.transcription === 'string' ? json.data.transcription.trim() : '';
    return send(res, 200, { text });
  } catch (e) {
    console.warn('[addis-proxy] stt failed:', e && e.name);
    return fail(res, 502, 'unavailable');
  }
}

module.exports = { handleTts, handleStt, VOICES, LIMITS, _test: { originAllowed, upstreamCode, cacheKey } };
