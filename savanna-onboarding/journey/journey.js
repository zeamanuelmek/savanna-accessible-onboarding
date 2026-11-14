/* Savanna learner journey: the module inside Savanna's own page design (ALX starter kit, vendor/savanna-static-pages).
   One page per step, as Savanna is server-rendered: index → signup → dashboard → profile / passport → jobs → apply,
   plus employer, settings, takeover and a SIMULATED log-in. Each page has <body data-page="…"> and nothing else;
   this script draws Savanna's header and sidebar (with accessibility fixes, see README) and the page content.
   Learner data is handled by the module and the shared demo views in app.js. The log-in session is the host's own. */
(function () {
  'use strict';
  var D = window.SavannaOnboarding, H = window.SavannaDemoHost, store = D.store;
  var page = document.body.getAttribute('data-page') || 'home';
  var SESSION = 'savanna-demo.session';

  /* ---------- page links: the shared views speak in '#/…' routes; here they become Savanna pages ---------- */
  var PAGES = { '#/': 'dashboard.html', '#/signup': 'signup.html', '#/profile': 'profile.html', '#/takeover': 'takeover.html',
    '#/passport': 'passport.html', '#/jobs': 'jobs.html', '#/employer': 'employer.html', '#/settings': 'settings.html' };
  H.setLinks(function (r) {
    if (r.indexOf('#/apply/') === 0) return 'apply.html?job=' + encodeURIComponent(r.slice('#/apply/'.length));
    return PAGES[r] || 'index.html';
  });

  /* ---------- words (Amharic is a draft for native-speaker review) ---------- */
  var TX = {
    en: {
      skip: 'Skip to main content', menu: 'Menu', logoAlt: 'Savanna home', navLabel: 'Savanna',
      home: 'Home', dashboard: 'My dashboard', profile: 'My profile', passport: 'Support Passport', jobs: 'Jobs',
      employer: 'For employers: post a job', settings: 'Accessibility settings', signup: 'Sign up', login: 'Log in', logout: 'Log out',
      takeover: 'Take over your account', apply: 'Apply',
      foot: 'Demo of the Savanna Accessible Onboarding Module inside Savanna\'s own page design (ALX starter kit). The log-in is simulated, all data stays in this browser, sample jobs are fictional, and the Amharic is a draft for native-speaker review.',
      showroom: 'Developer and test page', testHost: 'Test host page',
      heroTitle: 'Learn with Savanna',
      heroText: 'Sign up in a few minutes, one question at a time. Choose how you want to answer: read and type, listen, speak, or simple steps with pictures. We never ask why.',
      heroNoId: 'No ID? You can still start learning: a partner organisation can confirm who you are.',
      backIn: 'Welcome back, {name}.', toDashboard: 'Go to my dashboard',
      needLogin: 'Please log in', needLoginText: 'You need to log in to see this page.', noAccount: 'No account yet?',
      welcome: 'Welcome, {name}', idCard: 'Your ID status',
      ppNone: 'Not created yet. Tell us what helps you learn and work. It stays private.', ppCreate: 'Create my Support Passport',
      ppSaved: 'Saved. Who can see it: {who}.', ppOnlyMe: 'only you', ppTrainers: 'you and your ALX trainers', ppEmpty: 'You chose not to share anything for now.',
      ppOpen: 'Open my Support Passport',
      profText: 'Check or change your name, phone number and ID.', profOpen: 'Open my profile',
      jobsText: 'Find jobs that offer the support you need. The filter runs on your phone.', jobsOpen: 'Find jobs',
      setText: 'Text size, contrast, language, read aloud and voice answers.', setOpen: 'Open settings',
      takeText: 'A partner organisation signed you up. Check the details and take over your account.',
      loginTitle: 'Log in', simLabel: 'Simulated log-in',
      simText: 'This demo has no server. No SMS is sent. The only check is that the phone number matches the account saved on this phone.',
      phone: 'Phone number', phoneHint: 'The number you signed up with, for example 0911 234 567.', sendCode: 'Send me a code',
      smsTitle: 'Simulated SMS', smsText: 'Your Savanna log-in code is {code}', code: 'Code from the SMS',
      codeHint: 'You can copy and paste it, or let your phone fill it in. There is no time limit.', doLogin: 'Log in',
      problem: 'There is a problem', errPhone: 'Enter a phone number with 10 digits, like 0911 234 567.',
      errNoAccount: 'There is no Savanna account with this phone number on this phone. Check the number, or sign up.',
      errCode: 'That code does not match the SMS. Check it and try again. You can paste it.',
      codeSent: 'Code sent (simulated). It is shown below.', loggedOut: 'You have logged out. Your answers stay on this phone.',
      employerIntro: 'For employers', settingsIntro: '',
      offline: 'You are offline. Pages you have opened before still work, and your answers stay on this phone.', online: 'You are back online.'
    },
    am: {
      skip: 'ወደ ዋናው ይዘት ይዝለሉ', menu: 'ምናሌ', logoAlt: 'የሳቫና መነሻ', navLabel: 'ሳቫና',
      home: 'መነሻ', dashboard: 'ዳሽቦርዴ', profile: 'የእኔ መገለጫ', passport: 'የድጋፍ ፓስፖርት', jobs: 'ሥራዎች',
      employer: 'ለቀጣሪዎች፦ ሥራ ያስተዋውቁ', settings: 'የተደራሽነት ቅንብሮች', signup: 'ይመዝገቡ', login: 'ግባ', logout: 'ውጣ',
      takeover: 'መለያዎን ይረከቡ', apply: 'አመልክት',
      foot: 'የ<span lang="en">Savanna Accessible Onboarding Module</span> ማሳያ፣ በሳቫና የራሱ የገጽ ንድፍ ውስጥ (የALX ማስጀመሪያ ኪት)። መግባቱ የተመሰለ ነው፤ ሁሉም መረጃ በዚህ ብራውዘር ውስጥ ይቆያል፤ የናሙና ሥራዎቹ ልብ ወለድ ናቸው፤ አማርኛው በአፍ መፍቻ ተናጋሪ የሚገመገም ረቂቅ ነው።',
      showroom: 'የገንቢዎችና የሙከራ ገጽ', testHost: 'የሙከራ አስተናጋጅ ገጽ',
      heroTitle: 'በሳቫና ይማሩ',
      heroText: 'በጥቂት ደቂቃዎች፣ በአንድ ጊዜ አንድ ጥያቄ እየመለሱ ይመዝገቡ። መመለስ የሚፈልጉበትን መንገድ ይምረጡ፦ አንብበው መጻፍ፣ ማዳመጥ፣ በድምፅ መመለስ ወይም ከሥዕል ጋር ቀላል ደረጃዎች። ምክንያቱን በፍጹም አንጠይቅም።',
      heroNoId: 'መታወቂያ የለዎትም? አሁንም መማር መጀመር ይችላሉ፤ አጋር ድርጅት ማንነትዎን ሊያረጋግጥ ይችላል።',
      backIn: 'እንኳን ደህና መጡ፣ {name}።', toDashboard: 'ወደ ዳሽቦርዴ ሂድ',
      needLogin: 'እባክዎ ይግቡ', needLoginText: 'ይህን ገጽ ለማየት መግባት ያስፈልግዎታል።', noAccount: 'እስካሁን መለያ የለዎትም?',
      welcome: 'እንኳን ደህና መጡ፣ {name}', idCard: 'የመታወቂያዎ ሁኔታ',
      ppNone: 'ገና አልተፈጠረም። ለመማርና ለመሥራት የሚረዳዎትን ይንገሩን። የግል ሆኖ ይቆያል።', ppCreate: 'የድጋፍ ፓስፖርቴን ፍጠር',
      ppSaved: 'ተቀምጧል። ማየት የሚችለው፦ {who}።', ppOnlyMe: 'እርስዎ ብቻ', ppTrainers: 'እርስዎና የALX አሰልጣኞችዎ', ppEmpty: 'ለአሁን ምንም ላለማጋራት መርጠዋል።',
      ppOpen: 'የድጋፍ ፓስፖርቴን ክፈት',
      profText: 'ስምዎን፣ ስልክ ቁጥርዎንና መታወቂያዎን ያረጋግጡ ወይም ይቀይሩ።', profOpen: 'መገለጫዬን ክፈት',
      jobsText: 'የሚፈልጉትን ድጋፍ የሚሰጡ ሥራዎችን ያግኙ። ማጣሪያው በስልክዎ ላይ ይሠራል።', jobsOpen: 'ሥራ ፈልግ',
      setText: 'የጽሑፍ መጠን፣ ንፅፅር፣ ቋንቋ፣ ማንበብና በድምፅ መመለስ።', setOpen: 'ቅንብሮችን ክፈት',
      takeText: 'አጋር ድርጅት አስመዝግቦዎታል። ዝርዝሩን ያረጋግጡና መለያዎን ይረከቡ።',
      loginTitle: 'ግባ', simLabel: 'የተመሰለ መግቢያ',
      simText: 'ይህ ማሳያ አገልጋይ የለውም። አጭር መልእክት አይላክም። የሚረጋገጠው ስልክ ቁጥሩ በዚህ ስልክ ከተቀመጠው መለያ ጋር መመሳሰሉ ብቻ ነው።',
      phone: 'ስልክ ቁጥር', phoneHint: 'የተመዘገቡበት ቁጥር፣ ለምሳሌ 0911 234 567።', sendCode: 'ኮድ ላክልኝ',
      smsTitle: 'የተመሰለ አጭር መልእክት', smsText: 'የሳቫና መግቢያ ኮድዎ {code} ነው', code: 'ከአጭር መልእክቱ የተገኘ ኮድ',
      codeHint: 'ገልብጠው መለጠፍ ወይም ስልክዎ እንዲሞላው መፍቀድ ይችላሉ። የጊዜ ገደብ የለም።', doLogin: 'ግባ',
      problem: 'ችግር አለ', errPhone: 'ባለ 10 አሃዝ ስልክ ቁጥር ያስገቡ፤ ለምሳሌ 0911 234 567።',
      errNoAccount: 'በዚህ ስልክ ላይ በዚህ ስልክ ቁጥር የሳቫና መለያ የለም። ቁጥሩን ያረጋግጡ ወይም ይመዝገቡ።',
      errCode: 'ኮዱ ከአጭር መልእክቱ ጋር አይመሳሰልም። ያረጋግጡና እንደገና ይሞክሩ። መለጠፍ ይችላሉ።',
      codeSent: 'ኮድ ተልኳል (የተመሰለ)። ከታች ይታያል።', loggedOut: 'ወጥተዋል። መልሶችዎ በዚህ ስልክ ላይ ይቆያሉ።',
      employerIntro: 'ለቀጣሪዎች', settingsIntro: '',
      offline: 'ከኢንተርኔት ውጪ ነዎት። ከዚህ በፊት የከፈቷቸው ገጾች አሁንም ይሠራሉ፤ መልሶችዎም በዚህ ስልክ ላይ ይቆያሉ።', online: 'እንደገና ከኢንተርኔት ጋር ተገናኝተዋል።'
    }
  };
  function lang() { return H.lang(); }
  function T(k, vars) { var s = (TX[lang()] || TX.en)[k]; if (s == null) s = TX.en[k] != null ? TX.en[k] : k; if (vars) Object.keys(vars).forEach(function (v) { s = s.split('{' + v + '}').join(vars[v]); }); return s; }
  var esc = H.esc;

  /* ---------- simulated session (the host's own, not the module's) ---------- */
  function session() { try { return JSON.parse(localStorage.getItem(SESSION) || 'null'); } catch (e) { return null; } }
  function setSession(s) { try { if (s) localStorage.setItem(SESSION, JSON.stringify(s)); else localStorage.removeItem(SESSION); } catch (e) {} }
  function profile() { return store.get('profile', null); }
  function signedIn() { return !!(session() && profile()); }
  var PROTECTED = ['dashboard', 'profile', 'passport', 'takeover', 'apply'];

  /* ---------- Savanna frame: header + sidebar + main, with accessibility fixes ---------- */
  var narrow = window.matchMedia('(max-width: 767.98px)');
  function navItems() {
    var items = signedIn()
      ? [['dashboard.html', 'dashboard', 'fa-home'], ['profile.html', 'profile', 'fa-user'], ['passport.html', 'passport', 'fa-shield-halved'],
         ['jobs.html', 'jobs', 'fa-briefcase'], ['settings.html', 'settings', 'fa-universal-access'], ['employer.html', 'employer', 'fa-building'], ['#logout', 'logout', 'fa-right-from-bracket']]
      : [['index.html', 'home', 'fa-home'], ['signup.html', 'signup', 'fa-user-plus'], ['login.html', 'login', 'fa-right-to-bracket'],
         ['jobs.html', 'jobs', 'fa-briefcase'], ['settings.html', 'settings', 'fa-universal-access'], ['employer.html', 'employer', 'fa-building']];
    var current = page === 'apply' ? 'jobs' : page === 'takeover' ? 'profile' : page;
    return items.map(function (i) {
      var cur = i[1] === current || (i[1] === 'home' && current === 'home');
      var attrs = i[0] === '#logout' ? ' href="index.html" data-logout' : ' href="' + i[0] + '"';
      return '<li' + (i[1] === 'employer' ? ' class="sj-sep"' : '') + '><a' + attrs + (cur ? ' aria-current="page"' : '') + '><span class="icon' + (cur ? ' active' : '') + '"><i aria-hidden="true" class="fa-solid ' + i[2] + '"></i></span>' +
        '<span class="ps-3 sj-label">' + T(i[1]) + '</span></a></li>';
    }).join('');
  }
  function frame() {
    var other = lang() === 'am' ? 'en' : 'am';
    document.documentElement.lang = lang();
    var open = !document.body.classList.contains('sidebar-collapsed');
    var html =
      '<a class="sj-skip" href="#content">' + T('skip') + '</a>' +
      '<header class="header d-flex align-items-center position-fixed top-0 w-100 sj-header">' +
        '<div class="header-left align-items-center d-flex px-2">' +
          '<button type="button" class="hamburger sj-menu" aria-expanded="' + open + '" aria-controls="sidebar"><i class="fa-solid fa-bars" aria-hidden="true"></i><span class="sj-menu-label">' + T('menu') + '</span></button>' +
          '<a class="logo-container p-1" href="' + (signedIn() ? 'dashboard.html' : 'index.html') + '"><img class="sj-logo" src="vendor/savanna-static-pages/assets/img/holberton-logo-full-alx.png" alt="' + esc(T('logoAlt')) + '"></a>' +
        '</div>' +
        '<div class="header-right d-flex align-items-center flex-grow-1 justify-content-end pe-3">' +
          '<button type="button" class="sj-lang" data-lang="' + other + '" lang="' + other + '">' + (other === 'en' ? 'English' : 'አማርኛ') + '</button>' +
        '</div>' +
      '</header>' +
      '<nav class="sidebar navigation bg-white border-end position-fixed overflow-scroll bottom-0 start-0' + (open ? ' expanded' : '') + '" id="sidebar" aria-label="' + esc(T('navLabel')) + '">' +
        '<ul class="px-2">' + navItems() + '</ul></nav>';
    var shell = document.getElementById('sj-frame');
    if (!shell) { shell = document.createElement('div'); shell.id = 'sj-frame'; document.body.insertBefore(shell, document.body.firstChild); }
    shell.innerHTML = html;
    var main = document.getElementById('content');
    if (!main) {
      main = document.createElement('main'); main.className = 'content'; main.id = 'content'; main.tabIndex = -1;
      main.innerHTML = '<div class="sj"><p id="sj-offline" class="notice" role="status" hidden></p><div id="sj-view"></div><footer class="sj-foot"><p id="sj-foot"></p><p class="sj-foot-links"></p></footer></div>';
      document.body.appendChild(main);
    }
    document.getElementById('sj-foot').innerHTML = T('foot');
    main.querySelector('.sj-foot-links').innerHTML = '<a href="showroom.html">' + T('showroom') + '</a> · <a href="test-host/">' + T('testHost') + '</a>';
    wireFrame();
  }
  function setMenu(open, focusBtn) {
    var btn = document.querySelector('.sj-menu'), nav = document.getElementById('sidebar');
    document.body.classList.toggle('sidebar-collapsed', !open);
    nav.classList.toggle('expanded', open);
    btn.setAttribute('aria-expanded', String(open));
    try { if (!narrow.matches) localStorage.setItem('sidebar-collapsed', open ? '0' : '1'); } catch (e) {}
    if (open && narrow.matches) { var a = nav.querySelector('a[aria-current]') || nav.querySelector('a'); if (a) a.focus(); }
    if (!open && focusBtn) btn.focus();
  }
  function wireFrame() {
    document.querySelector('.sj-menu').onclick = function () { setMenu(this.getAttribute('aria-expanded') !== 'true'); };
    document.querySelector('.sj-lang').onclick = function () { D.setPrefs({ lang: this.getAttribute('data-lang') }); };
    var lo = document.querySelector('[data-logout]');
    if (lo) lo.onclick = function () { setSession(null); try { sessionStorage.setItem('sj-flash', 'loggedOut'); } catch (e) {} };
  }
  document.addEventListener('keydown', function (e) {
    var btn = document.querySelector('.sj-menu');
    if (e.key === 'Escape' && narrow.matches && btn && btn.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  // Phones start with the menu closed (Savanna's sidebar covers the page there); larger screens remember the choice.
  var collapsed = narrow.matches; try { if (!narrow.matches) collapsed = localStorage.getItem('sidebar-collapsed') === '1'; } catch (e) {}
  document.body.classList.add('signed_in');
  document.body.classList.toggle('sidebar-collapsed', collapsed);

  /* ---------- pages ---------- */
  var view;
  function focusH1() { var h = view.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }
  function title(k) { document.title = T(k) + ' | Savanna'; }
  function needLogin() {
    view.innerHTML = '<h1>' + T('needLogin') + '</h1><p>' + T('needLoginText') + '</p>' +
      '<p class="actions"><a class="btn primary" href="login.html">' + T('login') + '</a></p><p>' + T('noAccount') + ' <a href="signup.html">' + T('signup') + '</a></p>';
  }
  function card(h, body, href, linkText, primary) {
    return '<li class="card homepage-card rounded-3 sj-card"><h2 class="h5">' + h + '</h2>' + body +
      (href ? '<p class="mb-0"><a class="btn' + (primary ? ' primary' : '') + '" href="' + href + '">' + linkText + '</a></p>' : '') + '</li>';
  }

  var PAGES_RENDER = {
    home: function () {
      title('home');
      var p = profile();
      view.innerHTML = '<section class="sj-hero"><h1>' + T('heroTitle') + '</h1><p class="lead">' + T('heroText') + '</p>' +
        (signedIn() ? '<p>' + T('backIn', { name: esc(p.name) }) + '</p><p class="actions"><a class="btn primary big" href="dashboard.html">' + T('toDashboard') + '</a></p>'
          : '<p class="actions"><a class="btn primary big" href="signup.html">' + T('signup') + '</a> <a class="btn big" href="login.html">' + T('login') + '</a></p>') +
        '<p class="muted">' + T('heroNoId') + '</p></section>';
    },
    signup: function () {
      title('signup');
      H.render('signup', view);
    },
    login: function () { title('login'); loginPage(); },
    dashboard: function () {
      title('dashboard');
      var p = profile(), pp = store.get('passport', null);
      var ppBody = !pp ? '<p>' + T('ppNone') + '</p>'
        : '<p>🔒 ' + T('ppSaved', { who: T(pp.sharing === 'trainers' ? 'ppTrainers' : 'ppOnlyMe') }) + '</p>' + ((pp.needs || []).length ? '' : '<p>' + T('ppEmpty') + '</p>');
      view.innerHTML = '<h1>' + T('welcome', { name: esc(p.name) }) + '</h1><ul class="sj-cards">' +
        (p.takeover_pending ? card(T('takeover'), '<p>' + T('takeText') + '</p>', 'takeover.html', T('takeover'), true) : '') +
        card(T('passport'), ppBody, 'passport.html', T(pp ? 'ppOpen' : 'ppCreate'), !pp && !p.takeover_pending) +
        card(T('idCard'), H.statusPanel(p), null) +
        card(T('profile'), '<p>' + T('profText') + '</p>', 'profile.html', T('profOpen')) +
        card(T('jobs'), '<p>' + T('jobsText') + '</p>', 'jobs.html', T('jobsOpen')) +
        card(T('settings'), '<p>' + T('setText') + '</p>', 'settings.html', T('setOpen')) + '</ul>';
    },
    profile: function () { title('profile'); H.render('profile', view); },
    takeover: function () { title('takeover'); H.render('takeover', view); },
    passport: function () { title('passport'); H.render('passport', view); },
    jobs: function () { title('jobs'); H.render('jobs', view); },
    apply: function () {
      title('apply');
      var id = new URLSearchParams(location.search).get('job') || '';
      H.render('apply', view, id);
    },
    employer: function () { title('employer'); H.render('employer', view); },
    settings: function () { title('settings'); H.render('settings', view); }
  };

  /* Simulated log-in (WCAG 3.3.8): no password to remember, no puzzle, no time limit; the code can be pasted or
     filled in by the phone (autocomplete="one-time-code"). Clearly labelled as simulated. */
  var login = { step: 'phone', phone: '', code: '', error: '' };
  function digits(s) { var d = String(s || '').replace(/\D/g, ''); return d.indexOf('251') === 0 ? '0' + d.slice(3) : d; }
  function loginPage() {
    var err = login.error, field = login.step === 'phone' ? 'sj-phone' : 'sj-code';
    var h = '<div class="form-wrap"><h1>' + T('loginTitle') + '</h1>' +
      '<div class="notice"><p><strong>' + T('simLabel') + '.</strong> ' + T('simText') + '</p></div>';
    if (err) h += '<div class="sj-errors" role="alert" tabindex="-1"><h2>' + T('problem') + '</h2><ul><li><a href="#' + field + '">' + esc(err) + '</a></li></ul></div>';
    h += '<form id="sj-login" novalidate>';
    if (login.step === 'phone') {
      h += '<p><label class="sj-label-big" for="sj-phone">' + T('phone') + '</label></p><p id="sj-phone-hint" class="muted">' + T('phoneHint') + '</p>' +
        (err ? '<p id="sj-err" class="sj-err">' + esc(err) + '</p>' : '') +
        '<p><input id="sj-phone" class="sj-input" type="tel" inputmode="tel" autocomplete="tel" value="' + esc(login.phone) + '" aria-describedby="sj-phone-hint' + (err ? ' sj-err' : '') + '"' + (err ? ' aria-invalid="true"' : '') + '></p>' +
        '<p class="actions"><button type="submit" class="btn primary">' + T('sendCode') + '</button></p>';
    } else {
      h += '<div class="notice sj-sms"><h2>' + T('smsTitle') + '</h2><p><samp>' + T('smsText', { code: login.code }) + '</samp></p></div>' +
        '<p><label class="sj-label-big" for="sj-code">' + T('code') + '</label></p><p id="sj-code-hint" class="muted">' + T('codeHint') + '</p>' +
        (err ? '<p id="sj-err" class="sj-err">' + esc(err) + '</p>' : '') +
        '<p><input id="sj-code" class="sj-input" type="text" inputmode="numeric" autocomplete="one-time-code" aria-describedby="sj-code-hint' + (err ? ' sj-err' : '') + '"' + (err ? ' aria-invalid="true"' : '') + '></p>' +
        '<p class="actions"><button type="submit" class="btn primary">' + T('doLogin') + '</button></p>';
    }
    h += '</form><p role="status" id="sj-status" class="muted"></p><p>' + T('noAccount') + ' <a href="signup.html">' + T('signup') + '</a></p></div>';
    view.innerHTML = h;
    document.getElementById('sj-login').onsubmit = function (e) {
      e.preventDefault();
      if (login.step === 'phone') {
        login.phone = document.getElementById('sj-phone').value.trim();
        var p = profile();
        if (digits(login.phone).length !== 10) login.error = T('errPhone');
        else if (!p || digits(p.phone) !== digits(login.phone)) login.error = T('errNoAccount');
        else { login.error = ''; login.step = 'code'; login.code = String(Math.floor(100000 + Math.random() * 900000)); }
        loginPage();
        if (login.error) document.querySelector('.sj-errors').focus();
        else { document.getElementById('sj-code').focus(); say(T('codeSent')); }
      } else {
        if (digits(document.getElementById('sj-code').value) !== login.code) { login.error = T('errCode'); loginPage(); document.querySelector('.sj-errors').focus(); return; }
        setSession({ at: new Date().toISOString() });
        location.href = 'dashboard.html';
      }
    };
    var link = view.querySelector('.sj-errors a');
    if (link) link.onclick = function (e) { e.preventDefault(); document.getElementById(field).focus(); };
  }
  function say(msg) { setTimeout(function () { var s = document.getElementById('sj-status'); if (s) s.textContent = msg; }, 80); }

  function renderPage(first) {
    view = document.getElementById('sj-view');
    if (PROTECTED.indexOf(page) !== -1 && !signedIn()) { title('needLogin'); needLogin(); }
    else (PAGES_RENDER[page] || PAGES_RENDER.home)();
    if (first) {
      var flash = null; try { flash = sessionStorage.getItem('sj-flash'); sessionStorage.removeItem('sj-flash'); } catch (e) {}
      if (flash) { var n = document.createElement('p'); n.className = 'notice'; n.setAttribute('role', 'status'); view.insertBefore(n, view.firstChild); setTimeout(function () { n.textContent = T(flash); }, 80); }
    }
  }

  /* After sign-up the learner is logged in (simulated), and the next step offers the dashboard too. */
  document.addEventListener('savanna-onboarding:complete', function (e) {
    if (e.detail.form !== 'signup') return;
    setSession({ at: new Date().toISOString() });
    frame(); // the sidebar now shows the signed-in pages
    var slot = document.querySelector('.dm-done-slot .actions');
    if (slot && !(profile() || {}).takeover_pending) slot.insertAdjacentHTML('beforeend', ' <a class="btn" href="dashboard.html">' + T('toDashboard') + '</a>');
  });
  // Language changes come from the header button, any form's language switch, or Settings.
  document.addEventListener('savanna-onboarding:prefs', function () {
    var active = document.activeElement && (document.activeElement.className || '').indexOf('sj-lang') !== -1;
    frame();
    if (!view.querySelector('savanna-onboarding-form, savanna-onboarding-settings')) renderPage(false);
    if (active) document.querySelector('.sj-lang').focus();
  });

  /* Minimum offline mode: the service worker keeps the pages, module, fonts and styles on this phone (sw.js).
     Pages that show a form get the module's own offline message; the others get this one. */
  function netNotice() {
    var n = document.getElementById('sj-offline');
    if (!n) return;
    var hasForm = !!view.querySelector('savanna-onboarding-form');
    if (navigator.onLine === false && !hasForm) { n.hidden = false; n.textContent = T('offline'); }
    else if (!n.hidden) { n.textContent = T('online'); setTimeout(function () { if (navigator.onLine !== false) n.hidden = true; }, 6000); }
  }
  window.addEventListener('online', netNotice);
  window.addEventListener('offline', netNotice);
  if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register('sw.js').catch(function () {}); } catch (e) {} }

  frame();
  renderPage(true);
  if (navigator.onLine === false) netNotice();
})();
