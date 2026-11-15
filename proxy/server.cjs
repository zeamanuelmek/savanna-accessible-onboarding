// Optional reference proxy for Addis AI as a small Node service (docker compose --profile addis up).
// The same code as the Vercel functions (savanna-onboarding/api/_addis.js). nginx sends /api/ here.
// The key comes only from the environment variable ADDIS_API_KEY (for example from the git-ignored .env file).
'use strict';
const http = require('http');
const { handleStt, handleTts } = require('../savanna-onboarding/api/_addis.js');
const PORT = Number(process.env.PROXY_PORT || 8787);
http.createServer((req, res) => {
  const path = (req.url || '').split('?')[0];
  if (path === '/api/stt') return handleStt(req, res);
  if (path === '/api/tts') return handleTts(req, res);
  if (path === '/health') { res.statusCode = 200; return res.end('ok'); }
  res.statusCode = 404; res.end();
}).listen(PORT, () => console.log('[addis-proxy] listening on ' + PORT + (process.env.ADDIS_API_KEY ? ' (key set)' : ' (no key: answers not_configured)')));
