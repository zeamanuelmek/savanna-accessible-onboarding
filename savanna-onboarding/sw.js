/* Savanna Accessible Onboarding Module: minimum offline mode (Phase 6). See docs/offline-plan.md.
   A service worker for the demo pages. It keeps on the device:
   - at install: the module, the form recipes, the demo pages and scripts, our fonts, Savanna's two stylesheets and the
     audio manifest, so the pages open again with no connection;
   - as they are used: every other same-site file (Savanna's fonts and images, and each recorded clip the first time it
     is played). Clips are NOT all downloaded up front: roughly 5-7 MB over 3G would cost learners money.
   Pages: network first (always fresh when online), the saved copy when offline. Other files: the saved copy at once,
   refreshed in the background. Nothing is sent anywhere; only this site's own files are handled.
   A host such as Savanna can register this file, or copy the CORE list into its own service worker. */
var CACHE = 'savanna-onboarding-v13';
var CORE = [
  './', 'index.html', 'signup.html', 'login.html', 'dashboard.html', 'profile.html', 'passport.html', 'takeover.html',
  'jobs.html', 'apply.html', 'employer.html', 'settings.html', 'showroom.html', 'test-host/',
  'savanna-onboarding.js', 'forms.js', 'app.js', 'app.css', 'journey/journey.js', 'journey/journey.css', 'journey/early.js', 'journey/dashboard.js',
  'vendor/savanna-static-pages/assets/js/popper.js', 'vendor/savanna-static-pages/assets/js/bootstrap.bundle.js', 'vendor/savanna-static-pages/assets/img/graduation-badge-alx.svg',
  'assets/audio/manifest.json',
  'assets/fonts/noto-sans-ethiopic-ethiopic.woff2',
  'assets/fonts/poppins-400-latin.woff2', 'assets/fonts/poppins-400-latin-ext.woff2',
  'assets/fonts/poppins-500-latin.woff2', 'assets/fonts/poppins-500-latin-ext.woff2',
  'assets/fonts/poppins-600-latin.woff2', 'assets/fonts/poppins-600-latin-ext.woff2',
  'assets/fonts/poppins-700-latin.woff2', 'assets/fonts/poppins-700-latin-ext.woff2',
  'vendor/savanna-static-pages/assets/css/application_alx.css', 'vendor/savanna-static-pages/assets/css/app.css'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (cache) {
    // one by one, so a single missing file never stops the rest from being saved
    return Promise.all(CORE.map(function (u) { return cache.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    // old versions are removed; the learner's own audio download ('savanna-onboarding-audio') stays
    return Promise.all(keys.filter(function (k) { return k.indexOf('savanna-onboarding-') === 0 && k !== CACHE && k !== 'savanna-onboarding-audio'; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function isAudio(url) { return /\/assets\/audio\/[a-z]{2}\/[^/]+\.(mp3|m4a)$/.test(url.pathname); }

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (/\/(tests|tools|node_modules|api)\//.test(url.pathname)) return; // api: the speech proxy's live answers, never cached

  // Recorded clips: the saved copy, or download the whole file once and keep it (media players ask for byte ranges).
  if (isAudio(url)) {
    if (req.headers.get('X-Savanna-Download')) return; // Settings download: straight to the network, stored by the page
    e.respondWith(caches.open(CACHE).then(function (cache) {
      return caches.match(url.pathname).then(function (hit) { // any store, including the learner's download
        if (hit) return hit;
        return fetch(url.pathname).then(function (res) { if (res.ok) cache.put(url.pathname, res.clone()); return res; });
      });
    }));
    return;
  }

  // Pages: fresh from the network when possible, the saved copy when offline (any ?query, e.g. apply.html?job=s1).
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(url.pathname, copy); }); }
      return res;
    }).catch(function () {
      return caches.open(CACHE).then(function (c) {
        return c.match(url.pathname, { ignoreSearch: true }).then(function (hit) { return hit || c.match('index.html'); });
      });
    }));
    return;
  }

  // Everything else: the saved copy at once, refreshed in the background; saved on first use.
  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      var fresh = fetch(req).then(function (res) { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(function () { return hit || Response.error(); });
      return hit || fresh;
    });
  }));
});
