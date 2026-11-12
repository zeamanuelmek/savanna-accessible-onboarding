/* Demo host page: plays the role of Savanna / a job platform around the <savanna-onboarding-form> component. */
(function () {
  var D = window.SavannaOnboarding, store = D.store, L = D.label;
  var view = document.getElementById('view');

  function lang() { return (store.get('dimts.prefs', {}).lang) || 'am'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var TX = {
    en: {
      home: 'Home', join: 'Join', passport: 'Support Passport', jobs: 'Jobs', post: 'Post a job', settings: 'Settings', menu: 'Menu',
      product: 'Savanna Accessible Onboarding Module', brandSub: 'Accessible onboarding',
      foot: 'Demo for the Accessibility Hackathon 2026 (Track 1: accessible onboarding). All data stays in this browser. Sample jobs are fictional. Amharic wording is a draft for native-speaker review.',
      jobsShown: '{n} jobs shown', jobShown: '1 job shown',
      heroTitle: 'Sign up, say what helps you, find work that fits',
      heroText: 'The Savanna Accessible Onboarding Module is one accessible form engine. It asks one question per screen, can read every question aloud, accepts voice answers you can check and fix, and never times out. The same engine runs sign-up, the Support Passport, job applications and the employer form.',
      start: 'Start: join Savanna', cards: 'What you can try',
      c1: 'Join, with any ID or none', c1t: 'Fayda, kebele ID, passport, refugee ID, another document, or "refer me" through a partner. Partner staff can also register a learner with their consent.',
      c2: 'Support Passport', c2t: '"What would help you?", never "what is your disability?". It stays on your phone and you choose who sees it.',
      c3: 'Find jobs privately', c3t: 'Filter jobs by the support you need. The filter runs on your phone, so the job board never learns your needs.',
      c4: 'Post a job', c4t: 'Employers tick the support a job offers, using the same list. The job is published in the schema.org JobPosting standard.',
      reset: 'Clear all demo data on this phone', resetDone: 'All demo data on this phone was cleared.',
      jobsTitle: 'Jobs', filterAll: 'Only show jobs that offer everything in my Support Passport',
      filterNote: 'This filter runs on your phone. The job board never sees your Support Passport.',
      noPassport: 'Create your Support Passport to see which jobs offer the support you need.',
      makePassport: 'Create my Support Passport', offers: 'Support this job offers', match: 'Offers {k} of the {n} kinds of support you chose',
      listen: 'Listen to this job', apply: 'Apply', sample: 'Sample job (demo data)', none: 'No jobs match all of your support needs yet. Turn the filter off to see all jobs.',
      myPassport: 'My Support Passport', edit: 'Change my Support Passport', del: 'Delete my Support Passport', deleted: 'Your Support Passport was deleted.',
      onlyYou: 'Only you can see this. It is stored on this phone.', nothing: 'You chose not to share anything for now.',
      nextPassport: 'Next: tell us what helps you (optional)', nextJobs: 'Find jobs', level: 'Your ID level:',
      lv_partner_assisted: 'Registered with a partner. You can start learning now.',
      lv_partner_referral_pending: 'Waiting for a partner to confirm who you are. You can start learning now.',
      lv_document_number_recorded: 'ID number recorded. It can be checked later. You can start learning now.',
      lv_self_declared: 'Self-declared. You can add an ID number at any time. You can start learning now.',
      jsonTitle: 'What other job platforms receive (schema.org JobPosting)', receives: 'What the employer receives',
      notShared: 'Support Passport: not shared', seeJobs: 'See it on the job board', applyFor: 'Applying for:',
      notFound: 'This job was not found.', back: 'Back to jobs'
    },
    am: {
      home: 'መነሻ', join: 'ይመዝገቡ', passport: 'የድጋፍ ፓስፖርት', jobs: 'ሥራዎች', post: 'ሥራ ያስተዋውቁ', settings: 'ቅንብሮች', menu: 'ምናሌ',
      product: 'Savanna Accessible Onboarding Module', brandSub: 'ተደራሽ ምዝገባ',
      foot: 'ለተደራሽነት ሃካቶን 2026 (ትራክ 1፦ ተደራሽ ምዝገባ) የተዘጋጀ ማሳያ። ሁሉም መረጃ በዚህ ብራውዘር ውስጥ ይቆያል። የናሙና ሥራዎቹ ልብ ወለድ ናቸው። የአማርኛው ጽሑፍ በአፍ መፍቻ ተናጋሪ የሚገመገም ረቂቅ ነው።',
      jobsShown: '{n} ሥራዎች ይታያሉ', jobShown: '1 ሥራ ይታያል',
      heroTitle: 'ይመዝገቡ፣ የሚረዳዎትን ይንገሩን፣ የሚስማማዎትን ሥራ ያግኙ',
      heroText: '<span lang="en">Savanna Accessible Onboarding Module</span> አንድ ተደራሽ የቅጽ ሞተር ነው። በአንድ ገጽ አንድ ጥያቄ ይጠይቃል፣ እያንዳንዱን ጥያቄ ጮክ ብሎ ያነባል፣ በድምፅ የሰጡትን መልስ አረጋግጠው እንዲያስተካክሉ ያስችላል፣ የጊዜ ገደብም የለውም። ይኸው ሞተር ምዝገባን፣ የድጋፍ ፓስፖርትን፣ የሥራ ማመልከቻንና የቀጣሪ ቅጽን ያስኬዳል።',
      start: 'ይጀምሩ፦ ሳቫናን ይቀላቀሉ', cards: 'ሊሞክሯቸው የሚችሉ',
      c1: 'በማንኛውም መታወቂያ ወይም ያለ መታወቂያ ይመዝገቡ', c1t: 'ፋይዳ፣ የቀበሌ መታወቂያ፣ ፓስፖርት፣ የስደተኛ መታወቂያ፣ ሌላ ሰነድ ወይም በአጋር ድርጅት በኩል። የአጋር ሠራተኞችም በተማሪው ፈቃድ መመዝገብ ይችላሉ።',
      c2: 'የድጋፍ ፓስፖርት', c2t: '"ምን ይረዳዎታል?" እንጂ "ምን አካል ጉዳት አለብዎት?" አንልም። በስልክዎ ላይ ይቆያል፤ ማን እንደሚያየው እርስዎ ይወስናሉ።',
      c3: 'ሥራ በምስጢር ይፈልጉ', c3t: 'በሚፈልጉት ድጋፍ ሥራዎችን ያጣሩ። ማጣሪያው በስልክዎ ላይ ስለሚሠራ የሥራ ጣቢያው ፍላጎትዎን አያውቅም።',
      c4: 'ሥራ ያስተዋውቁ', c4t: 'ቀጣሪዎች ሥራው የሚሰጠውን ድጋፍ ከተመሳሳይ ዝርዝር ይመርጣሉ።',
      reset: 'በዚህ ስልክ ያለውን የሙከራ መረጃ ሁሉ አጥፋ', resetDone: 'በዚህ ስልክ ያለው የሙከራ መረጃ ሁሉ ተሰርዟል።',
      jobsTitle: 'ሥራዎች', filterAll: 'በድጋፍ ፓስፖርቴ ያለውን ሁሉ የሚሰጡ ሥራዎችን ብቻ አሳይ',
      filterNote: 'ይህ ማጣሪያ በስልክዎ ላይ ይሠራል። የሥራ ጣቢያው የድጋፍ ፓስፖርትዎን አያይም።',
      noPassport: 'የትኞቹ ሥራዎች የሚፈልጉትን ድጋፍ እንደሚሰጡ ለማየት የድጋፍ ፓስፖርትዎን ይፍጠሩ።',
      makePassport: 'የድጋፍ ፓስፖርቴን ፍጠር', offers: 'ይህ ሥራ የሚሰጣቸው ድጋፎች', match: 'ከመረጧቸው {n} ድጋፎች {k}ቱን ይሰጣል',
      listen: 'ይህን ሥራ አዳምጥ', apply: 'አመልክት', sample: 'የናሙና ሥራ (የሙከራ መረጃ)', none: 'እስካሁን ሁሉንም የድጋፍ ፍላጎቶችዎን የሚያሟላ ሥራ የለም። ሁሉንም ለማየት ማጣሪያውን ያጥፉ።',
      myPassport: 'የድጋፍ ፓስፖርቴ', edit: 'የድጋፍ ፓስፖርቴን ቀይር', del: 'የድጋፍ ፓስፖርቴን ሰርዝ', deleted: 'የድጋፍ ፓስፖርትዎ ተሰርዟል።',
      onlyYou: 'ይህን ማየት የሚችሉት እርስዎ ብቻ ነዎት። በዚህ ስልክ ላይ ተቀምጧል።', nothing: 'ለአሁን ምንም ላለማጋራት መርጠዋል።',
      nextPassport: 'ቀጣይ፦ የሚረዳዎትን ይንገሩን (አማራጭ)', nextJobs: 'ሥራ ፈልግ', level: 'የመታወቂያ ደረጃዎ፦',
      lv_partner_assisted: 'በአጋር ድርጅት ተመዝግበዋል። አሁን መማር መጀመር ይችላሉ።',
      lv_partner_referral_pending: 'አጋር ድርጅት ማንነትዎን እስኪያረጋግጥ በመጠበቅ ላይ። አሁን መማር መጀመር ይችላሉ።',
      lv_document_number_recorded: 'የመታወቂያ ቁጥር ተመዝግቧል። በኋላ ሊረጋገጥ ይችላል። አሁን መማር መጀመር ይችላሉ።',
      lv_self_declared: 'በራስ የተገለጸ። በማንኛውም ጊዜ የመታወቂያ ቁጥር መጨመር ይችላሉ። አሁን መማር መጀመር ይችላሉ።',
      jsonTitle: 'ሌሎች የሥራ ጣቢያዎች የሚቀበሉት (schema.org JobPosting)', receives: 'ቀጣሪው የሚቀበለው',
      notShared: 'የድጋፍ ፓስፖርት፦ አልተጋራም', seeJobs: 'በሥራ ገጹ ላይ ይመልከቱት', applyFor: 'የሚያመለክቱበት፦',
      notFound: 'ይህ ሥራ አልተገኘም።', back: 'ወደ ሥራዎች ተመለስ'
    }
  };
  function T(k, vars) { var s = (TX[lang()] || TX.en)[k] || TX.en[k] || k; if (vars) Object.keys(vars).forEach(function (v) { s = s.split('{' + v + '}').join(vars[v]); }); return s; }
  function needLabel(v) { var n = D.NEEDS.filter(function (x) { return x.value === v; })[0]; return n ? L(n.label, lang()) : v; }
  function needIcon(v) { var n = D.NEEDS.filter(function (x) { return x.value === v; })[0]; return n ? n.icon : ''; }

  /* ---- sample jobs (fictional, clearly labelled) ---- */
  var SAMPLE = [
    { id: 's1', sample: true, title: 'Customer support agent (Amharic and English)', org: 'Selam Contact Centre', location: 'Kazanchis, Addis Ababa', mode: 'hybrid',
      offers: ['screen_reader', 'captions', 'written', 'flexible_hours', 'step_free'], description: 'Answer customer questions by chat and phone. Training is provided.' },
    { id: 's2', sample: true, title: 'Junior data entry clerk', org: 'Tana Logistics', location: 'Bole, Addis Ababa', mode: 'onsite',
      offers: ['step_free', 'extra_time', 'written', 'simple_words', 'helper'], description: 'Enter delivery records into a spreadsheet and check them for errors.' },
    { id: 's3', sample: true, title: 'Remote content moderator', org: 'Abay Digital', location: 'Ethiopia', mode: 'remote',
      offers: ['remote', 'screen_reader', 'audio', 'flexible_hours'], description: 'Review posts in Amharic and English and flag harmful content.' },
    { id: 's4', sample: true, title: 'Junior web developer', org: 'Entoto Tech', location: 'Lideta, Addis Ababa', mode: 'hybrid',
      offers: ['sign_language', 'captions', 'written', 'remote', 'extra_time', 'step_free'], description: 'Build and fix web pages with a senior mentor.' }
  ];
  function jobs() { return store.get('dimts.jobs', []).concat(SAMPLE); }
  var MODE = { onsite: { en: 'At the office', am: 'በቢሮ' }, remote: { en: 'From home', am: 'ከቤት' }, hybrid: { en: 'Office and home', am: 'በቢሮና በቤት' } };

  function jobPostingLd(j) {
    return {
      '@context': 'https://schema.org', '@type': 'JobPosting', title: j.title, description: j.description,
      datePosted: j.datePosted || new Date().toISOString().slice(0, 10),
      hiringOrganization: { '@type': 'Organization', name: j.org },
      jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: j.location, addressCountry: 'ET' } },
      jobLocationType: j.mode === 'remote' ? 'TELECOMMUTE' : undefined,
      jobBenefits: j.offers.map(function (o) { var n = D.NEEDS.filter(function (x) { return x.value === o; })[0]; return n ? n.label.en : o; }).join('; '),
      additionalProperty: [{ '@type': 'PropertyValue', name: 'workplaceSupportOffered', value: j.offers }],
      applicationContact: j.contact ? { '@type': 'ContactPoint', description: j.contact } : undefined
    };
  }

  /* ---- views ---- */
  function nav(route) {
    var items = [['#/', 'home'], ['#/signup', 'join'], ['#/passport', 'passport'], ['#/jobs', 'jobs'], ['#/employer', 'post'], ['#/settings', 'settings']];
    document.getElementById('nav').innerHTML = items.map(function (i) {
      var cur = route === i[0] || (i[0] === '#/jobs' && route.indexOf('#/apply') === 0);
      return '<li><a href="' + i[0] + '"' + (cur ? ' aria-current="page"' : '') + '>' + T(i[1]) + '</a></li>';
    }).join('');
    document.documentElement.lang = lang();
    document.getElementById('menu-label').textContent = T('menu');
    document.getElementById('brand-sub').textContent = T('brandSub');
    document.getElementById('foot-text').textContent = T('foot');
  }

  /* ---- mobile menu: a disclosure button; links stay a plain list for screen readers ---- */
  var menuBtn = document.getElementById('menu-btn'), siteNav = document.getElementById('site-nav');
  var narrow = window.matchMedia('(max-width: 47.99em)');
  function setMenu(open, focusBtn) {
    menuBtn.setAttribute('aria-expanded', String(open));
    siteNav.classList.toggle('open', open);
    if (!open && focusBtn) menuBtn.focus();
  }
  menuBtn.addEventListener('click', function () {
    var open = menuBtn.getAttribute('aria-expanded') !== 'true';
    setMenu(open);
    if (open) { var first = siteNav.querySelector('a[aria-current]') || siteNav.querySelector('a'); if (first) first.focus(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false, true); });
  siteNav.addEventListener('click', function (e) { if (e.target.closest('a') && narrow.matches) setMenu(false); });

  function mountForm(formId, instance, onDone) {
    view.innerHTML = '<div class="form-wrap"></div>';
    var el = document.createElement('savanna-onboarding-form');
    el.setAttribute('form', formId);
    if (instance) el.setAttribute('instance', instance);
    if (formId === 'signup') el.setAttribute('welcome', '');
    el.addEventListener('savanna-onboarding:complete', function (e) { onDone(e.detail, el.querySelector('.dm-done-slot')); });
    view.firstChild.appendChild(el);
    var q = el.querySelector('.dm-q'); if (q) q.focus();
    return el;
  }

  function home() {
    view.innerHTML =
      '<section class="hero"><p class="eyebrow" lang="en">Accessibility Hackathon 2026 · Track 1</p><h1 tabindex="-1">' + T('heroTitle') + '</h1><p class="lead">' + T('heroText') + '</p>' +
      '<p class="actions"><a class="btn primary big" href="#/signup">' + T('start') + ' →</a> <a class="btn big ghost" href="#/settings">⚙️ ' + T('settings') + '</a></p></section>' +
      '<h2>' + T('cards') + '</h2><ul class="cards">' +
      [['#/signup', 'c1', '🪪'], ['#/passport', 'c2', '🔒'], ['#/jobs', 'c3', '💼'], ['#/employer', 'c4', '🏢']].map(function (c) {
        return '<li class="card"><span class="card-ico" aria-hidden="true">' + c[2] + '</span><h3><a href="' + c[0] + '">' + T(c[1]) + '</a></h3><p>' + T(c[1] + 't') + '</p></li>';
      }).join('') + '</ul>' +
      '<p><button type="button" class="btn" id="reset">' + T('reset') + '</button></p><p role="status" id="reset-status"></p>';
    document.getElementById('reset').addEventListener('click', function () {
      Object.keys(localStorage).forEach(function (k) { if (k.indexOf('dimts.') === 0 && k !== 'dimts.prefs') store.del(k); });
      document.getElementById('reset-status').textContent = T('resetDone');
    });
    focusH1();
  }

  function signup() {
    mountForm('signup', null, function (d, slot) {
      var a = d.answers;
      var level = a.filler === 'partner' ? 'partner_assisted' : a.id_route === 'none' ? 'partner_referral_pending' : a.id_number ? 'document_number_recorded' : 'self_declared';
      store.set('dimts.profile', { name: a.name, phone: a.phone, lang: d.lang, id_route: a.id_route, assurance_level: level,
        referral_partner: a.referral_partner || null, registered_by: a.filler === 'partner' ? { org: a.partner_org, staff: a.staff_name } : null, dob: a.dob || null });
      if (slot) slot.innerHTML = '<div class="notice"><p><strong>' + T('level') + '</strong> ' + T('lv_' + level) + '</p></div>' +
        '<p class="actions"><a class="btn primary" href="#/passport">' + T('nextPassport') + '</a> <a class="btn" href="#/jobs">' + T('nextJobs') + '</a></p>';
    });
  }

  function passportView() {
    var p = store.get('dimts.passport', null);
    if (p && !window.__editPassport) {
      var list = (p.needs || []);
      view.innerHTML = '<h1 tabindex="-1">' + T('myPassport') + '</h1><p class="muted">' + T('onlyYou') + '</p>' +
        (list.length ? '<ul class="needs">' + list.map(function (n) { return '<li><span aria-hidden="true">' + needIcon(n) + '</span> ' + esc(needLabel(n)) + '</li>'; }).join('') + '</ul>' : '<p>' + T('nothing') + '</p>') +
        (p.other_need ? '<p>' + esc(p.other_need) + '</p>' : '') +
        '<p class="actions"><button type="button" class="btn primary" id="edit">' + T('edit') + '</button> <a class="btn" href="#/jobs">' + T('nextJobs') + '</a> <button type="button" class="btn danger" id="del">' + T('del') + '</button></p><p role="status" id="pp-status"></p>';
      document.getElementById('edit').onclick = function () { window.__editPassport = true; document.getElementById('host-lang').hidden = true; passportView(); };
      document.getElementById('del').onclick = function () { store.del('dimts.passport'); window.__editPassport = false; passportView(); setTimeout(function () { var s = document.getElementById('pp-status'); if (s) s.textContent = T('deleted'); }, 100); };
      focusH1();
      return;
    }
    document.getElementById('host-lang').hidden = true;
    mountForm('passport', null, function (d, slot) {
      window.__editPassport = false;
      var a = d.answers;
      store.set('dimts.passport', { needs: a.want === 'yes' ? (a.needs || []) : [], other_need: a.other_need || '', sharing: a.sharing || 'ask', updated: new Date().toISOString() });
      if (slot) slot.innerHTML = '<p class="actions"><a class="btn primary" href="#/jobs">' + T('nextJobs') + '</a></p>';
    });
  }

  function jobsView() {
    var p = store.get('dimts.passport', null), needs = (p && p.needs) || [];
    var filterOn = needs.length && store.get('dimts.jobFilter', false);
    var list = jobs().map(function (j) { var k = needs.filter(function (n) { return j.offers.indexOf(n) !== -1; }).length; return { j: j, k: k }; });
    if (needs.length) list.sort(function (a, b) { return b.k - a.k; });
    if (filterOn) list = list.filter(function (x) { return x.k === needs.length; });
    var h = '<h1 tabindex="-1">' + T('jobsTitle') + '</h1>';
    if (needs.length) h += '<div class="filter"><label><input type="checkbox" id="flt"' + (filterOn ? ' checked' : '') + '> ' + T('filterAll') + '</label><p class="muted">🔒 ' + T('filterNote') + '</p></div>';
    else h += '<div class="notice"><p>' + T('noPassport') + '</p><p><a class="btn" href="#/passport">' + T('makePassport') + '</a></p></div>';
    h += '<p role="status" id="jobs-status" class="muted"></p>';
    if (!list.length) h += '<p>' + T('none') + '</p>';
    h += '<ul class="jobs">' + list.map(function (x) {
      var j = x.j, en = j.sample && lang() !== 'en' ? ' lang="en"' : '';
      return '<li class="job"><article aria-labelledby="job-' + j.id + '"><h2 id="job-' + j.id + '"' + en + '>' + esc(j.title) + '</h2>' +
        '<p class="meta"><span' + en + '>' + esc(j.org) + ' · ' + esc(j.location) + '</span> · ' + esc(L(MODE[j.mode], lang())) + (j.sample ? ' · <span class="tag">' + T('sample') + '</span>' : '') + '</p>' +
        '<p' + en + '>' + esc(j.description) + '</p>' +
        (needs.length ? '<p class="match">' + T('match', { k: x.k, n: needs.length }) + '</p>' : '') +
        '<h3>' + T('offers') + '</h3><ul class="needs small">' + j.offers.map(function (o) { return '<li' + (needs.indexOf(o) !== -1 ? ' class="hit"' : '') + '><span aria-hidden="true">' + needIcon(o) + '</span> ' + esc(needLabel(o)) + '</li>'; }).join('') + '</ul>' +
        '<p class="actions"><button type="button" class="btn" data-listen="' + j.id + '">🔊 ' + T('listen') + '<span class="vh"' + en + '> ' + esc(j.title) + '</span></button> <a class="btn primary" href="#/apply/' + j.id + '">' + T('apply') + '<span class="vh"' + en + '> ' + esc(j.title) + '</span></a></p></article></li>';
    }).join('') + '</ul>';
    view.innerHTML = h;
    // The result count is announced on load and after filtering (status live region, filled after it exists).
    var count = list.length;
    setTimeout(function () { var s = document.getElementById('jobs-status'); if (s) s.textContent = count === 1 ? T('jobShown') : T('jobsShown', { n: count }); }, 60);
    var flt = document.getElementById('flt');
    if (flt) flt.addEventListener('change', function () {
      store.set('dimts.jobFilter', flt.checked); jobsView();
      var f = document.getElementById('flt'); if (f) f.focus();
    });
    view.querySelectorAll('[data-listen]').forEach(function (b) {
      b.addEventListener('click', function () {
        var j = jobs().filter(function (x) { return x.id === b.getAttribute('data-listen'); })[0];
        var text = j.title + '. ' + j.org + '. ' + j.location + '. ' + j.description + '. ' + T('offers') + ': ' + j.offers.map(needLabel).join(', ');
        if (!D.speak(text, lang())) { var s = document.getElementById('jobs-status'); if (s) s.textContent = lang() === 'am' ? 'የአማርኛ ድምፅ በዚህ ስልክ ላይ ገና አልተጫነም።' : 'Audio is not available on this device.'; }
      });
    });
    if (!flt) focusH1(); else if (document.activeElement === document.body) focusH1();
  }

  function employer() {
    mountForm('employer', null, function (d, slot) {
      var a = d.answers;
      var job = { id: 'j' + Date.now().toString(36), title: a.title, org: a.org, location: a.location, mode: a.mode, offers: a.offers || [], description: a.description, contact: a.contact, datePosted: new Date().toISOString().slice(0, 10) };
      store.set('dimts.jobs', [job].concat(store.get('dimts.jobs', [])));
      if (slot) slot.innerHTML = '<p class="actions"><a class="btn primary" href="#/jobs">' + T('seeJobs') + '</a></p>' +
        '<details><summary>' + T('jsonTitle') + '</summary><pre tabindex="0"><code>' + esc(JSON.stringify(jobPostingLd(job), null, 2)) + '</code></pre></details>';
    });
  }

  function apply(id) {
    var j = jobs().filter(function (x) { return x.id === id; })[0];
    if (!j) { view.innerHTML = '<h1 tabindex="-1">' + T('notFound') + '</h1><p><a href="#/jobs">' + T('back') + '</a></p>'; focusH1(); return; }
    var el = mountForm('apply', id, function (d, slot) {
      var a = d.answers, p = store.get('dimts.passport', null);
      var packet = { job: j.title, employer: j.org, name: a.name, phone: a.phone, why: a.why, experience: a.experience, interview: a.interview || [] };
      if (a.share_passport === 'share' && p) packet.supportThatHelps = p.needs.map(function (n) { return D.NEEDS.filter(function (x) { return x.value === n; })[0].label.en; });
      var apps = store.get('dimts.applications', []); apps.unshift({ at: new Date().toISOString(), packet: packet }); store.set('dimts.applications', apps);
      if (slot) slot.innerHTML = '<h2>' + T('receives') + '</h2><pre tabindex="0"><code>' + esc(JSON.stringify(packet, null, 2)) + '</code></pre>' +
        (packet.supportThatHelps ? '' : '<p class="muted">' + T('notShared') + '</p>') +
        '<p><a class="btn" href="#/jobs">' + T('back') + '</a></p>';
    });
    var banner = document.createElement('p'); banner.className = 'muted';
    var en = j.sample && lang() !== 'en' ? ' lang="en"' : ''; // sample jobs are written in English
    banner.innerHTML = T('applyFor') + ' <span' + en + '><strong>' + esc(j.title) + '</strong> · ' + esc(j.org) + '</span>';
    view.insertBefore(banner, view.firstChild);
    var q = el.querySelector('.dm-q'); if (q) q.focus();
  }

  function settingsView() {
    view.innerHTML = '<div class="form-wrap"><savanna-onboarding-settings></savanna-onboarding-settings></div>';
    var h = view.querySelector('.dm-q'); if (h) h.focus();
  }

  function focusH1() { var h = view.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }

  var TITLES = { '#/': 'home', '#/signup': 'join', '#/passport': 'passport', '#/jobs': 'jobs', '#/employer': 'post', '#/settings': 'settings' };
  function route() {
    var r = location.hash || '#/';
    if (r.indexOf('#/') !== 0) return; // in-page anchors such as the skip link
    D.stopSpeaking();
    nav(r);
    var isForm = r === '#/signup' || r === '#/employer' || r === '#/settings' || r.indexOf('#/apply/') === 0 || (r === '#/passport' && (!store.get('dimts.passport', null) || window.__editPassport));
    document.getElementById('host-lang').hidden = isForm;
    var base = r.indexOf('#/apply/') === 0 ? '#/apply' : r;
    document.title = (base === '#/apply' ? T('apply') : T(TITLES[base] || 'home')) + ' · ' + T('product');
    if (base !== '#/passport') window.__editPassport = false;
    if (r === '#/' || r === '#') home();
    else if (r === '#/signup') signup();
    else if (r === '#/passport') passportView();
    else if (r === '#/jobs') jobsView();
    else if (r === '#/employer') employer();
    else if (base === '#/apply') apply(r.slice('#/apply/'.length));
    else if (r === '#/settings') settingsView();
    else home();
    window.scrollTo(0, 0);
  }

  function syncHostLang() { var b = document.getElementById('host-lang'); b.textContent = lang() === 'am' ? 'English' : 'አማርኛ'; b.setAttribute('lang', lang() === 'am' ? 'en' : 'am'); }
  // Preferences can change from any component (language switch, Settings): keep the host page in step.
  document.addEventListener('savanna-onboarding:prefs', function () {
    var r = location.hash || '#/';
    nav(r); syncHostLang();
    var formPage = r === '#/signup' || r === '#/employer' || r === '#/settings' || r.indexOf('#/apply/') === 0 || (r === '#/passport' && (!store.get('dimts.passport', null) || window.__editPassport));
    if (!formPage) { var active = document.activeElement && document.activeElement.id; route(); if (active) { var el = document.getElementById(active); if (el) el.focus(); } }
  });
  document.getElementById('skip').addEventListener('click', function (e) { e.preventDefault(); var m = document.getElementById('main'); m.focus(); });
  document.getElementById('host-lang').addEventListener('click', function () { D.setPrefs({ lang: lang() === 'am' ? 'en' : 'am' }); });
  syncHostLang();
  window.addEventListener('hashchange', route);
  route();
})();
