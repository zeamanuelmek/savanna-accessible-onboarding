/*!
 * Dimts (ድምፅ) — accessible, audio-first, one-question-per-screen form engine.
 * Drop-in web component: <script src="dimts.js" defer></script> + <dimts-form form="signup"></dimts-form>
 * No framework, no build step, no paid API. Data stays in the browser unless the host page sends it.
 */
(function () {
  'use strict';

  /* ---------- tiny storage helper (never throws) ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* ---------- learner preferences: saved once, applied everywhere the component is embedded ---------- */
  var MODES = ['read_type', 'listen', 'speak', 'simple'];
  function getPrefs() { var p = store.get('dimts.prefs', {}); return { lang: p.lang || 'am', easy: !!p.easy, mode: p.mode || '', size: p.size || 'normal', contrast: p.contrast || 'normal' }; }
  function applyPrefs() {
    var p = getPrefs(), root = document.documentElement;
    root.setAttribute('data-dm-size', p.size);
    root.setAttribute('data-dm-contrast', p.contrast);
  }
  function setPrefs(patch) {
    var p = getPrefs();
    Object.keys(patch).forEach(function (k) { p[k] = patch[k]; });
    store.set('dimts.prefs', p);
    applyPrefs();
    document.dispatchEvent(new CustomEvent('dimts:prefs', { detail: p }));
    return p;
  }
  // Choosing a way of answering sets sensible defaults; each can still be changed separately in Settings.
  function prefsForMode(mode) {
    var p = getPrefs(), patch = { mode: mode, easy: mode !== 'read_type' };
    if (mode === 'simple' && p.size === 'normal') patch.size = 'large';
    return patch;
  }

  /* ---------- interface strings (Amharic to be reviewed by a native speaker) ---------- */
  var UI = {
    en: {
      back: 'Back', next: 'Continue', submit: 'Submit', listen: 'Listen to the question',
      speak: 'Answer by voice', stop: 'Stop listening', listening: 'Listening… speak now.',
      heard: 'I heard:', yes: "Yes, that's right", again: 'Say it again', type: 'Type it instead',
      progress: 'Question {n} of {total}', optional: '(optional)', problem: 'There is a problem',
      review: 'Check your answers', reviewHint: 'Make sure everything is right before you send it.',
      change: 'Change', notGiven: 'Not given', later: 'Finish later', help: 'Get help',
      helpTitle: 'Need help?', helpClose: 'Close help',
      helpText: 'There is no time limit. Your answers are saved on this phone after every question. You can ask a partner organisation such as AAAPD to fill this in with you, or come back later.',
      easyOn: 'Read aloud: on', easyOff: 'Read aloud: off',
      langSwitch: 'አማርኛ', langSwitchLabel: 'Change language to Amharic',
      resumed: 'Welcome back. We kept your answers.',
      savedTitle: 'Your answers are saved',
      savedText: 'Nothing is lost. Open this link on this phone to continue:',
      smsPreview: 'In the live version we would send you this SMS:',
      voiceConsentTitle: 'Before you use your voice',
      voiceConsent: 'To turn your voice into text, this browser sends your recording to Google. You can type or tap instead. Do you want to use your voice?',
      voiceAllow: 'Yes, use my voice', voiceDeny: 'No, I will type or tap',
      voiceUnsupported: 'Voice answers are not available in this browser. Try Chrome on Android, or type or tap your answer.',
      voiceNoMatch: 'I did not catch one of the choices. Please say it again or tap your answer.',
      voiceError: 'The microphone did not work. Please type or tap your answer.',
      noAmVoice: 'Amharic audio is not installed on this device yet. Recorded Amharic audio will be added.',
      saved: 'Saved.', selected: 'Selected:',
      errRequired: 'Please answer this question to continue.',
      errChoice: 'Choose one answer to continue.',
      errMulti: 'Choose at least one answer.',
      errPhone: 'Enter a phone number with 10 digits, like 0911 234 567.',
      errDate: 'Enter a real date in the Ethiopian calendar. Day 1 to 30, Pagume 1 to 5 or 6.',
      errConsent: 'You need to agree to continue. If you are not sure, choose "Get help".',
      day: 'Day', month: 'Month', year: 'Year (Ethiopian calendar)', chooseMonth: 'Choose a month',
      gregorian: 'In the Gregorian calendar this is {date}.',
      prefilled: 'We filled this in from your profile. You can change it.',
      welcomeTitle: 'How would you like to complete registration?',
      welcomeHint: 'This is only about how you like to use the form. We never ask why. You can change it at any time in Settings.',
      m_read_type: 'Read and type', m_listen: 'Listen and respond', m_speak: 'Speak my answers', m_simple: 'Simple steps with pictures and big text',
      errMode: 'Choose one way to continue.',
      settings: 'Settings', settingsHint: 'Your settings are saved on this phone and used everywhere this tool appears.',
      s_lang: 'Language', s_size: 'Text size', s_contrast: 'Contrast', s_mode: 'How I like to answer', s_read: 'Read everything to me',
      size_normal: 'Normal', size_large: 'Large', size_xlarge: 'Extra large',
      contrast_normal: 'Standard', contrast_high: 'High contrast',
      on: 'On', off: 'Off',
      settingsSaved: 'Saved. This setting now applies everywhere this tool is used on this phone.'
    },
    am: {
      back: 'ተመለስ', next: 'ቀጥል', submit: 'ላክ', listen: 'ጥያቄውን አዳምጥ',
      speak: 'በድምፅ ይመልሱ', stop: 'ማዳመጥ አቁም', listening: 'እያዳመጥኩ ነው… አሁን ይናገሩ።',
      heard: 'የሰማሁት፦', yes: 'አዎ፣ ትክክል ነው', again: 'እንደገና ይናገሩ', type: 'በመጻፍ ይመልሱ',
      progress: 'ጥያቄ {n} ከ{total}', optional: '(አማራጭ)', problem: 'ችግር አለ',
      review: 'መልሶችዎን ያረጋግጡ', reviewHint: 'ከመላክዎ በፊት ሁሉም ትክክል መሆኑን ያረጋግጡ።',
      change: 'ቀይር', notGiven: 'አልተሰጠም', later: 'በኋላ ልጨርስ', help: 'እርዳታ',
      helpTitle: 'እርዳታ ይፈልጋሉ?', helpClose: 'እርዳታውን ዝጋ',
      helpText: 'የጊዜ ገደብ የለም። መልሶችዎ ከእያንዳንዱ ጥያቄ በኋላ በዚህ ስልክ ላይ ይቀመጣሉ። እንደ AAAPD ያለ አጋር ድርጅት አብሮዎት እንዲሞላ መጠየቅ ወይም በኋላ መመለስ ይችላሉ።',
      easyOn: 'አንብብልኝ፦ በርቷል', easyOff: 'አንብብልኝ፦ ጠፍቷል',
      langSwitch: 'English', langSwitchLabel: 'ቋንቋውን ወደ እንግሊዝኛ ቀይር',
      resumed: 'እንኳን ደህና መጡ። መልሶችዎን አስቀምጠናል።',
      savedTitle: 'መልሶችዎ ተቀምጠዋል',
      savedText: 'ምንም አልጠፋም። ለመቀጠል ይህን ሊንክ በዚህ ስልክ ይክፈቱ፦',
      smsPreview: 'በእውነተኛው ስሪት ይህን አጭር መልእክት እንልክልዎታለን፦',
      voiceConsentTitle: 'ድምፅዎን ከመጠቀምዎ በፊት',
      voiceConsent: 'ድምፅዎን ወደ ጽሑፍ ለመቀየር ይህ ብራውዘር ቅጂዎን ወደ Google ይልካል። በምትኩ መጻፍ ወይም መንካት ይችላሉ። ድምፅዎን መጠቀም ይፈልጋሉ?',
      voiceAllow: 'አዎ፣ ድምፄን ተጠቀም', voiceDeny: 'አይ፣ እጽፋለሁ ወይም እነካለሁ',
      voiceUnsupported: 'በዚህ ብራውዘር በድምፅ መመለስ አይቻልም። በአንድሮይድ ላይ Chrome ይሞክሩ ወይም ይጻፉ።',
      voiceNoMatch: 'ከምርጫዎቹ አንዱን አልሰማሁም። እባክዎ እንደገና ይናገሩ ወይም መልስዎን ይንኩ።',
      voiceError: 'ማይክሮፎኑ አልሰራም። እባክዎ ይጻፉ ወይም ይንኩ።',
      noAmVoice: 'የአማርኛ ድምፅ በዚህ ስልክ ላይ ገና አልተጫነም። የተቀዳ የአማርኛ ድምፅ ይጨመራል።',
      saved: 'ተቀምጧል።', selected: 'የተመረጠ፦',
      errRequired: 'ለመቀጠል እባክዎ ይህን ጥያቄ ይመልሱ።',
      errChoice: 'ለመቀጠል አንድ መልስ ይምረጡ።',
      errMulti: 'ቢያንስ አንድ መልስ ይምረጡ።',
      errPhone: 'ባለ 10 አሃዝ ስልክ ቁጥር ያስገቡ፤ ለምሳሌ 0911 234 567።',
      errDate: 'በኢትዮጵያ አቆጣጠር ትክክለኛ ቀን ያስገቡ። ቀን ከ1 እስከ 30፣ ጳጉሜን ከ1 እስከ 5 ወይም 6።',
      errConsent: 'ለመቀጠል መስማማት ያስፈልጋል። እርግጠኛ ካልሆኑ "እርዳታ"ን ይምረጡ።',
      day: 'ቀን', month: 'ወር', year: 'ዓመት (በኢትዮጵያ አቆጣጠር)', chooseMonth: 'ወር ይምረጡ',
      gregorian: 'በፈረንጆች አቆጣጠር {date} ነው።',
      prefilled: 'ይህን ከመገለጫዎ ሞልተነዋል። መቀየር ይችላሉ።',
      welcomeTitle: 'ምዝገባውን እንዴት መሙላት ይፈልጋሉ?',
      welcomeHint: 'ይህ ቅጹን መጠቀም የሚመርጡበትን መንገድ ብቻ ነው። ምክንያቱን በፍጹም አንጠይቅም። በማንኛውም ጊዜ በቅንብሮች ውስጥ መቀየር ይችላሉ።',
      m_read_type: 'አንብቤ እጽፋለሁ', m_listen: 'አዳምጬ እመልሳለሁ', m_speak: 'በድምፅ እመልሳለሁ', m_simple: 'ቀላል ደረጃዎች ከሥዕልና ከትልቅ ጽሑፍ ጋር',
      errMode: 'ለመቀጠል አንድ መንገድ ይምረጡ።',
      settings: 'ቅንብሮች', settingsHint: 'ቅንብሮችዎ በዚህ ስልክ ላይ ይቀመጣሉ፤ ይህ መሣሪያ በሚገኝበት ቦታ ሁሉ ይሠራሉ።',
      s_lang: 'ቋንቋ', s_size: 'የጽሑፍ መጠን', s_contrast: 'ንፅፅር', s_mode: 'መመለስ የምመርጥበት መንገድ', s_read: 'ሁሉንም አንብብልኝ',
      size_normal: 'መደበኛ', size_large: 'ትልቅ', size_xlarge: 'በጣም ትልቅ',
      contrast_normal: 'መደበኛ', contrast_high: 'ከፍተኛ ንፅፅር',
      on: 'በርቷል', off: 'ጠፍቷል',
      settingsSaved: 'ተቀምጧል። ይህ ቅንብር ይህ መሣሪያ በዚህ ስልክ በሚሠራበት ቦታ ሁሉ ይተገበራል።'
    }
  };
  function t(key, lang, vars) {
    var s = (UI[lang] && UI[lang][key]) || UI.en[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }
  function L(v, lang) { if (v == null) return ''; if (typeof v === 'string') return v; return v[lang] || v.en || ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- shared support vocabulary (used by learners AND employers) ---------- */
  var NEEDS = [
    { value: 'screen_reader', icon: '📱', label: { en: 'Works with a screen reader', am: 'ከስክሪን አንባቢ ጋር የሚሰራ' } },
    { value: 'audio', icon: '🔊', label: { en: 'Audio for everything', am: 'ሁሉም ነገር በድምፅ' } },
    { value: 'sign_language', icon: '🤟', label: { en: 'Sign language interpreter', am: 'የምልክት ቋንቋ አስተርጓሚ' } },
    { value: 'captions', icon: '💬', label: { en: 'Captions on videos and calls', am: 'በቪዲዮና በጥሪ ላይ የጽሑፍ ትርጉም' } },
    { value: 'simple_words', icon: '🔤', label: { en: 'Simple words', am: 'ቀላል ቃላት' } },
    { value: 'written', icon: '📝', label: { en: 'Instructions in writing', am: 'በጽሑፍ የተሰጠ መመሪያ' } },
    { value: 'step_free', icon: '♿', label: { en: 'Step-free building access', am: 'ደረጃ የሌለው መግቢያ' } },
    { value: 'extra_time', icon: '⏳', label: { en: 'Extra time for tasks and tests', am: 'ለሥራና ለፈተና ተጨማሪ ጊዜ' } },
    { value: 'flexible_hours', icon: '🕒', label: { en: 'Flexible working hours', am: 'ተለዋዋጭ የሥራ ሰዓት' } },
    { value: 'remote', icon: '🏠', label: { en: 'Work from home', am: 'ከቤት መሥራት' } },
    { value: 'helper', icon: '🤝', label: { en: 'Someone to help with forms', am: 'ቅጽ ለመሙላት የሚረዳ ሰው' } }
  ];

  /* ---------- Ethiopian calendar ---------- */
  var ETH_MONTHS = {
    en: ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miyazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'],
    am: ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን']
  };
  function ethToJdn(y, m, d) { return 1724221 + 365 * (y - 1) + Math.floor(y / 4) + 30 * m + d - 31; }
  function ethToGregorian(y, m, d) { return new Date((ethToJdn(y, m, d) - 2440588) * 86400000); }
  function ethDaysInMonth(y, m) { return m < 13 ? 30 : (y % 4 === 3 ? 6 : 5); }
  function ethValid(y, m, d) {
    return Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d) &&
      y >= 1900 && y <= 2030 && m >= 1 && m <= 13 && d >= 1 && d <= ethDaysInMonth(y, m);
  }
  function fmtGregorian(date, lang) {
    try { return date.toLocaleDateString(lang === 'am' ? 'en-GB' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); }
    catch (e) { return date.toISOString().slice(0, 10); }
  }

  /* ---------- speech: read-aloud ---------- */
  var currentAudio = null;
  function stopSpeaking() {
    try { if (currentAudio) { currentAudio.pause(); currentAudio = null; } } catch (e) {}
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  }
  // Plays a pre-recorded clip if one exists (preferred: works offline, no API), else browser speech.
  // Returns false when no voice for the language is available.
  function speak(text, lang, audioUrl) {
    stopSpeaking();
    if (audioUrl) {
      try { currentAudio = new Audio(audioUrl); currentAudio.play(); return true; } catch (e) {}
    }
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return false;
    var code = lang === 'am' ? 'am' : 'en';
    var voices = window.speechSynthesis.getVoices() || [];
    var voice = voices.filter(function (v) { return (v.lang || '').toLowerCase().indexOf(code) === 0; })[0];
    if (!voice && code === 'am') return false;
    var u = new SpeechSynthesisUtterance(text);
    u.lang = code === 'am' ? 'am-ET' : 'en-US';
    if (voice) u.voice = voice;
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
    return true;
  }

  /* ---------- speech: voice input ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var AM_DIGITS = { 'ዜሮ': '0', 'አንድ': '1', 'ሁለት': '2', 'ሶስት': '3', 'ሦስት': '3', 'አራት': '4', 'አምስት': '5', 'ስድስት': '6', 'ሰባት': '7', 'ስምንት': '8', 'ዘጠኝ': '9' };
  var EN_DIGITS = { zero: '0', oh: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9' };
  function spokenDigits(s) {
    var words = s.toLowerCase().split(/\s+/);
    return words.map(function (w) { return AM_DIGITS[w] || EN_DIGITS[w] || w.replace(/\D/g, ''); }).join('');
  }
  function norm(s) { return String(s || '').toLowerCase().replace(/[.,!?።፣፤"'()]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function matchOptions(transcript, options) {
    var said = norm(transcript), hits = [];
    options.forEach(function (o) {
      var terms = [L(o.label, 'en'), L(o.label, 'am')].concat(o.say || []);
      var hit = terms.some(function (term) {
        var n = norm(term);
        if (!n) return false;
        if (said.indexOf(n) !== -1) return true;
        // keyword match: any significant word of the option label
        return n.split(' ').some(function (w) { return w.length > 3 && said.split(' ').indexOf(w) !== -1; });
      });
      if (hit) hits.push(o.value);
    });
    return hits;
  }

  /* ---------- form registry ---------- */
  var FORMS = {};
  function register(id, config) {
    FORMS[id] = config;
    (typeof PENDING !== 'undefined' ? PENDING : []).slice().forEach(function (el) {
      if (el.getAttribute('form') === id && el.isConnected) { PENDING.splice(PENDING.indexOf(el), 1); el.connectedCallback(); }
    });
  }

  function evalShowIf(cond, answers) {
    if (!cond) return true;
    if (typeof cond === 'function') return !!cond(answers);
    var v = answers[cond.field];
    if (cond.in) return cond.in.indexOf(v) !== -1;
    if (cond.equals !== undefined) return v === cond.equals;
    if (cond.notEmpty) return v != null && v !== '' && !(Array.isArray(v) && !v.length);
    return true;
  }

  /* ---------- styles (injected once; all classes prefixed dm- to avoid clashing with Bootstrap) ---------- */
  var CSS = [
    'dimts-form{display:block;font-family:"Noto Sans Ethiopic","Nyala","Abyssinica SIL",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#0b1a33;line-height:1.5;font-size:1.0625rem}',
    'html[data-dm-size=large] dimts-form,html[data-dm-size=large] dimts-settings{font-size:1.25rem}',
    'html[data-dm-size=xlarge] dimts-form,html[data-dm-size=xlarge] dimts-settings{font-size:1.5rem}',
    'dimts-settings{display:block;font-family:"Noto Sans Ethiopic","Nyala","Abyssinica SIL",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#0b1a33;line-height:1.5;font-size:1.0625rem}',
    'html[data-dm-contrast=high] .dm{color:#000;background:#fff}',
    'html[data-dm-contrast=high] .dm-hint,html[data-dm-contrast=high] .dm-progress{color:#000}',
    'html[data-dm-contrast=high] .dm-opt,html[data-dm-contrast=high] .dm-input,html[data-dm-contrast=high] .dm-btn,html[data-dm-contrast=high] .dm-panel{border-color:#000;border-width:3px}',
    'html[data-dm-contrast=high] .dm-primary{background:#000;border-color:#000;color:#fff}',
    'html[data-dm-contrast=high] .dm-link{color:#000}',
    'html[data-dm-contrast=high] .dm-opt:has(input:checked){background:#fff;border-width:5px;border-color:#000}',
    'html[data-dm-contrast=high] .dm-opt input{accent-color:#000}',
    'html[data-dm-contrast=high] .dm-note{background:#fff;border:3px solid #000}',
    '.dm-voice-first [data-act=speak]{background:#0a3d91;border-color:#0a3d91;color:#fff;order:-1}',
    '.dm-settings fieldset{margin:0 0 1.5em}',
    '.dm-settings legend{font-weight:700;font-size:1.2em;margin-bottom:.4em}',

    '.dm{max-width:40em;margin:0 auto}',
    '.dm *{box-sizing:border-box}',
    '.dm-bar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:.5em;margin-bottom:1em;padding-bottom:.75em;border-bottom:1px solid #e3e8ef}',
    '.dm-bar-r{display:flex;flex-wrap:wrap;gap:.4em;margin-left:auto}',
    '.dm-meter{height:8px;background:#e3e8ef;border-radius:99px;overflow:hidden;margin:.35em 0 1em}',
    '.dm-meter span{display:block;height:100%;background:#0b5c3b;border-radius:99px}',
    'html[data-dm-contrast=high] .dm-meter{background:#fff;border:2px solid #000}',
    'html[data-dm-contrast=high] .dm-meter span{background:#000}',
    '.dm-opt:hover{border-color:#0b1a33}',
    '.dm-btn{transition:background .15s}',
    '.dm button,.dm input,.dm select,.dm textarea{font:inherit}',
    '.dm-btn{min-height:48px;min-width:48px;padding:.6em 1.1em;border-radius:10px;border:2px solid #0b1a33;background:#fff;color:#0b1a33;cursor:pointer;font-weight:600}',
    '.dm-btn:hover{background:#eef2f8}',
    '.dm-primary{background:#0b5c3b;border-color:#0b5c3b;color:#fff}',
    '.dm-primary:hover{background:#08452c}',
    '.dm-small{min-height:44px;padding:.35em .75em;font-size:.9em;border-width:1.5px}',
    '.dm-link{background:none;border:none;color:#0a3d91;text-decoration:underline;text-underline-offset:3px;padding:.5em 0;min-height:44px;cursor:pointer;font-weight:600}',
    '.dm :focus-visible{outline:3px solid #ffbf47;outline-offset:2px;box-shadow:0 0 0 6px #0b1a33}',
    '.dm-progress{color:#3b4a63;margin:0 0 .25em;font-size:.95em}',
    '.dm-q{font-size:1.6em;line-height:1.3;margin:.25em 0 .5em;font-weight:700}',
    '.dm-q:focus,.dm-q:focus-visible{outline:none;box-shadow:none}',
    '.dm-q label{display:block}',
    '.dm-hint{color:#3b4a63;margin:0 0 1em}',
    '.dm fieldset{border:none;padding:0;margin:0;min-width:0}',
    '.dm legend{padding:0}',
    '.dm-input{width:100%;min-height:52px;padding:.6em .8em;border:2px solid #0b1a33;border-radius:8px;background:#fff;color:#0b1a33;font-size:1.15em}',
    '.dm textarea.dm-input{min-height:8em}',
    '.dm-input[aria-invalid=true]{border-color:#b3261e;border-width:3px}',
    '.dm-opts{display:grid;gap:.6em;margin:0 0 1em;padding:0;list-style:none}',
    '.dm-opt{display:flex;align-items:center;gap:.75em;min-height:56px;padding:.6em .9em;border:2px solid #9aa6b8;border-radius:10px;background:#fff;cursor:pointer}',
    '.dm-opt:has(input:checked){border-color:#0b5c3b;background:#e8f4ee;border-width:3px}',
    '.dm-opt input{width:1.6em;height:1.6em;flex:none;accent-color:#0b5c3b}',
    '.dm-ico{font-size:1.6em;flex:none}',
    '.dm-opt>span:last-child{min-width:0;overflow-wrap:anywhere}',
    '.dm-opt{max-width:100%}',
    '.dm-tools{display:flex;flex-wrap:wrap;gap:.6em;margin:1em 0}',
    '.dm-heard{border:2px solid #0a3d91;background:#eef4ff;border-radius:10px;padding:.9em;margin:1em 0}',
    '.dm-heard p{margin:0 0 .6em}',
    '.dm-heard q{font-weight:700;font-size:1.15em}',
    '.dm-status{min-height:1.5em;margin:.5em 0;color:#0a3d91;font-weight:600}',
    '.dm-actions{display:flex;flex-wrap:wrap;gap:.75em;margin-top:1.25em;align-items:center}',
    '.dm-errors{border:4px solid #b3261e;padding:1em;margin:0 0 1em;border-radius:8px;background:#fff}',
    '.dm-errors h2{margin:0 0 .5em;font-size:1.25em}',
    '.dm-errors ul{margin:0;padding-left:1.2em}',
    '.dm-errors a{color:#b3261e;font-weight:700}',
    '.dm-err{display:block;color:#b3261e;font-weight:700;margin:.25em 0 .5em}',
    '.dm-date{display:flex;flex-wrap:wrap;gap:.75em}',
    '.dm-date div{display:flex;flex-direction:column}',
    '.dm-date label{font-weight:600}',
    '.dm-date .dm-input{width:auto}',
    '.dm-panel{border:2px solid #0b1a33;border-radius:10px;padding:1em;margin:1em 0;background:#fffdf5}',
    '.dm-panel h2{margin:0 0 .5em;font-size:1.2em}',
    '.dm-review{margin:0 0 1em;padding:0}',
    '.dm-review div{display:grid;grid-template-columns:1fr;gap:.15em;padding:.75em 0;border-bottom:1px solid #c5cdd9}',
    '.dm-review dt{font-weight:700}',
    '.dm-review dd{margin:0}',
    '.dm-note{background:#f3f5f9;border-left:6px solid #0b5c3b;padding:.75em 1em;margin:1em 0}',
    '.dm-vh{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '.dm-easy .dm-q{font-size:1.9em}',
    '.dm-easy .dm-ico{font-size:2.2em}',
    '.dm-easy .dm-opt{min-height:68px;font-size:1.2em}',
    '@media (prefers-reduced-motion:reduce){.dm *{transition:none!important;animation:none!important}}'
  ].join('\n');
  function injectCss() {
    if (document.getElementById('dimts-styles')) return;
    var s = document.createElement('style'); s.id = 'dimts-styles'; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ---------- the web component ---------- */
  class DimtsForm extends HTMLElement {}
  var PENDING = [];

  DimtsForm.prototype.connectedCallback = function () {
    if (this._ready) return;
    injectCss();
    var id = this.getAttribute('form');
    this.cfg = FORMS[id];
    // Form config may be registered after the element appears: wait for it.
    if (!this.cfg) { if (PENDING.indexOf(this) === -1) PENDING.push(this); return; }
    this._ready = true;
    applyPrefs();
    var prefs = getPrefs();
    this.lang = this.getAttribute('lang') || prefs.lang;
    this.easy = prefs.easy;
    this.draftKey = 'dimts.draft.' + id + (this.getAttribute('instance') ? '.' + this.getAttribute('instance') : '');
    var draft = store.get(this.draftKey, null);
    this.answers = (draft && draft.answers) || {};
    this.step = (draft && draft.step) || 0;
    this.mode = 'question';
    this.returnToReview = false;
    this.flash = draft && Object.keys(this.answers).length ? t('resumed', this.lang) : '';
    this.applyPrefill();
    this.addEventListener('click', this.onClick.bind(this));
    this.addEventListener('submit', this.onSubmit.bind(this));
    this.addEventListener('change', this.onChange.bind(this));
    // A welcome screen lets the learner choose how to answer before the first question.
    this.welcomeOn = !!(this.cfg.welcome || this.hasAttribute('welcome'));
    if (this.welcomeOn && !Object.keys(this.answers).length) this.mode = 'welcome';
    var self = this;
    this._onPrefs = function (e) {
      if (self._selfPrefs) return;
      self.lang = e.detail.lang; self.easy = e.detail.easy;
      if (self.mode !== 'done') { if (self.mode === 'question') self.collect(); self.render(false); }
    };
    document.addEventListener('dimts:prefs', this._onPrefs);
    this.render(false);
  };
  DimtsForm.prototype.disconnectedCallback = function () { document.removeEventListener('dimts:prefs', this._onPrefs); this._ready = false; stopSpeaking(); if (this.rec) try { this.rec.abort(); } catch (e) {} };

  DimtsForm.prototype.applyPrefill = function () {
    var ctx = { profile: store.get('dimts.profile', {}), passport: store.get('dimts.passport', {}) };
    var self = this;
    this.prefilled = {};
    this.cfg.fields.forEach(function (f) {
      if (!f.prefill) return;
      var src = ctx[f.prefill.from] || {};
      var v = src[f.prefill.key];
      if ((self.answers[f.id] === undefined || self.answers[f.id] === '') && v !== undefined && v !== '') {
        self.answers[f.id] = v; self.prefilled[f.id] = true;
      }
    });
  };

  DimtsForm.prototype.visible = function () {
    var a = this.answers;
    return this.cfg.fields.filter(function (f) { return evalShowIf(f.showIf, a); });
  };
  DimtsForm.prototype.field = function () {
    var vis = this.visible();
    if (this.step >= vis.length) this.step = vis.length - 1;
    if (this.step < 0) this.step = 0;
    return vis[this.step];
  };
  DimtsForm.prototype.save = function () { store.set(this.draftKey, { answers: this.answers, step: this.step, mode: this.mode, at: Date.now() }); };
  DimtsForm.prototype.savePrefs = function (extra) {
    var patch = { lang: this.lang, easy: this.easy };
    if (extra) Object.keys(extra).forEach(function (k) { patch[k] = extra[k]; });
    this._selfPrefs = true; setPrefs(patch); this._selfPrefs = false;
  };

  /* --- rendering --- */
  DimtsForm.prototype.bar = function (showBack) {
    var lang = this.lang;
    return '<div class="dm-bar">' +
      '<div>' + (showBack ? '<button type="button" class="dm-link" data-act="back">← ' + t('back', lang) + '</button>' : '') + '</div>' +
      '<div class="dm-bar-r">' +
      '<button type="button" class="dm-btn dm-small" data-act="lang" lang="' + (lang === 'am' ? 'en' : 'am') + '">' + t('langSwitch', lang) + '</button>' +
      '<button type="button" class="dm-btn dm-small" data-act="easy" aria-pressed="' + this.easy + '">🔊 ' + t(this.easy ? 'easyOn' : 'easyOff', lang) + '</button>' +
      '<button type="button" class="dm-btn dm-small" data-act="help" aria-expanded="' + !!this.helpOpen + '" aria-controls="dm-help">' + t('help', lang) + '</button>' +
      '</div></div>' +
      '<div id="dm-help" class="dm-panel"' + (this.helpOpen ? '' : ' hidden') + '><h2>' + t('helpTitle', lang) + '</h2><p>' + esc(L(this.cfg.help, lang) || t('helpText', lang)) + '</p>' +
      '<button type="button" class="dm-btn dm-small" data-act="help">' + t('helpClose', lang) + '</button></div>';
  };

  DimtsForm.prototype.render = function (moveFocus) {
    var lang = this.lang;
    this.className = '';
    var html = '<div class="dm' + (this.easy ? ' dm-easy' : '') + (getPrefs().mode === 'speak' ? ' dm-voice-first' : '') + '" lang="' + lang + '">';
    if (this.mode === 'welcome') html += this.renderWelcome();
    else if (this.mode === 'question') html += this.renderQuestion();
    else if (this.mode === 'review') html += this.renderReview();
    else if (this.mode === 'saved') html += this.renderSaved();
    else if (this.mode === 'done') html += this.renderDone();
    html += '</div>';
    this.innerHTML = html;
    if (moveFocus !== false || this.flash) {
      var target = this.querySelector('.dm-errors') || this.querySelector('.dm-q');
      if (target && moveFocus !== false) target.focus();
    }
    if ((this.mode === 'question' || this.mode === 'welcome') && this.easy && this._interacted) this.readQuestion();
  };

  var MODE_ICONS = { read_type: '⌨️', listen: '🎧', speak: '🎤', simple: '🖼️' };
  DimtsForm.prototype.renderWelcome = function () {
    var lang = this.lang, cur = getPrefs().mode, err = this.error;
    var h = this.bar(false);
    if (err) h += '<div class="dm-errors" role="alert" tabindex="-1"><h2>' + t('problem', lang) + '</h2><ul><li><a href="#dm-input" data-act="focus-input">' + esc(err) + '</a></li></ul></div>';
    h += '<form class="dm-form" novalidate><fieldset aria-describedby="dm-hint' + (err ? ' dm-err' : '') + '"><legend><h1 class="dm-q" tabindex="-1">' + t('welcomeTitle', lang) + '</h1></legend>' +
      '<p id="dm-hint" class="dm-hint">' + t('welcomeHint', lang) + '</p>' +
      (err ? '<span id="dm-err" class="dm-err"><span class="dm-vh">Error: </span>' + esc(err) + '</span>' : '') +
      '<div class="dm-opts">' + MODES.map(function (m, i) {
        return '<label class="dm-opt"><input' + (i === 0 ? ' id="dm-input"' : '') + ' type="radio" name="mode" value="' + m + '"' + (cur === m ? ' checked' : '') + '>' +
          '<span class="dm-ico" aria-hidden="true">' + MODE_ICONS[m] + '</span><span>' + t('m_' + m, lang) + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<div class="dm-tools"><button type="button" class="dm-btn" data-act="listen">🔊 ' + t('listen', lang) + '</button></div>' +
      '<p class="dm-status" role="status" aria-live="polite">' + esc(this.flash || '') + '</p>' +
      '<div class="dm-actions"><button type="submit" class="dm-btn dm-primary">' + t('next', lang) + '</button></div></form>';
    this.flash = '';
    return h;
  };

  DimtsForm.prototype.renderQuestion = function () {
    var f = this.field(), lang = this.lang, vis = this.visible(), v = this.answers[f.id];
    var label = L(f.label, lang), hint = L(f.hint, lang);
    var describedBy = [hint ? 'dm-hint' : '', this.error ? 'dm-err' : '', this.prefilled[f.id] ? 'dm-pre' : ''].filter(Boolean).join(' ');
    var opt = f.optional ? ' <span class="dm-opt-tag">' + t('optional', lang) + '</span>' : '';
    var err = this.error ? '<span id="dm-err" class="dm-err"><span class="dm-vh">Error: </span>' + esc(this.error) + '</span>' : '';
    var h = this.bar(this.step > 0 || this.returnToReview || !!this.welcomeOn);
    h += '<p class="dm-progress">' + t('progress', lang, { n: this.step + 1, total: vis.length }) + '</p>';
    h += '<div class="dm-meter" aria-hidden="true"><span style="width:' + Math.round((this.step + 1) / vis.length * 100) + '%"></span></div>';
    if (this.error) h += '<div class="dm-errors" role="alert" tabindex="-1"><h2>' + t('problem', lang) + '</h2><ul><li><a href="#dm-input" data-act="focus-input">' + esc(this.error) + '</a></li></ul></div>';
    h += '<form class="dm-form" novalidate>';
    var isGroup = f.type === 'choice' || f.type === 'multi' || f.type === 'consent' || f.type === 'ethdate';
    if (isGroup) {
      h += '<fieldset' + (describedBy ? ' aria-describedby="' + describedBy + '"' : '') + '><legend><h1 class="dm-q" tabindex="-1">' + esc(label) + opt + '</h1></legend>';
    } else {
      h += '<h1 class="dm-q" tabindex="-1"><label for="dm-input">' + esc(label) + opt + '</label></h1>';
    }
    if (f.body) h += '<div class="dm-note">' + esc(L(f.body, lang)) + '</div>';
    if (hint) h += '<p id="dm-hint" class="dm-hint">' + esc(hint) + '</p>';
    if (this.prefilled[f.id]) h += '<p id="dm-pre" class="dm-hint">' + t('prefilled', lang) + '</p>';
    h += err;
    h += this.renderInput(f, v, describedBy);
    if (isGroup) h += '</fieldset>';
    h += '<div class="dm-tools"><button type="button" class="dm-btn" data-act="listen">🔊 ' + t('listen', lang) + '</button>';
    if (f.voice !== false && f.type !== 'ethdate') h += '<button type="button" class="dm-btn" data-act="speak" aria-pressed="false">🎤 ' + t('speak', lang) + '</button>';
    h += '</div>';
    h += '<div id="dm-heard"></div>';
    h += '<p class="dm-status" role="status" aria-live="polite">' + esc(this.flash || '') + '</p>';
    h += '<div class="dm-actions"><button type="submit" class="dm-btn dm-primary">' + t('next', lang) + '</button>';
    if (this.cfg.allowLater !== false) h += '<button type="button" class="dm-link" data-act="later">' + t('later', lang) + '</button>';
    h += '</div></form>';
    this.flash = '';
    return h;
  };

  DimtsForm.prototype.renderInput = function (f, v, describedBy) {
    var lang = this.lang, aria = (describedBy && f.type !== 'choice' && f.type !== 'multi' && f.type !== 'consent' && f.type !== 'ethdate') ? ' aria-describedby="' + describedBy + '"' : '';
    var inv = this.error ? ' aria-invalid="true"' : '';
    if (f.type === 'text' || f.type === 'tel' || f.type === 'email') {
      return '<input id="dm-input" class="dm-input" name="v" type="' + (f.type === 'tel' ? 'tel' : f.type === 'email' ? 'email' : 'text') + '"' +
        (f.type === 'tel' ? ' inputmode="tel"' : '') + (f.autocomplete ? ' autocomplete="' + f.autocomplete + '"' : '') +
        ' value="' + esc(v || '') + '"' + aria + inv + '>';
    }
    if (f.type === 'textarea') return '<textarea id="dm-input" class="dm-input" name="v"' + aria + inv + '>' + esc(v || '') + '</textarea>';
    if (f.type === 'choice' || f.type === 'consent' || f.type === 'multi') {
      var multi = f.type === 'multi', sel = multi ? (v || []) : [v];
      var opts = f.options === 'NEEDS' ? NEEDS : f.options;
      return '<div class="dm-opts">' + opts.map(function (o, i) {
        var checked = sel.indexOf(o.value) !== -1 ? ' checked' : '';
        return '<label class="dm-opt"><input' + (i === 0 ? ' id="dm-input"' : '') + ' type="' + (multi ? 'checkbox' : 'radio') + '" name="v" value="' + esc(o.value) + '"' + checked + '>' +
          (o.icon ? '<span class="dm-ico" aria-hidden="true">' + o.icon + '</span>' : '') + '<span>' + esc(L(o.label, lang)) + '</span></label>';
      }).join('') + '</div>';
    }
    if (f.type === 'ethdate') {
      var d = v || {};
      var months = ETH_MONTHS[lang] || ETH_MONTHS.en;
      return '<div class="dm-date">' +
        '<div><label for="dm-input">' + t('day', lang) + '</label><input id="dm-input" class="dm-input" name="d" inputmode="numeric" size="3" value="' + esc(d.d || '') + '"' + inv + '></div>' +
        '<div><label for="dm-m">' + t('month', lang) + '</label><select id="dm-m" class="dm-input" name="m"' + inv + '><option value="">' + t('chooseMonth', lang) + '</option>' +
        months.map(function (m, i) { return '<option value="' + (i + 1) + '"' + (Number(d.m) === i + 1 ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></div>' +
        '<div><label for="dm-y">' + t('year', lang) + '</label><input id="dm-y" class="dm-input" name="y" inputmode="numeric" size="5" value="' + esc(d.y || '') + '"' + inv + '></div>' +
        '</div>' + (d.gregorian ? '<p class="dm-hint">' + t('gregorian', lang, { date: fmtGregorian(new Date(d.gregorian), lang) }) + '</p>' : '');
    }
    return '';
  };

  DimtsForm.prototype.display = function (f, v) {
    var lang = this.lang;
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return t('notGiven', lang);
    var opts = f.options === 'NEEDS' ? NEEDS : f.options;
    if (f.type === 'choice' || f.type === 'consent') { var o = opts.filter(function (x) { return x.value === v; })[0]; return o ? L(o.label, lang) : v; }
    if (f.type === 'multi') return v.map(function (x) { var o = opts.filter(function (y) { return y.value === x; })[0]; return o ? L(o.label, lang) : x; }).join(', ');
    if (f.type === 'ethdate') return v.d + ' ' + (ETH_MONTHS[lang] || ETH_MONTHS.en)[v.m - 1] + ' ' + v.y + ' (' + fmtGregorian(new Date(v.gregorian), lang) + ')';
    return String(v);
  };

  DimtsForm.prototype.renderReview = function () {
    var lang = this.lang, self = this;
    var h = this.bar(true) + '<form class="dm-form" novalidate><h1 class="dm-q" tabindex="-1">' + t('review', lang) + '</h1><p class="dm-hint">' + t('reviewHint', lang) + '</p><dl class="dm-review">';
    this.visible().forEach(function (f, i) {
      if (f.reviewHide) return;
      h += '<div><dt>' + esc(L(f.reviewLabel || f.label, lang)) + '</dt><dd>' + esc(self.display(f, self.answers[f.id])) + '</dd>' +
        '<dd><button type="button" class="dm-link" data-act="change" data-step="' + i + '">' + t('change', lang) + '<span class="dm-vh"> ' + esc(L(f.reviewLabel || f.label, lang)) + '</span></button></dd></div>';
    });
    h += '</dl>';
    if (this.cfg.reviewNote) h += '<div class="dm-note">' + esc(L(this.cfg.reviewNote, lang)) + '</div>';
    h += '<p class="dm-status" role="status" aria-live="polite"></p><div class="dm-actions"><button type="submit" class="dm-btn dm-primary">' + esc(L(this.cfg.submitLabel, lang) || t('submit', lang)) + '</button></div></form>';
    return h;
  };

  DimtsForm.prototype.renderSaved = function () {
    var lang = this.lang;
    var link = location.href.split('#')[0].split('?')[0] + '?resume=' + this.resumeCode + location.hash;
    var sms = lang === 'am' ? 'ምዝገባዎን ለመቀጠል፦ ' + link : 'Continue your form: ' + link;
    return this.bar(false) + '<h1 class="dm-q" tabindex="-1">' + t('savedTitle', lang) + '</h1><p>' + t('savedText', lang) + '</p>' +
      '<p><a href="' + esc(link) + '">' + esc(link) + '</a></p>' +
      '<div class="dm-panel"><h2>' + t('smsPreview', lang) + '</h2><p lang="' + lang + '"><samp>' + esc(sms) + '</samp></p></div>' +
      '<div class="dm-actions"><button type="button" class="dm-btn dm-primary" data-act="resume">' + t('next', lang) + '</button></div>';
  };

  DimtsForm.prototype.renderDone = function () {
    var lang = this.lang;
    return '<h1 class="dm-q" tabindex="-1">' + esc(L(this.cfg.doneTitle, lang) || '✓') + '</h1><p>' + esc(L(this.cfg.doneText, lang)) + '</p><div class="dm-done-slot"></div>';
  };

  /* --- reading the current value out of the DOM --- */
  DimtsForm.prototype.collect = function () {
    if (this.mode !== 'question') return;
    var f = this.field(), form = this.querySelector('.dm-form');
    if (!form) return;
    if (f.type === 'multi') this.answers[f.id] = Array.prototype.map.call(form.querySelectorAll('input[name=v]:checked'), function (i) { return i.value; });
    else if (f.type === 'choice' || f.type === 'consent') { var c = form.querySelector('input[name=v]:checked'); this.answers[f.id] = c ? c.value : ''; }
    else if (f.type === 'ethdate') {
      var d = parseInt(form.d.value, 10), m = parseInt(form.m.value, 10), y = parseInt(form.y.value, 10);
      var val = { d: form.d.value.trim(), m: form.m.value, y: form.y.value.trim() };
      if (ethValid(y, m, d)) { val = { d: d, m: m, y: y, gregorian: ethToGregorian(y, m, d).toISOString().slice(0, 10) }; }
      this.answers[f.id] = (val.d || val.m || val.y) ? val : '';
    } else { var inp = form.querySelector('#dm-input'); this.answers[f.id] = inp ? inp.value.trim() : ''; }
    if (this.answers[f.id] !== undefined) delete this.prefilled[f.id];
  };

  DimtsForm.prototype.validate = function (f, v) {
    var lang = this.lang, empty = v == null || v === '' || (Array.isArray(v) && !v.length);
    if (empty) {
      if (f.optional) return '';
      return f.type === 'choice' ? t('errChoice', lang) : f.type === 'multi' ? t('errMulti', lang) : f.type === 'consent' ? t('errConsent', lang) : t('errRequired', lang);
    }
    if (f.type === 'tel') { var digits = String(v).replace(/\D/g, ''); if (digits.indexOf('251') === 0) digits = '0' + digits.slice(3); if (digits.length !== 10) return t('errPhone', lang); }
    if (f.type === 'ethdate' && !v.gregorian) return t('errDate', lang);
    if (f.type === 'consent' && f.requiredValue && v !== f.requiredValue) return t('errConsent', lang);
    if (f.validate) { var msg = f.validate(v, this.answers); if (msg) return L(msg, lang); }
    return '';
  };

  /* --- events --- */
  DimtsForm.prototype.onSubmit = function (e) {
    e.preventDefault();
    this._interacted = true;
    stopSpeaking();
    if (this.mode === 'review') return this.finish();
    if (this.mode === 'welcome') {
      var c = this.querySelector('input[name=mode]:checked');
      if (!c) { this.error = t('errMode', this.lang); this.render(true); return; }
      this.error = '';
      var patch = prefsForMode(c.value); this.easy = patch.easy;
      this.savePrefs(patch);
      this.mode = 'question'; this.render(true); return;
    }
    if (this.mode !== 'question') return;
    this.collect();
    var f = this.field();
    this.error = this.validate(f, this.answers[f.id]);
    if (this.error) { this.render(true); return; }
    var vis = this.visible();
    if (this.returnToReview || this.step >= vis.length - 1) { this.mode = 'review'; this.returnToReview = false; }
    else this.step++;
    this.save();
    this.render(true);
  };

  DimtsForm.prototype.onChange = function (e) {
    var f = this.mode === 'question' && this.field();
    if (!f) return;
    if (f.type === 'ethdate') {
      this.collect();
      var v = this.answers[f.id];
      var st = this.querySelector('.dm-status');
      if (st) st.textContent = v && v.gregorian ? t('gregorian', this.lang, { date: fmtGregorian(new Date(v.gregorian), this.lang) }) : '';
    }
    if (this.easy && (f.type === 'choice' || f.type === 'multi' || f.type === 'consent') && e.target.closest) {
      var lab = e.target.closest('.dm-opt');
      if (lab && e.target.checked) speak(lab.textContent.trim(), this.lang);
    }
  };

  DimtsForm.prototype.onClick = function (e) {
    var b = e.target.closest('[data-act]');
    if (!b || !this.contains(b)) return;
    this._interacted = true;
    var act = b.getAttribute('data-act');
    if (act === 'focus-input') { e.preventDefault(); var i = this.querySelector('#dm-input'); if (i) i.focus(); return; }
    if (act === 'back') {
      stopSpeaking(); this.error = '';
      if (this.mode === 'review') { this.mode = 'question'; this.step = this.visible().length - 1; }
      else if (this.returnToReview) { this.mode = 'review'; this.returnToReview = false; }
      else if (this.step > 0) { this.collect(); this.step--; }
      else if (this.welcomeOn && this.mode === 'question') { this.collect(); this.mode = 'welcome'; }
      this.save(); this.render(true); return;
    }
    if (act === 'lang') {
      if (this.mode === 'question') this.collect();
      this.lang = this.lang === 'am' ? 'en' : 'am'; this.error = ''; this.savePrefs(); this.render(true); return;
    }
    if (act === 'easy') {
      if (this.mode === 'question') this.collect();
      this.easy = !this.easy; this.savePrefs(); stopSpeaking(); this.render(false);
      var eb = this.querySelector('[data-act=easy]'); if (eb) eb.focus();
      return;
    }
    if (act === 'help') {
      if (this.mode === 'question') this.collect();
      this.helpOpen = !this.helpOpen; this.render(false);
      var target = this.helpOpen ? this.querySelector('#dm-help h2') : this.querySelector('[data-act=help]');
      if (target) { if (this.helpOpen) target.setAttribute('tabindex', '-1'); target.focus(); }
      return;
    }
    if (act === 'listen') { this.readQuestion(); return; }
    if (act === 'speak') { this.startVoice(); return; }
    if (act === 'change') { this.mode = 'question'; this.step = parseInt(b.getAttribute('data-step'), 10); this.returnToReview = true; this.render(true); return; }
    if (act === 'later') {
      this.collect(); this.save();
      this.resumeCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      store.set('dimts.resume.' + this.resumeCode, this.draftKey);
      this.mode = 'saved'; this.render(true); return;
    }
    if (act === 'resume') { this.mode = 'question'; this.render(true); return; }
    if (act === 'voice-allow') { store.set('dimts.voiceConsent', true); this.startVoice(); return; }
    if (act === 'voice-deny') { store.set('dimts.voiceConsent', false); this.setHeard(''); var inp = this.querySelector('#dm-input'); if (inp) inp.focus(); return; }
    if (act === 'heard-yes') { this.setHeard(''); this.status(t('saved', this.lang)); var nb = this.querySelector('.dm-primary'); if (nb) nb.focus(); return; }
    if (act === 'heard-again') { this.setHeard(''); this.startVoice(); return; }
    if (act === 'heard-type') { this.setHeard(''); var ti = this.querySelector('#dm-input'); if (ti) { ti.focus(); if (ti.select) ti.select(); } return; }
  };

  DimtsForm.prototype.status = function (msg) { var s = this.querySelector('.dm-status'); if (s) { s.textContent = ''; setTimeout(function () { s.textContent = msg; }, 50); } };
  DimtsForm.prototype.setHeard = function (html) { var h = this.querySelector('#dm-heard'); if (h) h.innerHTML = html; };

  DimtsForm.prototype.readQuestion = function () {
    var lang = this.lang, text, audio;
    if (this.mode === 'question') {
      var f = this.field();
      text = L(f.label, lang) + '. ' + (f.body ? L(f.body, lang) + '. ' : '') + (f.hint ? L(f.hint, lang) + '. ' : '');
      var opts = f.options === 'NEEDS' ? NEEDS : f.options;
      if (opts && opts.map) text += opts.map(function (o) { return L(o.label, lang); }).join('. ');
      audio = f.audio && f.audio[lang];
    } else if (this.mode === 'welcome') {
      text = t('welcomeTitle', lang) + '. ' + t('welcomeHint', lang) + '. ' + MODES.map(function (m) { return t('m_' + m, lang); }).join('. ');
    } else {
      var q = this.querySelector('.dm-q'); text = q ? q.textContent : '';
    }
    if (!speak(text, lang, audio)) this.status(t('noAmVoice', lang));
  };

  DimtsForm.prototype.startVoice = function () {
    var lang = this.lang, self = this, f = this.field();
    if (!SR) { this.status(t('voiceUnsupported', lang)); return; }
    if (store.get('dimts.voiceConsent', null) !== true) {
      this.setHeard('<div class="dm-panel" role="group" aria-labelledby="dm-vc"><h2 id="dm-vc" tabindex="-1">' + t('voiceConsentTitle', lang) + '</h2><p>' + t('voiceConsent', lang) + '</p>' +
        '<div class="dm-actions"><button type="button" class="dm-btn dm-primary" data-act="voice-allow">' + t('voiceAllow', lang) + '</button><button type="button" class="dm-btn" data-act="voice-deny">' + t('voiceDeny', lang) + '</button></div></div>');
      var h = this.querySelector('#dm-vc'); if (h) h.focus();
      return;
    }
    if (this.rec) { try { this.rec.stop(); } catch (e) {} this.rec = null; return; }
    stopSpeaking();
    this.collect();
    var rec = new SR();
    rec.lang = lang === 'am' ? 'am-ET' : 'en-US';
    rec.interimResults = false; rec.maxAlternatives = 3; rec.continuous = false;
    var btn = this.querySelector('[data-act=speak]');
    if (btn) { btn.setAttribute('aria-pressed', 'true'); btn.textContent = '⏹ ' + t('stop', lang); }
    this.status(t('listening', lang));
    rec.onresult = function (ev) {
      var alts = []; var r = ev.results[0];
      for (var i = 0; i < r.length; i++) alts.push(r[i].transcript);
      self.handleTranscript(f, alts);
    };
    rec.onerror = function (ev) { self.status(ev.error === 'no-speech' ? t('voiceNoMatch', lang) : t('voiceError', lang)); };
    rec.onend = function () { self.rec = null; var b = self.querySelector('[data-act=speak]'); if (b) { b.setAttribute('aria-pressed', 'false'); b.textContent = '🎤 ' + t('speak', lang); } };
    this.rec = rec;
    try { rec.start(); } catch (e) { this.rec = null; this.status(t('voiceError', lang)); }
  };

  DimtsForm.prototype.handleTranscript = function (f, alts) {
    var lang = this.lang, said = alts[0] || '', shown = said;
    var form = this.querySelector('.dm-form');
    if (f.type === 'choice' || f.type === 'consent' || f.type === 'multi') {
      var opts = f.options === 'NEEDS' ? NEEDS : f.options, hits = [];
      for (var i = 0; i < alts.length && !hits.length; i++) hits = matchOptions(alts[i], opts);
      if (!hits.length) { this.status(t('voiceNoMatch', lang)); return; }
      if (f.type !== 'multi') hits = [hits[0]];
      hits.forEach(function (val) { var inp = form.querySelector('input[name=v][value="' + val + '"]'); if (inp) inp.checked = true; });
      shown = hits.map(function (val) { var o = opts.filter(function (x) { return x.value === val; })[0]; return o ? L(o.label, lang) : val; }).join(', ');
    } else {
      var val = f.type === 'tel' ? spokenDigits(said) : said;
      var inp = form.querySelector('#dm-input');
      if (inp) inp.value = val;
      shown = val;
    }
    this.collect(); this.save();
    var others = f.type === 'text' || f.type === 'textarea' ? alts.slice(1).filter(function (a) { return a && a !== said; }) : [];
    this.setHeard('<div class="dm-heard" role="group" aria-labelledby="dm-heard-h"><p id="dm-heard-h" tabindex="-1">' + t('heard', lang) + ' <q>' + esc(shown) + '</q></p>' +
      '<div class="dm-actions"><button type="button" class="dm-btn dm-primary" data-act="heard-yes">' + t('yes', lang) + '</button>' +
      '<button type="button" class="dm-btn" data-act="heard-again">' + t('again', lang) + '</button>' +
      '<button type="button" class="dm-btn" data-act="heard-type">' + t('type', lang) + '</button></div>' +
      (others.length ? '<p class="dm-hint">' + others.map(esc).join(' · ') + '</p>' : '') + '</div>');
    var hh = this.querySelector('#dm-heard-h'); if (hh) hh.focus();
    speak(t('heard', lang) + ' ' + shown, lang);
  };

  DimtsForm.prototype.finish = function () {
    var detail = { form: this.getAttribute('form'), instance: this.getAttribute('instance') || null, lang: this.lang, answers: JSON.parse(JSON.stringify(this.answers)) };
    var self = this;
    // keep only answers for questions that were actually shown (minimum data)
    var shown = {}; this.visible().forEach(function (f) { if (self.answers[f.id] !== undefined) shown[f.id] = self.answers[f.id]; });
    detail.answers = shown;
    store.del(this.draftKey);
    this.mode = 'done';
    this.render(true);
    this.dispatchEvent(new CustomEvent('dimts:complete', { bubbles: true, detail: detail }));
  };

  if (!customElements.get('dimts-form')) customElements.define('dimts-form', DimtsForm);

  /* ---------- <dimts-settings>: one place to change preferences; changes apply everywhere at once ---------- */
  class DimtsSettings extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      injectCss(); applyPrefs();
      var self = this;
      this.addEventListener('change', function (e) {
        var n = e.target.name, v = e.target.value, patch = {};
        if (n === 'mode') patch = prefsForMode(v);
        else if (n === 'easy') patch.easy = v === 'on';
        else patch[n] = v;
        self._selfPrefs = true; setPrefs(patch); self._selfPrefs = false;
        var keep = n + '=' + (n === 'mode' ? v : patch[n] === true ? 'on' : patch[n] === false ? 'off' : v);
        self.render();
        var el = self.querySelector('input[name="' + n + '"][value="' + keep.split('=')[1] + '"]') || self.querySelector('input[name="' + n + '"]:checked');
        if (el) el.focus();
        var s = self.querySelector('.dm-status');
        if (s) setTimeout(function () { s.textContent = t('settingsSaved', getPrefs().lang); }, 50);
      });
      this._onPrefs = function () { if (!self._selfPrefs) self.render(); };
      document.addEventListener('dimts:prefs', this._onPrefs);
      this.render();
    }
    disconnectedCallback() { document.removeEventListener('dimts:prefs', this._onPrefs); this._ready = false; }
    render() {
      var p = getPrefs(), lang = p.lang;
      function group(name, legend, options, current) {
        return '<fieldset><legend>' + legend + '</legend><div class="dm-opts">' + options.map(function (o) {
          return '<label class="dm-opt"><input type="radio" name="' + name + '" value="' + o[0] + '"' + (current === o[0] ? ' checked' : '') + (o[2] ? ' lang="' + o[2] + '"' : '') + '>' +
            (o[3] ? '<span class="dm-ico" aria-hidden="true">' + o[3] + '</span>' : '') + '<span' + (o[2] ? ' lang="' + o[2] + '"' : '') + '>' + o[1] + '</span></label>';
        }).join('') + '</div></fieldset>';
      }
      this.innerHTML = '<div class="dm dm-settings" lang="' + lang + '"><h1 class="dm-q" tabindex="-1">' + t('settings', lang) + '</h1><p class="dm-hint">' + t('settingsHint', lang) + '</p><form class="dm-form" novalidate>' +
        group('lang', t('s_lang', lang), [['am', 'አማርኛ', 'am'], ['en', 'English', 'en']], p.lang) +
        group('size', t('s_size', lang), [['normal', t('size_normal', lang)], ['large', t('size_large', lang)], ['xlarge', t('size_xlarge', lang)]], p.size) +
        group('contrast', t('s_contrast', lang), [['normal', t('contrast_normal', lang)], ['high', t('contrast_high', lang)]], p.contrast) +
        group('mode', t('s_mode', lang), MODES.map(function (m) { return [m, t('m_' + m, lang), null, MODE_ICONS[m]]; }), p.mode) +
        group('easy', t('s_read', lang), [['on', t('on', lang)], ['off', t('off', lang)]], p.easy ? 'on' : 'off') +
        '<p class="dm-status" role="status" aria-live="polite"></p></form></div>';
    }
  }
  if (!customElements.get('dimts-settings')) customElements.define('dimts-settings', DimtsSettings);
  applyPrefs();

  /* ---------- resume links (?resume=CODE) ---------- */
  try {
    var code = new URLSearchParams(location.search).get('resume');
    if (code && store.get('dimts.resume.' + code, null)) { /* draft is already keyed by form; nothing else to do */ }
  } catch (e) {}

  window.Dimts = {
    version: '0.2.0', register: register, forms: FORMS, NEEDS: NEEDS, store: store,
    eth: { toGregorian: ethToGregorian, valid: ethValid, months: ETH_MONTHS, daysInMonth: ethDaysInMonth },
    speak: speak, stopSpeaking: stopSpeaking, label: L,
    prefs: getPrefs, setPrefs: setPrefs
  };
  document.dispatchEvent(new CustomEvent('dimts:ready'));
})();
