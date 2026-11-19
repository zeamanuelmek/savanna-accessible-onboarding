/* Host demo (the full loop). Loaded BEFORE the module, so the listeners are in place for savanna-onboarding:ready.
   Uses only the public API: SavannaOnboarding.mount() / unmount() and the documented events. In a file, not inline,
   so the page works under the site's strict Content Security Policy. */
(function () {
  'use strict';
  var EVENTS = ['ready', 'prefs', 'step', 'complete', 'audioblocked'].map(function (n) { return 'savanna-onboarding:' + n; });
  var records = [];          // newest last, in memory; mirrored to IndexedDB
  var schemas = null;        // read from docs/api-schema.md
  var openId = null;         // the record shown in the detail panel
  var dbReady = openDb();
  var schemasReady = loadSchemas();

  /* ---------- storage: IndexedDB (one object store, "records"); in memory only if the browser refuses ---------- */
  function openDb() {
    return new Promise(function (resolve) {
      try {
        var rq = indexedDB.open('savanna-host-demo', 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore('records', { keyPath: 'id' }); };
        rq.onsuccess = function () { resolve(rq.result); };
        rq.onerror = rq.onblocked = function () { resolve(null); };
      } catch (e) { resolve(null); }
    });
  }
  function tx(mode, fn) {
    return dbReady.then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        var t = db.transaction('records', mode), st = t.objectStore('records'), out = fn(st);
        t.oncomplete = function () { resolve(out && 'result' in out ? out.result : null); };
        t.onerror = t.onabort = function () { resolve(null); };
      });
    });
  }
  // Records saved earlier come first; events that arrive meanwhile wait for this (see receive)
  var loaded = tx('readonly', function (st) { return st.getAll(); }).then(function (saved) {
    records = (saved || []).sort(function (a, b) { return a.id - b.id; });
  });
  function put(r) { return tx('readwrite', function (st) { return st.put(r); }); }

  function loadSchemas() {
    return fetch('../docs/api-schema.md', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (md) { schemas = SchemaCheck.parseSchemas(md); })
      .catch(function (e) { schemas = { byId: {}, defs: {}, problems: ['Could not load docs/api-schema.md (' + e.message + ')'] }; });
  }
  function check(r) {
    if (!schemas) return null;
    if (schemas.problems.length && !Object.keys(schemas.byId).length) return { ok: false, checked: [], errors: schemas.problems };
    return SchemaCheck.checkEvent(r.event, r.detail, schemas);
  }

  /* ---------- receiving events ---------- */
  function receive(name, detail) {
    var r = { id: 0, event: name, at: new Date().toISOString(), detail: detail === undefined ? null : JSON.parse(JSON.stringify(detail)), endpoint: null };
    loaded.then(function () {
      r.id = records.length ? records[records.length - 1].id + 1 : 1;
      records.push(r); put(r);
      send(r);
      render();
      if (name === 'savanna-onboarding:step' && window.SavannaOnboarding) voiceLine();
      if (name === 'savanna-onboarding:complete') announce('Record ' + r.id + ' received: the ' + (detail && detail.form) + ' answers. ' + countText());
      else setCount();
    });
  }
  EVENTS.forEach(function (name) { document.addEventListener(name, function (e) { receive(name, e.detail); }); });

  /* ---------- optional: send each new record to the host's endpoint ---------- */
  function endpoint() {
    var on = byId('send-on'), url = byId('send-url');
    if (!on || !on.checked) return null;
    var v = url.value.trim();
    return /^https?:\/\/\S+$/i.test(v) ? v : null;
  }
  function send(r) {
    var url = endpoint();
    if (!url) return;
    r.endpoint = 'sending';
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: r.event, receivedAt: r.at, recordId: r.id, detail: r.detail }), mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' })
      .then(function (res) { r.endpoint = res.ok ? 'sent (' + res.status + ')' : 'failed (' + res.status + ')'; },
            function () { r.endpoint = 'failed (network, CORS or blocked)'; })
      .then(function () { put(r); render(); });
  }

  /* ---------- the table ---------- */
  function byId(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function time(iso) { return iso.slice(11, 19); }
  function fields(r) {
    var d = r.detail;
    if (d == null) return '(no data)';
    if (r.event === 'savanna-onboarding:complete') return 'form: ' + d.form + ', lang: ' + d.lang + '; answers: ' + Object.keys(d.answers || {}).join(', ');
    if (r.event === 'savanna-onboarding:step') return 'form: ' + d.form + ', mode: ' + d.mode + ', step: ' + d.step;
    return Object.keys(d).map(function (k) { return k + ': ' + JSON.stringify(d[k]); }).join(', ');
  }
  function verdict(r) { var c = check(r); return c == null ? 'checking…' : c.ok ? 'Pass' : 'Fail'; }
  function countText() { return records.length === 1 ? '1 record saved in this browser.' : records.length + ' records saved in this browser.'; }
  function setCount() { var c = byId('count'); if (c) c.textContent = records.length ? countText() : 'No records yet.'; }
  function announce(msg) { var c = byId('count'); if (!c) return; c.textContent = ''; setTimeout(function () { c.textContent = msg; }, 50); }
  function render() {
    var body = byId('rows');
    if (!body) return;
    if (!records.length) { body.innerHTML = '<tr><td colspan="6">No records yet. Mount a journey above and answer a question.</td></tr>'; setCount(); return; }
    body.innerHTML = records.slice().reverse().map(function (r) {
      var v = verdict(r);
      return '<tr' + (r.id === openId ? ' class="open"' : '') + '><td>' + r.id + '</td>' +
        '<td><button type="button" class="link" data-id="' + r.id + '" aria-expanded="' + (r.id === openId) + '" aria-controls="detail">' + esc(r.event) + '</button></td>' +
        '<td><time datetime="' + esc(r.at) + '">' + time(r.at) + '</time></td>' +
        '<td class="fields">' + esc(fields(r)) + '</td>' +
        '<td><span class="badge ' + (v === 'Pass' ? 'pass' : v === 'Fail' ? 'fail' : '') + '">' + v + '</span></td>' +
        '<td>' + esc(r.endpoint || 'not sent') + '</td></tr>';
    }).join('');
    if (openId != null) showDetail(openId, false);
  }
  function showDetail(id, focus) {
    var r = records.filter(function (x) { return x.id === id; })[0], panel = byId('detail');
    if (!r) { panel.hidden = true; openId = null; return; }
    openId = id;
    var c = check(r);
    byId('detail-h').textContent = 'Record ' + r.id + ': ' + r.event;
    byId('detail-check').innerHTML = c == null ? 'Schema check: loading the schemas…'
      : '<strong>Schema check: ' + (c.ok ? 'pass' : 'fail') + '</strong>' + (c.checked.length ? ' (against ' + c.checked.map(esc).join(' and ') + ' from api-schema.md)' : '');
    byId('detail-errors').innerHTML = c && !c.ok ? c.errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') : '';
    byId('detail-json').textContent = JSON.stringify(r, null, 2);
    panel.hidden = false;
    if (focus) byId('detail-h').focus();
  }

  /* ---------- downloads ---------- */
  function download(name, type, text) {
    var a = document.createElement('a'), url = URL.createObjectURL(new Blob([text], { type: type }));
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function csvCell(v) { var s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function toCsv() {
    var head = ['id', 'event', 'received_at', 'form', 'lang_or_mode', 'schema', 'endpoint', 'fields', 'detail_json'];
    var lines = records.map(function (r) {
      var d = r.detail || {}, c = check(r);
      return [r.id, r.event, r.at, d.form || '', d.lang || d.mode || '', c ? (c.ok ? 'pass' : 'fail') : '', r.endpoint || '', fields(r), JSON.stringify(r.detail)].map(csvCell).join(',');
    });
    return '﻿' + [head.join(',')].concat(lines).join('\r\n'); // BOM: Excel opens Amharic correctly
  }

  /* ---------- page wiring ---------- */
  function lang() { return document.querySelector('input[name=lang]:checked').value; }
  function journey() { return document.querySelector('input[name=form]:checked').value; }
  function voiceLine() {
    var D = window.SavannaOnboarding, el = byId('voice'), l = lang(), e = D.voiceEngine(l);
    el.textContent = 'Voice answers in ' + { en: 'English', am: 'Amharic', om: 'Afaan Oromo' }[l] + ': ' +
      (e === 'addis' ? 'Addis AI, through this site\'s proxy (/api).' : e === 'browser' ? 'the browser\'s own speech recognition (no Addis AI key on this site, or English).' : 'not available in this browser. Typing and tapping always work.');
  }
  document.addEventListener('DOMContentLoaded', function () {
    var D = window.SavannaOnboarding;
    byId('version').textContent = D.version;
    byId('controls').addEventListener('submit', function (e) { e.preventDefault(); });
    byId('send-form').addEventListener('submit', function (e) { e.preventDefault(); });
    byId('mount').onclick = function () {
      D.mount('#slot', { form: journey(), lang: lang(), headingLevel: 2, speechProxy: '../api' });
      voiceLine(); setTimeout(voiceLine, 1500); // after the proxy's readiness check
    };
    byId('unmount').onclick = function () { D.unmount('#slot'); announce('Unmounted. The learner\'s draft stays on this device.'); };
    byId('rows').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-id]'); if (!b) return;
      var id = +b.getAttribute('data-id');
      if (openId === id) { openId = null; byId('detail').hidden = true; render(); b = document.querySelector('button[data-id="' + id + '"]'); if (b) b.focus(); return; }
      openId = id; render(); showDetail(id, true);
    });
    byId('detail-close').onclick = function () {
      var id = openId; openId = null; byId('detail').hidden = true; render();
      var b = document.querySelector('button[data-id="' + id + '"]'); if (b) b.focus();
    };
    byId('dl-json').onclick = function () { download('savanna-records.json', 'application/json', JSON.stringify(records.map(function (r) { return Object.assign({}, r, { schema: check(r) }); }), null, 2)); announce('Downloaded ' + countText()); };
    byId('dl-csv').onclick = function () { download('savanna-records.csv', 'text/csv;charset=utf-8', toCsv()); announce('Downloaded ' + countText()); };
    var del = byId('del'), conf = byId('del-confirm');
    del.onclick = function () { conf.hidden = false; del.setAttribute('aria-expanded', 'true'); byId('del-yes').focus(); };
    byId('del-no').onclick = function () { conf.hidden = true; del.setAttribute('aria-expanded', 'false'); del.focus(); };
    byId('del-yes').onclick = function () {
      records = []; openId = null; byId('detail').hidden = true;
      tx('readwrite', function (st) { return st.clear(); });
      conf.hidden = true; del.setAttribute('aria-expanded', 'false'); render(); del.focus();
      announce('All records deleted.');
    };
    var url = byId('send-url'), on = byId('send-on'), err = byId('send-err');
    on.onchange = function () {
      if (on.checked && !endpoint()) {
        on.checked = false; err.textContent = 'Type a full address that starts with https:// (or http:// for a local test) first.';
        url.setAttribute('aria-invalid', 'true'); url.focus(); return;
      }
      err.textContent = ''; url.removeAttribute('aria-invalid');
      announce(on.checked ? 'Sending is on. Each new record is sent to ' + url.value.trim() + '.' : 'Sending is off.');
    };
    url.oninput = function () { if (on.checked && !endpoint()) { on.checked = false; announce('Sending is off: the address changed.'); } };
    D.mount('#slot', { form: 'signup', lang: 'en', headingLevel: 2, speechProxy: '../api', focus: false });
    voiceLine(); setTimeout(voiceLine, 1500);
    Promise.all([loaded, schemasReady]).then(render);
  });
})();
