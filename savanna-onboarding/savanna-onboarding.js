/*!
 * Savanna Accessible Onboarding Module — accessible, audio-first, one-question-per-screen form engine.
 * Drop-in web component: <script src="savanna-onboarding.js" defer></script> + <savanna-onboarding-form form="signup"></savanna-onboarding-form>
 * The old names <dimts-form>, <dimts-settings>, window.Dimts and dimts:* events still work as deprecated aliases.
 * No framework, no build step, no paid API. Data stays in the browser unless the host page sends it.
 */
(function () {
  'use strict';

  /* =====================================================================================================
     STORAGE ADAPTER
     Everything the module keeps on the device goes through `store`. Keys are namespaced "savanna-onboarding.".
     The default backend is localStorage; a host can replace it with SavannaOnboarding.setStorage(adapter),
     where adapter = { getItem(key), setItem(key, string), removeItem(key), keys() }. Never throws.
     ===================================================================================================== */
  var NS = 'savanna-onboarding.';
  var LEGACY_NS = 'dimts.';
  var localBackend = {
    getItem: function (k) { return localStorage.getItem(k); },
    setItem: function (k, v) { localStorage.setItem(k, v); },
    removeItem: function (k) { localStorage.removeItem(k); },
    keys: function () { return Object.keys(localStorage); }
  };
  var backend = localBackend;
  var store = {
    get: function (k, d) { try { var v = backend.getItem(NS + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { backend.setItem(NS + k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { backend.removeItem(NS + k); } catch (e) {} },
    /** Names (without the namespace) of everything the module has stored. */
    keys: function () { try { return backend.keys().filter(function (k) { return k.indexOf(NS) === 0; }).map(function (k) { return k.slice(NS.length); }); } catch (e) { return []; } }
  };
  function setStorage(adapter) { backend = adapter || localBackend; }
  // One-time move of data saved by the old prototype under "dimts." keys. Existing new keys are never overwritten.
  function migrateLegacyKeys() {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf(LEGACY_NS) !== 0) return;
        var nk = NS + k.slice(LEGACY_NS.length);
        if (localStorage.getItem(nk) === null) localStorage.setItem(nk, localStorage.getItem(k));
        localStorage.removeItem(k);
      });
    } catch (e) {}
  }
  migrateLegacyKeys();

  /* ---------- learner preferences: saved once, applied everywhere the component is embedded ---------- */
  var MODES = ['read_type', 'listen', 'speak', 'simple'];
  function getPrefs() { var p = store.get('prefs', {}); return { lang: p.lang || 'am', easy: !!p.easy, mode: p.mode || '', size: p.size || 'normal', contrast: p.contrast || 'normal' }; }
  function applyPrefs() {
    var p = getPrefs(), root = document.documentElement;
    root.setAttribute('data-dm-size', p.size);
    root.setAttribute('data-dm-contrast', p.contrast);
  }
  /* Events are named savanna-onboarding:<name>. The old dimts:<name> event is also sent (deprecated alias). */
  function emit(target, name, detail, bubbles) {
    target.dispatchEvent(new CustomEvent('savanna-onboarding:' + name, { bubbles: !!bubbles, detail: detail }));
    target.dispatchEvent(new CustomEvent('dimts:' + name, { bubbles: !!bubbles, detail: detail }));
  }
  function setPrefs(patch) {
    var p = getPrefs();
    Object.keys(patch).forEach(function (k) { p[k] = patch[k]; });
    store.set('prefs', p);
    applyPrefs();
    emit(document, 'prefs', p);
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
      speak: 'Answer by voice', stop: 'Stop listening', listening: 'Microphone on. Listening… speak now.',
      heard: 'I heard:', yes: 'Use this answer', again: 'Say it again', type: 'Type it instead',
      micAsk: 'Your browser may ask to use the microphone. Choose Allow.', micOn: 'Microphone on',
      processing: 'Working out what you said…',
      heardCheck: 'Check it and fix it if needed. Nothing is kept until you choose "Use this answer".',
      tapInstead: 'Tap it instead', heardEdit: 'Your answer, from your voice', heardMatch: 'This matches:', orDid: 'Or did you say:',
      voiceUsed: 'Answer added from your voice. Check it, then choose Continue.',
      voiceDiscarded: 'The voice answer was thrown away. Type or tap your answer.',
      voiceCheckFirst: 'First check the answer from your voice: choose "Use this answer" or "Type it instead".',
      voiceDenied: 'The microphone is blocked. You can type or tap instead, or allow the microphone in your browser settings.',
      voiceNetwork: 'Voice answers need an internet connection. Please type or tap your answer.',
      voiceNoSpeech: 'I did not hear anything. Try again, or type or tap your answer.',
      voiceNoMic: 'No microphone was found. Please type or tap your answer.',
      voiceLangUnsupported: 'Voice answers in this language are not available in this browser. Please type or tap your answer.',
      s_voice: 'Voice answers', voice_on: 'Allowed', voice_off: 'Not allowed',
      s_voiceHint: 'To turn your voice into text, this browser sends your recording to Google. Voice is never offered for ID or support questions.',
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
      voiceConsent: 'To turn your voice into text, this browser sends your recording to Google. You can type or tap instead. You can turn this off at any time in Settings. Do you want to use your voice?',
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
      settingsSaved: 'Saved. This setting now applies everywhere this tool is used on this phone.',
      countChanged: 'Your answer changed the number of questions. There are now {total} questions.',
      resumeMissing: 'We could not find saved answers for this link on this phone. Answers are saved only on the phone where you started. You can start again here.'
    },
    am: {
      back: 'ተመለስ', next: 'ቀጥል', submit: 'ላክ', listen: 'ጥያቄውን አዳምጥ',
      speak: 'በድምፅ ይመልሱ', stop: 'ማዳመጥ አቁም', listening: 'ማይክሮፎኑ በርቷል። እያዳመጥኩ ነው… አሁን ይናገሩ።',
      heard: 'የሰማሁት፦', yes: 'ይህን መልስ ተጠቀም', again: 'እንደገና ይናገሩ', type: 'በመጻፍ ይመልሱ',
      micAsk: 'ብራውዘርዎ ማይክሮፎኑን ለመጠቀም ፈቃድ ሊጠይቅ ይችላል። «ፍቀድ»ን ይምረጡ።', micOn: 'ማይክሮፎኑ በርቷል',
      processing: 'የተናገሩትን እየለየሁ ነው…',
      heardCheck: 'ያረጋግጡት፤ ካስፈለገም ያስተካክሉት። «ይህን መልስ ተጠቀም»ን እስኪመርጡ ድረስ ምንም አይቀመጥም።',
      tapInstead: 'በመንካት ይመልሱ', heardEdit: 'ከድምፅዎ የተገኘ መልስ', heardMatch: 'ይህ የሚዛመደው፦', orDid: 'ወይስ ያሉት ይህ ነው፦',
      voiceUsed: 'ከድምፅዎ መልስ ተጨምሯል። ያረጋግጡት፤ ከዚያ «ቀጥል»ን ይምረጡ።',
      voiceDiscarded: 'የድምፅ መልሱ ተሰርዟል። መልስዎን ይጻፉ ወይም ይንኩ።',
      voiceCheckFirst: 'መጀመሪያ ከድምፅዎ የተገኘውን መልስ ያረጋግጡ፦ «ይህን መልስ ተጠቀም» ወይም «በመጻፍ ይመልሱ»ን ይምረጡ።',
      voiceDenied: 'ማይክሮፎኑ ታግዷል። በምትኩ መጻፍ ወይም መንካት፣ ወይም በብራውዘርዎ ቅንብሮች ማይክሮፎኑን መፍቀድ ይችላሉ።',
      voiceNetwork: 'በድምፅ መመለስ የኢንተርኔት ግንኙነት ያስፈልገዋል። እባክዎ መልስዎን ይጻፉ ወይም ይንኩ።',
      voiceNoSpeech: 'ምንም አልሰማሁም። እንደገና ይሞክሩ ወይም መልስዎን ይጻፉ ወይም ይንኩ።',
      voiceNoMic: 'ማይክሮፎን አልተገኘም። እባክዎ መልስዎን ይጻፉ ወይም ይንኩ።',
      voiceLangUnsupported: 'በዚህ ቋንቋ በድምፅ መመለስ በዚህ ብራውዘር አይቻልም። እባክዎ መልስዎን ይጻፉ ወይም ይንኩ።',
      s_voice: 'በድምፅ መመለስ', voice_on: 'ተፈቅዷል', voice_off: 'አልተፈቀደም',
      s_voiceHint: 'ድምፅዎን ወደ ጽሑፍ ለመቀየር ይህ ብራውዘር ቅጂዎን ወደ Google ይልካል። ለመታወቂያ ወይም ለድጋፍ ጥያቄዎች ድምፅ በፍጹም አይቀርብም።',
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
      voiceConsent: 'ድምፅዎን ወደ ጽሑፍ ለመቀየር ይህ ብራውዘር ቅጂዎን ወደ Google ይልካል። በምትኩ መጻፍ ወይም መንካት ይችላሉ። ይህን በማንኛውም ጊዜ በቅንብሮች ውስጥ ማጥፋት ይችላሉ። ድምፅዎን መጠቀም ይፈልጋሉ?',
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
      settingsSaved: 'ተቀምጧል። ይህ ቅንብር ይህ መሣሪያ በዚህ ስልክ በሚሠራበት ቦታ ሁሉ ይተገበራል።',
      countChanged: 'መልስዎ የጥያቄዎቹን ብዛት ቀይሯል። አሁን {total} ጥያቄዎች አሉ።',
      resumeMissing: 'ለዚህ ሊንክ የተቀመጡ መልሶችን በዚህ ስልክ ላይ ማግኘት አልቻልንም። መልሶች የሚቀመጡት በጀመሩበት ስልክ ላይ ብቻ ነው። እዚህ እንደገና መጀመር ይችላሉ።'
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

  /* ---------- speech: voice input ----------
     SPEECH ADAPTER. All speech goes through one interface, so another engine (for example Addis AI for Amharic,
     or an on-device engine) can be plugged in with SavannaOnboarding.setSpeech({ input, output }) without touching
     the forms. The default is the browser's own engine: free, but voice input sends audio to Google and needs a
     connection.
       input.supported()                       -> true when voice input can work here
       input.start(lang, { result(alternatives), error(code), end() }) -> { stop(), abort() }
         error codes: 'not-allowed', 'network', 'no-speech', 'audio-capture', 'language-not-supported', 'aborted', 'failed'
       output.speak(text, lang, audioUrl)      -> false when no voice is available for that language
       output.stop()                                                                                       */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var browserInput = {
    supported: function () { return !!SR; },
    start: function (lang, h) {
      var rec = new SR();
      rec.lang = lang === 'am' ? 'am-ET' : 'en-US';
      rec.interimResults = false; rec.maxAlternatives = 3; rec.continuous = false;
      rec.onresult = function (ev) {
        var alts = [], r = ev.results[0];
        for (var i = 0; i < r.length; i++) alts.push(r[i].transcript);
        h.result(alts);
      };
      rec.onerror = function (ev) {
        var e = ev && ev.error;
        h.error(e === 'service-not-allowed' ? 'not-allowed' : e === 'language-not-supported' || e === 'bad-grammar' ? 'language-not-supported' : e || 'failed');
      };
      rec.onend = function () { h.end(); };
      rec.start();
      return { stop: function () { try { rec.stop(); } catch (e) {} }, abort: function () { try { rec.abort(); } catch (e) {} } };
    }
  };
  var speech = { input: browserInput, output: { speak: function (a, b, c) { return speak(a, b, c); }, stop: function () { stopSpeaking(); } } };
  function setSpeech(o) { if (o && o.input) speech.input = o.input; if (o && o.output) speech.output = o.output; }
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

  /* =====================================================================================================
     CONFIG: the form registry and what a field config means. Plain data in, plain answers out.
     ===================================================================================================== */
  var FORMS = {};
  var FIELD_TYPES = ['text', 'tel', 'email', 'textarea', 'choice', 'multi', 'consent', 'ethdate'];
  var PENDING = []; // elements waiting for their form config to be registered
  function register(id, config) {
    var seen = {};
    (config.fields || []).forEach(function (f) {
      if (seen[f.id]) console.warn('[savanna-onboarding] form "' + id + '": duplicate field id "' + f.id + '"');
      if (FIELD_TYPES.indexOf(f.type) === -1) console.warn('[savanna-onboarding] form "' + id + '": unknown field type "' + f.type + '"');
      seen[f.id] = true;
    });
    FORMS[id] = config;
    PENDING.slice().forEach(function (el) {
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
  function optionsOf(f) { return f.options === 'NEEDS' ? NEEDS : (f.options || []); }
  function isGroupField(f) { return f.type === 'choice' || f.type === 'multi' || f.type === 'consent' || f.type === 'ethdate'; }
  function isEmpty(v) { return v == null || v === '' || (Array.isArray(v) && !v.length); }
  // Voice input is never offered on sensitive questions (support needs, ID), so that data never reaches a cloud speech service.
  function voiceAllowed(f) { return f.voice !== false && !f.sensitive && f.type !== 'ethdate'; }

  /** Checks one answer. Returns '' when it is fine, otherwise the error message in the given language. */
  function validateAnswer(f, v, answers, lang) {
    if (isEmpty(v)) {
      if (f.optional) return '';
      return f.type === 'choice' ? t('errChoice', lang) : f.type === 'multi' ? t('errMulti', lang) : f.type === 'consent' ? t('errConsent', lang) : t('errRequired', lang);
    }
    if (f.type === 'tel') { var digits = String(v).replace(/\D/g, ''); if (digits.indexOf('251') === 0) digits = '0' + digits.slice(3); if (digits.length !== 10) return t('errPhone', lang); }
    if (f.type === 'ethdate' && !v.gregorian) return t('errDate', lang);
    if (f.type === 'consent' && f.requiredValue && v !== f.requiredValue) return t('errConsent', lang);
    if (f.validate) { var msg = f.validate(v, answers); if (msg) return L(msg, lang); }
    return '';
  }

  /* =====================================================================================================
     STATE: one form's answers and position. No page elements here, so it can be tested on its own.
     Typing, tapping and (confirmed) speech all end up in the same `answers` object.
     ===================================================================================================== */
  function FormState(cfg, key) {
    this.cfg = cfg; this.key = key;
    this.answers = {}; this.prefilled = {};
    this.step = 0; this.mode = 'question'; this.returnToReview = false;
    this.resumeCode = null;
    this.changed = {}; // answers changed since the last "Change" from the summary
  }
  /** Loads the saved draft. Returns true when it held answers. */
  FormState.prototype.load = function () {
    var d = store.get(this.key, null);
    if (!d) return false;
    this.answers = d.answers || {};
    this.step = d.step || 0;
    this.resumeCode = d.resumeCode || null;
    // come back to the screen the learner left: the check-your-answers page, or the question
    this.mode = d.mode === 'review' ? 'review' : 'question';
    return Object.keys(this.answers).length > 0;
  };
  /** Fills empty answers from data the learner already gave (profile, Support Passport): never ask twice. */
  FormState.prototype.applyPrefill = function () {
    var ctx = { profile: store.get('profile', {}), passport: store.get('passport', {}) }, self = this;
    this.cfg.fields.forEach(function (f) {
      if (!f.prefill) return;
      var v = (ctx[f.prefill.from] || {})[f.prefill.key];
      if (isEmpty(self.answers[f.id]) && !isEmpty(v)) { self.answers[f.id] = v; self.prefilled[f.id] = true; }
    });
  };
  FormState.prototype.visible = function () {
    var a = this.answers;
    return this.cfg.fields.filter(function (f) { return evalShowIf(f.showIf, a); });
  };
  FormState.prototype.field = function () {
    var vis = this.visible();
    if (this.step >= vis.length) this.step = vis.length - 1;
    if (this.step < 0) this.step = 0;
    return vis[this.step];
  };
  /** "Question n of total". Questions that depend on a choice not made yet are counted for the shortest route
      that choice can open, so the total only grows right after a choice that adds questions (and the view says so). */
  FormState.prototype.progress = function () {
    var a = this.answers, vis = this.visible(), shown = {}, extra = 0;
    vis.forEach(function (f) { shown[f.id] = true; });
    vis.forEach(function (c) {
      if (!isEmpty(a[c.id]) || !c.options) return;
      var deps = this.cfg.fields.filter(function (f) { return !shown[f.id] && f.showIf && f.showIf.field === c.id; });
      if (!deps.length) return;
      var counts = optionsOf(c).map(function (o) {
        var trial = {}; Object.keys(a).forEach(function (k) { trial[k] = a[k]; }); trial[c.id] = o.value;
        return deps.filter(function (f) { return evalShowIf(f.showIf, trial); }).length;
      });
      extra += Math.min.apply(null, counts);
    }, this);
    return { n: this.step + 1, total: vis.length + extra };
  };
  /** Records an answer. If it changed, answers that depended on it (clearIfChanged) are thrown away. */
  FormState.prototype.setAnswer = function (id, value) {
    var before = JSON.stringify(this.answers[id]), self = this;
    this.answers[id] = value;
    delete this.prefilled[id];
    if (before === undefined || before === JSON.stringify(value)) return false;
    this.changed[id] = true;
    this.cfg.fields.forEach(function (f) {
      if (f.clearIfChanged === id) { delete self.answers[f.id]; delete self.prefilled[f.id]; }
    });
    return true;
  };
  /** Drops answers to questions that are no longer shown (an abandoned route), so they are never kept or sent. */
  FormState.prototype.prune = function () {
    var self = this, changed = true;
    while (changed) { // hiding one question can hide others that depended on it
      changed = false;
      var shown = {}; this.visible().forEach(function (f) { shown[f.id] = true; });
      Object.keys(this.answers).forEach(function (id) {
        if (!shown[id]) { delete self.answers[id]; delete self.prefilled[id]; changed = true; }
      });
    }
  };
  /** Moves on after a valid answer. Returns { total, changed } so the view can explain a changed question count. */
  FormState.prototype.advance = function (shownTotal) {
    var before = shownTotal != null ? shownTotal : this.progress().total; // the total the learner saw on screen
    this.applyPrefill(); this.prune();
    var vis = this.visible(), self = this;
    if (this.returnToReview) {
      // after "Change", ask any question the new answer opened up (or emptied) before going back to the summary
      var next = -1, before = this.beforeChange || {};
      for (var j = this.step + 1; j < vis.length; j++) {
        var id = vis[j].id, opened = !(id in before), emptied = before[id] && self.answers[id] === undefined;
        var dependsOnChange = vis[j].clearIfChanged && this.changed[vis[j].clearIfChanged] && self.answers[id] === undefined;
        if (opened || emptied || dependsOnChange) { next = j; break; }
      }
      if (next !== -1) this.step = next; else { this.mode = 'review'; this.returnToReview = false; }
    } else if (this.step >= vis.length - 1) this.mode = 'review';
    else this.step++;
    var total = this.progress().total;
    return { total: total, changed: this.mode === 'question' && total !== before };
  };
  FormState.prototype.back = function (welcomeOn) {
    if (this.mode === 'review') { this.mode = 'question'; this.step = this.visible().length - 1; }
    else if (this.returnToReview) { this.mode = 'review'; this.returnToReview = false; }
    else if (this.step > 0) this.step--;
    else if (welcomeOn && this.mode === 'question') this.mode = 'welcome';
  };
  FormState.prototype.change = function (step) {
    var self = this;
    // remember which questions were shown (and answered) before the change
    this.beforeChange = {}; this.changed = {};
    this.visible().forEach(function (f) { self.beforeChange[f.id] = self.answers[f.id] !== undefined; });
    this.mode = 'question'; this.step = step; this.returnToReview = true;
  };
  FormState.prototype.save = function () {
    this.prune();
    store.set(this.key, { answers: this.answers, step: this.step, mode: this.mode, resumeCode: this.resumeCode, at: Date.now() });
  };
  /** A short code for the "finish later" link. The same draft keeps the same code. */
  FormState.prototype.makeResumeCode = function () {
    if (!this.resumeCode) this.resumeCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    store.set('resume.' + this.resumeCode, this.key);
    return this.resumeCode;
  };
  /** The answers to send: only questions that were actually shown (minimum data). Clears the draft. */
  FormState.prototype.finish = function () {
    this.prune();
    var out = JSON.parse(JSON.stringify(this.answers));
    if (this.resumeCode) store.del('resume.' + this.resumeCode);
    store.del(this.key);
    this.mode = 'done';
    return out;
  };

  /* ---------- where this script was loaded from (the fonts folder sits next to it) ---------- */
  var BASE = (function () {
    try { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/[^\/]*$/, '') : ''; } catch (e) { return ''; }
  })();

  /* ---------- fonts: Poppins (as served by Savanna) + Noto Sans Ethiopic for Amharic. Both SIL OFL, self-hosted. ---------- */
  var RANGE = {
    latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
    ethiopic: 'U+030E, U+1200-1399, U+2D80-2DDE, U+AB01-AB2E, U+1E7E0-1E7E6, U+1E7E8-1E7EB, U+1E7ED-1E7EE, U+1E7F0-1E7FE'
  };
  function fontFaces() {
    if (!BASE) return ''; // inline install: the host provides fonts, the stack below falls back cleanly
    var out = [];
    [400, 500, 600, 700].forEach(function (w) {
      ['latin-ext', 'latin'].forEach(function (sub) {
        out.push('@font-face{font-family:"Poppins";font-style:normal;font-weight:' + w + ';font-display:swap;src:url("' + BASE + 'assets/fonts/poppins-' + w + '-' + sub + '.woff2") format("woff2");unicode-range:' + RANGE[sub] + '}');
      });
    });
    out.push('@font-face{font-family:"Noto Sans Ethiopic";font-style:normal;font-weight:400 700;font-display:swap;src:url("' + BASE + 'assets/fonts/noto-sans-ethiopic-ethiopic.woff2") format("woff2");unicode-range:' + RANGE.ethiopic + '}');
    return out.join('\n');
  }

  /* ---------- design tokens ----------
     CSS custom properties prefixed --so- ("Savanna onboarding"), so they never clash with Savanna or Bootstrap.
     A host can override any of them on :root or on the element. Values, sources and contrast: DESIGN_TOKENS.md. */
  var TOKENS = [
    ':root{',
    '--so-navy:#002b56;',            // --savanna-alx-primary
    '--so-text:var(--so-navy);--so-heading:var(--so-navy);',
    '--so-text-muted:#335578;',      // --savanna-alx-primary-hover
    '--so-primary:#da3a3a;',         // Savanna red #db3e3e darkened 1% lightness -> 4.52:1 on white
    '--so-primary-hover:#bf2424;',
    '--so-on-primary:#fff;',
    '--so-surface:#fff;',
    '--so-surface-alt:#e7e9ec;',     // --savanna-alx-light-background
    '--so-surface-info:#cce8f4;',    // --savanna-alx-tertiary-80
    '--so-border:#66809a;',          // --savanna-alx-primary-40 (4.10:1, form control edges)
    '--so-border-strong:var(--so-navy);',
    '--so-border-subtle:#dee2e6;',   // --bs-border-color (decorative dividers only)
    '--so-header-border:#e5e6e6;',   // --savanna-theme-header-border-color (decorative)
    '--so-selected-bg:#e7e9ec;--so-selected-border:var(--so-navy);',
    '--so-error:#dc3545;',           // --bs-form-invalid-color
    '--so-success-bg:#cdfce6;',      // --savanna-alx-secondary-80
    '--so-success-accent:#05f283;',  // --savanna-alx-secondary (fill only, never text)
    '--so-accent:#5648b7;',          // --savanna-alx-accent (callout bar)
    '--so-info-accent:#028eca;',     // --savanna-alx-tertiary (borders only, fails as text)
    '--so-focus:var(--so-navy);--so-focus-width:3px;--so-focus-offset:2px;',
    '--so-border-width:2px;',
    '--so-radius-sm:5.25px;--so-radius:7px;--so-radius-card:15px;--so-radius-pill:999px;',
    '--so-font:"Poppins","Noto Sans Ethiopic","Nyala","Ebrima",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;',
    '--so-base-size:max(1rem,16px);', // never shrinks under Savanna's 14px root; follows a larger browser default
    '--so-scale:1;',
    '--so-target:48px;--so-target-sm:44px;',
    '}',
    'html[data-dm-size=large]{--so-scale:1.25}',
    'html[data-dm-size=xlarge]{--so-scale:1.5}',
    'html[data-dm-contrast=high]{--so-text:#000;--so-heading:#000;--so-text-muted:#000;--so-primary:#000;--so-primary-hover:#333;' +
      '--so-surface-alt:#fff;--so-surface-info:#fff;--so-success-bg:#fff;--so-selected-bg:#fff;--so-selected-border:#000;' +
      '--so-border:#000;--so-border-strong:#000;--so-border-subtle:#000;--so-header-border:#000;--so-accent:#000;--so-info-accent:#000;' +
      '--so-success-accent:#000;--so-error:#a3000b;--so-focus:#000;--so-border-width:3px}'
  ].join('');

  /* ---------- component styles (all classes prefixed dm-, all values from the tokens above) ---------- */
  var CSS = [
    'savanna-onboarding-form,savanna-onboarding-settings,dimts-form,dimts-settings{display:block;font-family:var(--so-font);color:var(--so-text);line-height:1.5;font-size:calc(var(--so-base-size) * var(--so-scale))}',
    '.dm{max-width:40em;margin:0 auto}',
    '.dm:lang(am){line-height:1.7}',
    '.dm *{box-sizing:border-box}',
    '.dm button,.dm input,.dm select,.dm textarea{font:inherit}',
    '.dm :focus-visible{outline:var(--so-focus-width) solid var(--so-focus);outline-offset:var(--so-focus-offset);box-shadow:none}',
    '.dm-q:focus,.dm-q:focus-visible{outline:none}',

    '.dm-bar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:.5em;margin-bottom:1em;padding-bottom:.75em;border-bottom:1px solid var(--so-border-subtle)}',
    '.dm-bar-r{display:flex;flex-wrap:wrap;gap:.5em;margin-left:auto}',
    '.dm-progress{color:var(--so-text-muted);margin:0 0 .25em;font-size:.95em;font-weight:500}',
    '.dm-meter{height:8px;background:var(--so-surface-alt);border-radius:var(--so-radius-pill);overflow:hidden;margin:.35em 0 1.25em}',
    '.dm-meter span{display:block;height:100%;background:var(--so-heading);border-radius:var(--so-radius-pill)}',

    '.dm-q{font-size:1.75em;line-height:1.3;margin:.25em 0 .5em;font-weight:600;color:var(--so-heading)}',
    '.dm-q label{display:block}',
    '.dm-opt-tag{font-weight:400;font-size:.6em;color:var(--so-text-muted)}',
    '.dm-hint{color:var(--so-text-muted);margin:0 0 1em}',
    '.dm fieldset{border:none;padding:0;margin:0;min-width:0}',
    '.dm legend{padding:0;max-width:100%}',

    '.dm-btn{display:inline-flex;align-items:center;justify-content:center;gap:.4em;min-height:var(--so-target);min-width:var(--so-target);padding:.6em 1.2em;border-radius:var(--so-radius-sm);border:var(--so-border-width) solid var(--so-border-strong);background:var(--so-surface);color:var(--so-heading);cursor:pointer;font-weight:500;text-align:center;transition:background-color .15s,border-color .15s}',
    '.dm-btn:hover{background:var(--so-surface-alt)}',
    '.dm-primary{background:var(--so-primary);border-color:var(--so-primary);color:var(--so-on-primary)}',
    '.dm-primary:hover{background:var(--so-primary-hover);border-color:var(--so-primary-hover)}',
    '.dm-small{min-height:var(--so-target-sm);padding:.35em .8em;font-size:.9em}',
    '.dm-link{background:none;border:none;color:var(--so-heading);text-decoration:underline;text-underline-offset:3px;padding:.5em .25em;min-height:var(--so-target-sm);cursor:pointer;font-weight:500}',
    '.dm-link:hover{text-decoration-thickness:2px}',
    '.dm-voice-first [data-act=speak]{background:var(--so-heading);border-color:var(--so-heading);color:var(--so-surface);order:-1}',

    '.dm-input{width:100%;min-height:52px;padding:.6em .8em;border:var(--so-border-width) solid var(--so-border);border-radius:var(--so-radius);background:var(--so-surface);color:var(--so-text);font-size:1.1em}',
    '.dm-input:hover{border-color:var(--so-border-strong)}',
    '.dm textarea.dm-input{min-height:8em}',
    '.dm-input[aria-invalid=true]{border-color:var(--so-error);border-width:3px}',
    '.dm-date{display:flex;flex-wrap:wrap;gap:.75em}',
    '.dm-date div{display:flex;flex-direction:column;gap:.25em;max-width:100%}',
    '.dm-date label{font-weight:500}',
    '.dm-date .dm-input{width:auto;max-width:100%}',

    '.dm-opts{display:grid;gap:.6em;margin:0 0 1em;padding:0;list-style:none}',
    '.dm-opt{display:flex;align-items:center;gap:.75em;min-height:56px;max-width:100%;padding:.6em .9em;border:var(--so-border-width) solid var(--so-border);border-radius:var(--so-radius);background:var(--so-surface);cursor:pointer}',
    '.dm-opt:hover{border-color:var(--so-border-strong)}',
    '.dm-opt:has(input:checked){border-color:var(--so-selected-border);background:var(--so-selected-bg);box-shadow:inset 0 0 0 1px var(--so-selected-border);font-weight:500}',
    '.dm-opt input{width:1.5em;height:1.5em;flex:none;margin:0;accent-color:var(--so-heading)}',
    '.dm-ico{font-size:1.5em;flex:none;line-height:1}',
    '.dm-opt>span:last-child{min-width:0;overflow-wrap:anywhere}',
    '.dm a,.dm samp,.dm q{overflow-wrap:anywhere}', // long links (resume link) wrap at 400% zoom

    '.dm-tools{display:flex;flex-wrap:wrap;gap:.6em;margin:1em 0}',
    '.dm-heard{border:var(--so-border-width) solid var(--so-info-accent);background:var(--so-surface-info);border-radius:var(--so-radius);padding:.9em;margin:1em 0}',
    '.dm-heard p{margin:0 0 .6em}',
    '.dm-heard q{font-weight:600;font-size:1.15em}',
    '.dm-heard-label{display:block;font-weight:600;margin:.25em 0}',
    '.dm-heard .dm-input{margin-bottom:.5em}',
    '.dm-mic-on{background:var(--so-primary)!important;border-color:var(--so-primary)!important;color:var(--so-on-primary)!important}',
    '.dm-status{min-height:1.5em;margin:.5em 0;color:var(--so-heading);font-weight:500}',
    '.dm-actions{display:flex;flex-wrap:wrap;gap:.75em;margin-top:1.5em;align-items:center}',

    '.dm-errors{border:4px solid var(--so-error);border-radius:var(--so-radius);padding:1em 1.1em;margin:0 0 1.25em;background:var(--so-surface)}',
    '.dm-errors h2{margin:0 0 .5em;font-size:1.25em;color:var(--so-heading)}',
    '.dm-errors ul{margin:0;padding-left:1.2em}',
    '.dm-errors a{color:var(--so-error);font-weight:600}',
    '.dm-err{display:block;color:var(--so-error);font-weight:600;margin:.25em 0 .5em}',

    '.dm-panel{border:1px solid var(--so-border-subtle);border-radius:var(--so-radius-card);padding:1em 1.1em;margin:1em 0;background:var(--so-surface-alt)}',
    '.dm-panel h2{margin:0 0 .5em;font-size:1.2em;color:var(--so-heading)}',
    '.dm-note,.dm-success{position:relative;padding:.85em 1em .85em 1.4em;margin:1em 0;border-radius:var(--so-radius);overflow:hidden}',
    '.dm-note{background:var(--so-surface-alt)}',
    '.dm-success{background:var(--so-success-bg)}',
    '.dm-note::before,.dm-success::before{content:"";position:absolute;left:0;top:0;bottom:0;width:8px;background:var(--so-accent)}',
    '.dm-success::before{background:var(--so-success-accent)}',
    '.dm-success .dm-q{margin-top:0}',
    '.dm-review{margin:0 0 1em;padding:0}',
    '.dm-review div{display:grid;grid-template-columns:1fr;gap:.15em;padding:.75em 0;border-bottom:1px solid var(--so-border-subtle)}',
    '.dm-review dt{font-weight:600}',
    '.dm-review dd{margin:0}',
    '.dm-vh{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',

    '.dm-settings fieldset{margin:0 0 1.5em}',
    '.dm-settings legend{font-weight:600;font-size:1.2em;margin-bottom:.4em;color:var(--so-heading)}',
    '.dm-easy .dm-q{font-size:2em}',
    '.dm-easy .dm-ico{font-size:2.1em}',
    '.dm-easy .dm-opt{min-height:68px;font-size:1.15em}',

    'html[data-dm-contrast=high] .dm{background:#fff}',
    'html[data-dm-contrast=high] .dm-meter{border:2px solid #000}',
    'html[data-dm-contrast=high] .dm-panel,html[data-dm-contrast=high] .dm-note,html[data-dm-contrast=high] .dm-success,html[data-dm-contrast=high] .dm-heard{border:3px solid #000}',
    'html[data-dm-contrast=high] .dm-opt:has(input:checked){border-width:5px;box-shadow:none}',
    '@media (forced-colors:active){.dm-opt:has(input:checked){border-width:4px}.dm-meter span{background:CanvasText}}',
    '@media (prefers-reduced-motion:reduce){.dm *{transition:none!important;animation:none!important}}'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('savanna-onboarding-styles')) return;
    var s = document.createElement('style'); s.id = 'savanna-onboarding-styles';
    s.textContent = fontFaces() + '\n' + TOKENS + '\n' + CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* =====================================================================================================
     PRESENTATION: turns a view model into HTML. Reads the state, never changes it.
     Every id is prefixed with the element's own uid, so several forms can share one page.
     Elements the controller needs are also marked data-ref="…" (stable hooks for code and tests).
     ===================================================================================================== */
  var MODE_ICONS = { read_type: '⌨️', listen: '🎧', speak: '🎤', simple: '🖼️' };
  var View = {
    id: function (vm, name) { return vm.uid + '-' + name; },

    errorSummary: function (vm, msg) {
      return '<div class="dm-errors" role="alert" tabindex="-1"><h2>' + t('problem', vm.lang) + '</h2><ul><li><a href="#' + View.id(vm, 'input') + '" data-act="focus-input">' + esc(msg) + '</a></li></ul></div>';
    },
    errorLine: function (vm, msg) {
      return '<span id="' + View.id(vm, 'err') + '" class="dm-err"><span class="dm-vh">Error: </span>' + esc(msg) + '</span>';
    },
    status: function () { return '<p class="dm-status" role="status" aria-live="polite"></p>'; },

    bar: function (vm, showBack) {
      var lang = vm.lang, helpId = View.id(vm, 'help');
      return '<div class="dm-bar">' +
        '<div>' + (showBack ? '<button type="button" class="dm-link" data-act="back">← ' + t('back', lang) + '</button>' : '') + '</div>' +
        '<div class="dm-bar-r">' +
        '<button type="button" class="dm-btn dm-small" data-act="lang" lang="' + (lang === 'am' ? 'en' : 'am') + '">' + t('langSwitch', lang) + '</button>' +
        '<button type="button" class="dm-btn dm-small" data-act="easy" aria-pressed="' + vm.easy + '">🔊 ' + t(vm.easy ? 'easyOn' : 'easyOff', lang) + '</button>' +
        '<button type="button" class="dm-btn dm-small" data-act="help" aria-expanded="' + !!vm.helpOpen + '" aria-controls="' + helpId + '">' + t('help', lang) + '</button>' +
        '</div></div>' +
        '<div id="' + helpId + '" data-ref="help" class="dm-panel"' + (vm.helpOpen ? '' : ' hidden') + '><h2>' + t('helpTitle', lang) + '</h2><p>' + esc(L(vm.cfg.help, lang) || t('helpText', lang)) + '</p>' +
        '<button type="button" class="dm-btn dm-small" data-act="help">' + t('helpClose', lang) + '</button></div>';
    },

    page: function (vm) {
      var html = '<div class="dm' + (vm.easy ? ' dm-easy' : '') + (vm.voiceFirst ? ' dm-voice-first' : '') + '" lang="' + vm.lang + '">';
      var m = vm.s.mode;
      html += m === 'welcome' ? View.welcome(vm) : m === 'question' ? View.question(vm) : m === 'review' ? View.review(vm) :
        m === 'saved' ? View.saved(vm) : m === 'done' ? View.done(vm) : '';
      return html + '</div>';
    },

    welcome: function (vm) {
      var lang = vm.lang, err = vm.error, hintId = View.id(vm, 'hint');
      var h = View.bar(vm, false);
      if (err) h += View.errorSummary(vm, err);
      h += '<form class="dm-form" novalidate><fieldset aria-describedby="' + hintId + (err ? ' ' + View.id(vm, 'err') : '') + '"><legend><h1 class="dm-q" tabindex="-1">' + t('welcomeTitle', lang) + '</h1></legend>' +
        '<p id="' + hintId + '" class="dm-hint">' + t('welcomeHint', lang) + '</p>' +
        (err ? View.errorLine(vm, err) : '') +
        '<div class="dm-opts">' + MODES.map(function (m, i) {
          return '<label class="dm-opt"><input' + (i === 0 ? ' id="' + View.id(vm, 'input') + '" data-ref="input"' : '') + ' type="radio" name="mode" value="' + m + '"' + (vm.prefsMode === m ? ' checked' : '') + '>' +
            '<span class="dm-ico" aria-hidden="true">' + MODE_ICONS[m] + '</span><span>' + t('m_' + m, lang) + '</span></label>';
        }).join('') + '</div></fieldset>' +
        '<div class="dm-tools"><button type="button" class="dm-btn" data-act="listen">🔊 ' + t('listen', lang) + '</button></div>' +
        View.status() +
        '<div class="dm-actions"><button type="submit" class="dm-btn dm-primary">' + t('next', lang) + '</button></div></form>';
      return h;
    },

    question: function (vm) {
      var s = vm.s, f = s.field(), lang = vm.lang, p = s.progress(), v = s.answers[f.id];
      var label = L(f.label, lang), hint = L(f.hint, lang), group = isGroupField(f);
      var describedBy = [hint ? View.id(vm, 'hint') : '', vm.error ? View.id(vm, 'err') : '', s.prefilled[f.id] ? View.id(vm, 'pre') : ''].filter(Boolean).join(' ');
      var opt = f.optional ? ' <span class="dm-opt-tag">' + t('optional', lang) + '</span>' : '';
      var h = View.bar(vm, s.step > 0 || s.returnToReview || !!vm.welcomeOn);
      h += '<p class="dm-progress">' + t('progress', lang, { n: p.n, total: p.total }) + '</p>';
      h += '<div class="dm-meter" aria-hidden="true"><span style="width:' + Math.round(p.n / p.total * 100) + '%"></span></div>';
      if (vm.error) h += View.errorSummary(vm, vm.error);
      h += '<form class="dm-form" novalidate>';
      if (group) h += '<fieldset' + (describedBy ? ' aria-describedby="' + describedBy + '"' : '') + '><legend><h1 class="dm-q" tabindex="-1">' + esc(label) + opt + '</h1></legend>';
      else h += '<h1 class="dm-q" tabindex="-1"><label for="' + View.id(vm, 'input') + '">' + esc(label) + opt + '</label></h1>';
      if (f.body) h += '<div class="dm-note">' + esc(L(f.body, lang)) + '</div>';
      if (hint) h += '<p id="' + View.id(vm, 'hint') + '" class="dm-hint">' + esc(hint) + '</p>';
      if (s.prefilled[f.id]) h += '<p id="' + View.id(vm, 'pre') + '" class="dm-hint">' + t('prefilled', lang) + '</p>';
      if (vm.error) h += View.errorLine(vm, vm.error);
      h += View.input(vm, f, v, group ? '' : describedBy);
      if (group) h += '</fieldset>';
      h += '<div class="dm-tools"><button type="button" class="dm-btn" data-act="listen">🔊 ' + t('listen', lang) + '</button>';
      var canSpeak = voiceAllowed(f) && speech.input.supported();
      if (canSpeak) h += '<button type="button" class="dm-btn" data-act="speak" aria-pressed="false">🎤 ' + t('speak', lang) + '</button>';
      h += '</div>';
      // A learner who chose "speak my answers" is told plainly when this browser (e.g. an app's WebView) cannot listen.
      if (voiceAllowed(f) && !canSpeak && vm.prefsMode === 'speak') h += '<p class="dm-note">' + t('voiceUnsupported', lang) + '</p>';
      h += '<div id="' + View.id(vm, 'heard') + '" data-ref="heard"></div>';
      h += View.status();
      h += '<div class="dm-actions"><button type="submit" class="dm-btn dm-primary">' + t('next', lang) + '</button>';
      if (vm.cfg.allowLater !== false) h += '<button type="button" class="dm-link" data-act="later">' + t('later', lang) + '</button>';
      return h + '</div></form>';
    },

    input: function (vm, f, v, describedBy) {
      var lang = vm.lang, inputId = View.id(vm, 'input');
      var aria = describedBy ? ' aria-describedby="' + describedBy + '"' : '';
      var inv = vm.error ? ' aria-invalid="true"' : '';
      if (f.type === 'text' || f.type === 'tel' || f.type === 'email') {
        return '<input id="' + inputId + '" data-ref="input" class="dm-input" name="v" type="' + (f.type === 'tel' ? 'tel' : f.type === 'email' ? 'email' : 'text') + '"' +
          (f.type === 'tel' ? ' inputmode="tel"' : '') + (f.autocomplete ? ' autocomplete="' + f.autocomplete + '"' : '') +
          ' value="' + esc(v || '') + '"' + aria + inv + '>';
      }
      if (f.type === 'textarea') return '<textarea id="' + inputId + '" data-ref="input" class="dm-input" name="v"' + aria + inv + '>' + esc(v || '') + '</textarea>';
      if (f.type === 'choice' || f.type === 'consent' || f.type === 'multi') {
        var multi = f.type === 'multi', sel = multi ? (v || []) : [v];
        return '<div class="dm-opts">' + optionsOf(f).map(function (o, i) {
          var checked = sel.indexOf(o.value) !== -1 ? ' checked' : '';
          return '<label class="dm-opt"><input' + (i === 0 ? ' id="' + inputId + '" data-ref="input"' : '') + ' type="' + (multi ? 'checkbox' : 'radio') + '" name="v" value="' + esc(o.value) + '"' + checked + '>' +
            (o.icon ? '<span class="dm-ico" aria-hidden="true">' + o.icon + '</span>' : '') + '<span>' + esc(L(o.label, lang)) + '</span></label>';
        }).join('') + '</div>';
      }
      if (f.type === 'ethdate') {
        var d = v || {}, months = ETH_MONTHS[lang] || ETH_MONTHS.en, mId = View.id(vm, 'm'), yId = View.id(vm, 'y');
        return '<div class="dm-date">' +
          '<div><label for="' + inputId + '">' + t('day', lang) + '</label><input id="' + inputId + '" data-ref="input" class="dm-input" name="d" inputmode="numeric" size="3" value="' + esc(d.d || '') + '"' + inv + '></div>' +
          '<div><label for="' + mId + '">' + t('month', lang) + '</label><select id="' + mId + '" data-ref="m" class="dm-input" name="m"' + inv + '><option value="">' + t('chooseMonth', lang) + '</option>' +
          months.map(function (m, i) { return '<option value="' + (i + 1) + '"' + (Number(d.m) === i + 1 ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></div>' +
          '<div><label for="' + yId + '">' + t('year', lang) + '</label><input id="' + yId + '" data-ref="y" class="dm-input" name="y" inputmode="numeric" size="5" value="' + esc(d.y || '') + '"' + inv + '></div>' +
          '</div>' + (d.gregorian ? '<p class="dm-hint">' + t('gregorian', lang, { date: fmtGregorian(new Date(d.gregorian), lang) }) + '</p>' : '');
      }
      return '';
    },

    display: function (vm, f, v) {
      var lang = vm.lang, opts = optionsOf(f);
      if (isEmpty(v)) return t('notGiven', lang);
      if (f.type === 'choice' || f.type === 'consent') { var o = opts.filter(function (x) { return x.value === v; })[0]; return o ? L(o.label, lang) : v; }
      if (f.type === 'multi') return v.map(function (x) { var o = opts.filter(function (y) { return y.value === x; })[0]; return o ? L(o.label, lang) : x; }).join(', ');
      if (f.type === 'ethdate') return v.d + ' ' + (ETH_MONTHS[lang] || ETH_MONTHS.en)[v.m - 1] + ' ' + v.y + ' (' + fmtGregorian(new Date(v.gregorian), lang) + ')';
      return String(v);
    },

    review: function (vm) {
      var lang = vm.lang, s = vm.s, cfg = vm.cfg;
      var h = View.bar(vm, !vm.startAtReview) + '<form class="dm-form" novalidate><h1 class="dm-q" tabindex="-1">' + esc(L(cfg.reviewTitle, lang) || t('review', lang)) + '</h1>' +
        '<p class="dm-hint">' + esc(L(cfg.reviewHint, lang) || t('reviewHint', lang)) + '</p><dl class="dm-review">';
      s.visible().forEach(function (f, i) {
        if (f.reviewHide) return;
        var name = esc(L(f.reviewLabel || f.label, lang));
        h += '<div><dt>' + name + '</dt><dd>' + esc(View.display(vm, f, s.answers[f.id])) + '</dd>' +
          '<dd><button type="button" class="dm-link" data-act="change" data-step="' + i + '">' + t('change', lang) + '<span class="dm-vh"> ' + name + '</span></button></dd></div>';
      });
      h += '</dl>';
      if (cfg.reviewNote) h += '<div class="dm-note">' + esc(L(cfg.reviewNote, lang)) + '</div>';
      return h + View.status() + '<div class="dm-actions"><button type="submit" class="dm-btn dm-primary">' + esc(L(cfg.submitLabel, lang) || t('submit', lang)) + '</button></div></form>';
    },

    saved: function (vm) {
      var lang = vm.lang, link = vm.resumeLink;
      var sms = lang === 'am' ? 'ምዝገባዎን ለመቀጠል፦ ' + link : 'Continue your form: ' + link;
      return View.bar(vm, false) + '<h1 class="dm-q" tabindex="-1">' + t('savedTitle', lang) + '</h1><p>' + t('savedText', lang) + '</p>' +
        '<p><a href="' + esc(link) + '">' + esc(link) + '</a></p>' +
        '<div class="dm-panel"><h2>' + t('smsPreview', lang) + '</h2><p lang="' + lang + '"><samp>' + esc(sms) + '</samp></p></div>' +
        '<div class="dm-actions"><button type="button" class="dm-btn dm-primary" data-act="resume">' + t('next', lang) + '</button></div>';
    },

    done: function (vm) {
      var lang = vm.lang;
      // Help stays in the same place on every screen (WCAG 3.2.6); the result is shown as a success panel.
      return View.bar(vm, false) + '<div class="dm-success"><h1 class="dm-q" tabindex="-1"><span aria-hidden="true">✓ </span>' + esc(L(vm.cfg.doneTitle, lang)) + '</h1><p>' + esc(L(vm.cfg.doneText, lang)) + '</p></div><div class="dm-done-slot"></div>';
    },

    /* Review panel. Nothing from speech reaches the answer until "Use this answer" is chosen. */
    heard: function (vm, v) {
      var lang = vm.lang, f = v.field, hid = View.id(vm, 'heard-h'), eid = View.id(vm, 'heard-edit');
      var choice = f.type === 'choice' || f.type === 'consent' || f.type === 'multi';
      var h = '<div class="dm-heard" role="group" aria-labelledby="' + hid + '"><p id="' + hid + '" data-ref="heard-h" tabindex="-1">' + t('heard', lang) + ' <q>' + esc(v.transcript) + '</q></p>';
      if (choice) {
        h += '<p>' + t('heardMatch', lang) + ' <strong>' + esc(v.shown) + '</strong></p>';
      } else {
        h += '<p class="dm-hint">' + t('heardCheck', lang) + '</p><label for="' + eid + '" class="dm-heard-label">' + t('heardEdit', lang) + '</label>' +
          (f.type === 'textarea' ? '<textarea id="' + eid + '" data-ref="heard-edit" class="dm-input">' + esc(v.value) + '</textarea>'
            : '<input id="' + eid + '" data-ref="heard-edit" class="dm-input" type="' + (f.type === 'tel' ? 'tel' : 'text') + '"' + (f.type === 'tel' ? ' inputmode="tel"' : '') + ' value="' + esc(v.value) + '">');
        if (v.others.length) h += '<p class="dm-hint">' + t('orDid', lang) + '</p><div class="dm-tools">' + v.others.map(function (o, i) {
          return '<button type="button" class="dm-btn dm-small" data-act="heard-alt" data-alt="' + i + '">' + esc(o) + '</button>';
        }).join('') + '</div>';
      }
      return h + '<div class="dm-actions"><button type="button" class="dm-btn dm-primary" data-act="heard-yes">' + t('yes', lang) + '</button>' +
        '<button type="button" class="dm-btn" data-act="heard-again">' + t('again', lang) + '</button>' +
        '<button type="button" class="dm-btn" data-act="heard-type">' + t(choice ? 'tapInstead' : 'type', lang) + '</button></div></div>';
    },

    voiceConsent: function (vm) {
      var lang = vm.lang, hid = View.id(vm, 'vc');
      return '<div class="dm-panel" role="group" aria-labelledby="' + hid + '"><h2 id="' + hid + '" data-ref="vc" tabindex="-1">' + t('voiceConsentTitle', lang) + '</h2><p>' + t('voiceConsent', lang) + '</p>' +
        '<div class="dm-actions"><button type="button" class="dm-btn dm-primary" data-act="voice-allow">' + t('voiceAllow', lang) + '</button><button type="button" class="dm-btn" data-act="voice-deny">' + t('voiceDeny', lang) + '</button></div></div>';
    }
  };

  /* =====================================================================================================
     THE WEB COMPONENT (controller): reads the page, updates the state, asks the view to draw.
     ===================================================================================================== */
  var UID = 0;
  function resumeParam() { try { return new URLSearchParams(location.search).get('resume'); } catch (e) { return null; } }

  class SavannaOnboardingForm extends HTMLElement {}

  SavannaOnboardingForm.prototype.connectedCallback = function () {
    if (this._ready) return;
    injectCss();
    var id = this.getAttribute('form');
    this.cfg = FORMS[id];
    // Form config may be registered after the element appears: wait for it.
    if (!this.cfg) { if (PENDING.indexOf(this) === -1) PENDING.push(this); return; }
    this._ready = true;
    if (!this.uid) this.uid = 'so' + (++UID);
    applyPrefs();
    var prefs = getPrefs(), self = this;
    this.lang = this.getAttribute('lang') || prefs.lang;
    this.easy = prefs.easy;
    this.error = ''; this.flash = ''; this.helpOpen = false;
    var key = 'draft.' + id + (this.getAttribute('instance') ? '.' + this.getAttribute('instance') : '');
    var s = this.state = new FormState(this.cfg, key);
    var resumed = s.load();
    var code = resumeParam();
    if (resumed) this.flash = t('resumed', this.lang);
    else if (code && !store.get('resume.' + code, null)) this.flash = t('resumeMissing', this.lang); // link opened on another phone
    s.applyPrefill();
    this.startAtReview = this.cfg.startAt === 'review';
    this.welcomeOn = !!(this.cfg.welcome || this.hasAttribute('welcome'));
    if (!resumed || this.startAtReview) s.mode = this.startAtReview ? 'review' : (this.welcomeOn ? 'welcome' : 'question');
    if (!this._listening) {
      this._listening = true;
      this.addEventListener('click', this.onClick.bind(this));
      this.addEventListener('submit', this.onSubmit.bind(this));
      this.addEventListener('change', this.onChange.bind(this));
    }
    this._onPrefs = function (e) {
      if (self._selfPrefs) return;
      self.lang = e.detail.lang; self.easy = e.detail.easy;
      if (self.state.mode === 'done') return; // keep the host's content in the done slot
      if (self.state.mode === 'question') {
        self.collect();
        // an error on screen is re-worded in the new language, never left in the old one
        if (self.error) { var ef = self.state.field(); self.error = validateAnswer(ef, self.state.answers[ef.id], self.state.answers, self.lang); }
      } else if (self.state.mode === 'welcome' && self.error) self.error = t('errMode', self.lang);
      self.render(false);
    };
    document.addEventListener('savanna-onboarding:prefs', this._onPrefs);
    this.render(false);
  };
  SavannaOnboardingForm.prototype.disconnectedCallback = function () {
    document.removeEventListener('savanna-onboarding:prefs', this._onPrefs); this._ready = false; speech.output.stop();
    if (this.voice && this.voice.session) this.voice.session.abort();
    this.voice = null;
  };

  SavannaOnboardingForm.prototype.ref = function (name) { return this.querySelector('[data-ref="' + name + '"]'); };
  SavannaOnboardingForm.prototype.vm = function () {
    var s = this.state, mode = getPrefs().mode;
    return {
      cfg: this.cfg, s: s, lang: this.lang, easy: this.easy, uid: this.uid, error: this.error, helpOpen: this.helpOpen,
      welcomeOn: this.welcomeOn, startAtReview: this.startAtReview, prefsMode: mode, voiceFirst: mode === 'speak',
      resumeLink: location.href.split('#')[0].split('?')[0] + '?resume=' + s.resumeCode + location.hash
    };
  };
  SavannaOnboardingForm.prototype.save = function () { this.state.save(); };
  SavannaOnboardingForm.prototype.savePrefs = function (extra) {
    var patch = { lang: this.lang, easy: this.easy };
    if (extra) Object.keys(extra).forEach(function (k) { patch[k] = extra[k]; });
    this._selfPrefs = true; setPrefs(patch); this._selfPrefs = false;
  };

  SavannaOnboardingForm.prototype.render = function (moveFocus) {
    var flash = this.flash; this.flash = '';
    if (this.voice) { if (this.voice.session) this.voice.session.abort(); this.voice = null; } // unconfirmed speech is thrown away
    this.className = '';
    this.innerHTML = View.page(this.vm());
    if (moveFocus !== false) {
      var target = this.querySelector('.dm-errors') || this.querySelector('.dm-q');
      if (target) target.focus();
    }
    // Filled in after the live region exists, so screen readers announce it.
    if (flash) this.status(flash);
    var m = this.state.mode;
    if ((m === 'question' || m === 'welcome') && this.easy && this._interacted) this.readQuestion();
  };

  /* --- reading the current value out of the page into the state --- */
  SavannaOnboardingForm.prototype.readField = function (f) {
    var form = this.querySelector('.dm-form');
    if (!form) return undefined;
    if (f.type === 'multi') return Array.prototype.map.call(form.querySelectorAll('input[name=v]:checked'), function (i) { return i.value; });
    if (f.type === 'choice' || f.type === 'consent') { var c = form.querySelector('input[name=v]:checked'); return c ? c.value : ''; }
    if (f.type === 'ethdate') {
      var d = parseInt(form.d.value, 10), m = parseInt(form.m.value, 10), y = parseInt(form.y.value, 10);
      var val = { d: form.d.value.trim(), m: form.m.value, y: form.y.value.trim() };
      if (ethValid(y, m, d)) val = { d: d, m: m, y: y, gregorian: ethToGregorian(y, m, d).toISOString().slice(0, 10) };
      return (val.d || val.m || val.y) ? val : '';
    }
    var inp = this.ref('input'); return inp ? inp.value.trim() : '';
  };
  SavannaOnboardingForm.prototype.collect = function () {
    if (this.state.mode !== 'question') return;
    var f = this.state.field(), v = this.readField(f);
    if (v !== undefined) this.state.setAnswer(f.id, v);
  };

  /* --- events --- */
  SavannaOnboardingForm.prototype.onSubmit = function (e) {
    e.preventDefault();
    this._interacted = true;
    stopSpeaking();
    var s = this.state;
    if (s.mode === 'review') return this.finish();
    if (s.mode === 'welcome') {
      var c = this.querySelector('input[name=mode]:checked');
      if (!c) { this.error = t('errMode', this.lang); this.render(true); return; }
      this.error = '';
      var patch = prefsForMode(c.value); this.easy = patch.easy;
      this.savePrefs(patch);
      s.mode = 'question'; this.render(true); return;
    }
    if (s.mode !== 'question') return;
    if (this.voice && this.voice.state === 'review') {
      this.status(t('voiceCheckFirst', this.lang));
      var hh = this.ref('heard-h'); if (hh) hh.focus();
      return;
    }
    var shownTotal = s.progress().total;
    this.collect();
    var f = s.field();
    this.error = validateAnswer(f, s.answers[f.id], s.answers, this.lang);
    if (this.error) { this.render(true); return; }
    var r = s.advance(shownTotal);
    if (r.changed) this.flash = t('countChanged', this.lang, { total: r.total });
    this.save();
    this.render(true);
  };

  SavannaOnboardingForm.prototype.onChange = function (e) {
    var f = this.state.mode === 'question' && this.state.field();
    if (!f) return;
    if (f.type === 'ethdate') {
      this.collect();
      var v = this.state.answers[f.id], st = this.querySelector('.dm-status');
      if (st) st.textContent = v && v.gregorian ? t('gregorian', this.lang, { date: fmtGregorian(new Date(v.gregorian), this.lang) }) : '';
    }
    if (this.easy && (f.type === 'choice' || f.type === 'multi' || f.type === 'consent') && e.target.closest) {
      var lab = e.target.closest('.dm-opt');
      if (lab && e.target.checked) speak(lab.textContent.trim(), this.lang);
    }
  };

  SavannaOnboardingForm.prototype.onClick = function (e) {
    var b = e.target.closest('[data-act]');
    if (!b || !this.contains(b)) return;
    this._interacted = true;
    var act = b.getAttribute('data-act'), s = this.state;
    if (act === 'focus-input') { e.preventDefault(); var i = this.ref('input'); if (i) i.focus(); return; }
    if (act === 'back') {
      stopSpeaking(); this.error = '';
      if (!s.returnToReview) this.collect(); // Back from a "Change" discards the unsaved edit, as before
      s.back(this.welcomeOn);
      this.save(); this.render(true); return;
    }
    if (act === 'lang') {
      this.collect();
      this.lang = this.lang === 'am' ? 'en' : 'am'; this.error = ''; this.savePrefs(); this.render(true); return;
    }
    if (act === 'easy') {
      this.collect();
      this.easy = !this.easy; this.savePrefs(); stopSpeaking(); this.render(false);
      var eb = this.querySelector('[data-act=easy]'); if (eb) eb.focus();
      return;
    }
    if (act === 'help') {
      this.collect();
      this.helpOpen = !this.helpOpen; this.render(false);
      var target = this.helpOpen ? this.querySelector('[data-ref=help] h2') : this.querySelector('[data-act=help]');
      if (target) { if (this.helpOpen) target.setAttribute('tabindex', '-1'); target.focus(); }
      return;
    }
    if (act === 'listen') { this.readQuestion(); return; }
    if (act === 'speak') { this.startVoice(); return; }
    if (act === 'change') { s.change(parseInt(b.getAttribute('data-step'), 10)); this.render(true); return; }
    if (act === 'later') {
      this.collect(); s.makeResumeCode(); this.save();
      s.mode = 'saved'; this.render(true); return;
    }
    if (act === 'resume') { s.mode = 'question'; this.render(true); return; }
    if (act === 'voice-allow') { store.set('voiceConsent', true); this.startVoice(); return; }
    if (act === 'voice-deny') { store.set('voiceConsent', false); this.voiceReset(); var inp = this.ref('input'); if (inp) inp.focus(); return; }
    if (act === 'heard-yes') { this.confirmVoice(); return; }
    if (act === 'heard-alt') { var ed = this.ref('heard-edit'); if (ed && this.voice) { ed.value = this.voice.others[+b.getAttribute('data-alt')]; ed.focus(); } return; }
    if (act === 'heard-again') { this.voiceReset(); this.startVoice(); return; }
    if (act === 'heard-type') { this.voiceReset(); this.status(t('voiceDiscarded', this.lang)); var ti = this.ref('input'); if (ti) ti.focus(); return; }
  };

  SavannaOnboardingForm.prototype.status = function (msg) { var s = this.querySelector('.dm-status'); if (s) { s.textContent = ''; setTimeout(function () { s.textContent = msg; }, 50); } };
  SavannaOnboardingForm.prototype.setHeard = function (html) { var h = this.ref('heard'); if (h) h.innerHTML = html; };

  SavannaOnboardingForm.prototype.readQuestion = function () {
    var lang = this.lang, text, audio, mode = this.state.mode;
    if (mode === 'question') {
      var f = this.state.field();
      text = L(f.label, lang) + '. ' + (f.body ? L(f.body, lang) + '. ' : '') + (f.hint ? L(f.hint, lang) + '. ' : '');
      var opts = optionsOf(f);
      if (opts.length) text += opts.map(function (o) { return L(o.label, lang); }).join('. ');
      audio = f.audio && f.audio[lang];
    } else if (mode === 'welcome') {
      text = t('welcomeTitle', lang) + '. ' + t('welcomeHint', lang) + '. ' + MODES.map(function (m) { return t('m_' + m, lang); }).join('. ');
    } else {
      var q = this.querySelector('.dm-q'); text = q ? q.textContent : '';
    }
    if (!speech.output.speak(text, lang, audio)) this.status(t('noAmVoice', lang));
  };

  /* --- voice input: a small state machine ---
     idle -> consent (our explanation, first use only) -> listening (browser may ask for the microphone)
     -> processing -> review (editable transcript) -> confirmed, or -> error / discarded.
     The transcript lives only in this.voice and in the review panel. It is written into the answer only when the
     learner chooses "Use this answer", and saved only when they choose Continue, like typing. */
  SavannaOnboardingForm.prototype.setVoiceButton = function (on) {
    var b = this.querySelector('[data-act=speak]'), lang = this.lang;
    if (!b) return;
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('dm-mic-on', on);
    b.textContent = on ? '⏹ ' + t('stop', lang) : '🎤 ' + t('speak', lang);
  };
  SavannaOnboardingForm.prototype.voiceReset = function () {
    if (this.voice && this.voice.session) this.voice.session.abort();
    this.voice = null; this.setHeard(''); this.setVoiceButton(false);
  };
  SavannaOnboardingForm.prototype.startVoice = function () {
    var lang = this.lang, self = this, f = this.state.field();
    if (!voiceAllowed(f)) return; // never on sensitive questions
    if (!speech.input.supported()) { this.status(t('voiceUnsupported', lang)); return; }
    if (store.get('voiceConsent', null) !== true) {
      this.voice = { state: 'consent', field: f };
      this.setHeard(View.voiceConsent(this.vm()));
      var h = this.ref('vc'); if (h) h.focus();
      return;
    }
    if (this.voice && this.voice.state === 'listening') { // second press: stop listening and use what was heard
      this.voice.state = 'processing'; this.voice.session.stop(); this.setVoiceButton(false); this.status(t('processing', lang)); return;
    }
    this.voiceReset();
    speech.output.stop();
    var v = this.voice = { state: 'listening', field: f };
    this.setVoiceButton(true);
    this.status(t('listening', lang) + ' ' + t('micAsk', lang));
    var handlers = {
      result: function (alts) { if (self.voice === v) self.handleTranscript(f, alts); },
      error: function (code) {
        if (self.voice !== v || code === 'aborted') return;
        v.state = 'error'; self.setVoiceButton(false);
        self.status(t({ 'not-allowed': 'voiceDenied', network: 'voiceNetwork', 'no-speech': 'voiceNoSpeech', 'audio-capture': 'voiceNoMic', 'language-not-supported': 'voiceLangUnsupported' }[code] || 'voiceError', lang));
      },
      end: function () {
        if (self.voice !== v) return;
        self.setVoiceButton(false);
        if (v.state === 'listening' || v.state === 'processing') { v.state = 'idle'; }
      }
    };
    try { v.session = speech.input.start(lang, handlers); }
    catch (e) { v.state = 'error'; this.setVoiceButton(false); this.status(t('voiceError', lang)); }
  };

  SavannaOnboardingForm.prototype.handleTranscript = function (f, alts) {
    var lang = this.lang, said = (alts[0] || '').trim(), v = this.voice;
    v.transcript = said; v.others = [];
    if (f.type === 'choice' || f.type === 'consent' || f.type === 'multi') {
      var opts = optionsOf(f), hits = [];
      for (var i = 0; i < alts.length && !hits.length; i++) hits = matchOptions(alts[i], opts);
      if (!hits.length) { v.state = 'error'; this.status(t('voiceNoMatch', lang)); return; }
      if (f.type !== 'multi') hits = [hits[0]];
      v.hits = hits;
      v.shown = hits.map(function (val) { var o = opts.filter(function (x) { return x.value === val; })[0]; return o ? L(o.label, lang) : val; }).join(', ');
    } else {
      v.value = f.type === 'tel' ? spokenDigits(said) : said;
      v.shown = v.value;
      if (f.type === 'text' || f.type === 'textarea') v.others = alts.slice(1).map(function (a) { return (a || '').trim(); }).filter(function (a) { return a && a !== said; });
    }
    v.state = 'review';
    this.setVoiceButton(false);
    this.setHeard(View.heard(this.vm(), v));
    var hh = this.ref('heard-h'); if (hh) hh.focus();
    speech.output.speak(t('heard', lang) + ' ' + v.shown, lang);
  };

  /* The learner checked the transcript: only now does it become the answer (still saved only on Continue). */
  SavannaOnboardingForm.prototype.confirmVoice = function () {
    var v = this.voice, form = this.querySelector('.dm-form');
    if (!v || v.state !== 'review' || !form) return;
    if (v.hits) {
      if (v.field.type !== 'multi') Array.prototype.forEach.call(form.querySelectorAll('input[name=v]'), function (i) { i.checked = false; });
      v.hits.forEach(function (val) { var inp = form.querySelector('input[name=v][value="' + val + '"]'); if (inp) inp.checked = true; });
    } else {
      var ed = this.ref('heard-edit'), inp = this.ref('input');
      if (inp) inp.value = ed ? ed.value : v.value;
    }
    v.state = 'confirmed'; this.voice = null; this.setHeard('');
    this.status(t('voiceUsed', this.lang));
    var nb = form.querySelector('button[type=submit]'); if (nb) nb.focus();
  };

  SavannaOnboardingForm.prototype.finish = function () {
    var answers = this.state.finish(); // only questions that were shown; the draft is deleted
    this.render(true);
    emit(this, 'complete', { form: this.getAttribute('form'), instance: this.getAttribute('instance') || null, lang: this.lang, answers: answers }, true);
  };

  if (!customElements.get('savanna-onboarding-form')) customElements.define('savanna-onboarding-form', SavannaOnboardingForm);
  // Deprecated alias: a subclass, because one constructor can only be registered once.
  if (!customElements.get('dimts-form')) customElements.define('dimts-form', class extends SavannaOnboardingForm {});

  /* ---------- <savanna-onboarding-settings>: one place to change preferences; changes apply everywhere at once ---------- */
  class SavannaOnboardingSettings extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      injectCss(); applyPrefs();
      var self = this;
      this.addEventListener('change', function (e) {
        var n = e.target.name, v = e.target.value, patch = {};
        if (n === 'voice') { // consent to voice input, given or withdrawn here at any time
          store.set('voiceConsent', v === 'on');
          var ve = self.querySelector('input[name=voice][value="' + v + '"]'); if (ve) ve.focus();
          var vs = self.querySelector('.dm-status');
          if (vs) { vs.textContent = ''; setTimeout(function () { vs.textContent = t('settingsSaved', getPrefs().lang); }, 50); }
          return;
        }
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
      document.addEventListener('savanna-onboarding:prefs', this._onPrefs);
      this.render();
    }
    disconnectedCallback() { document.removeEventListener('savanna-onboarding:prefs', this._onPrefs); this._ready = false; }
    render() {
      var p = getPrefs(), lang = p.lang;
      function group(name, legend, options, current, hint) {
        var hid = hint ? 'so-set-' + name + '-hint' : '';
        return '<fieldset' + (hint ? ' aria-describedby="' + hid + '"' : '') + '><legend>' + legend + '</legend>' + (hint ? '<p id="' + hid + '" class="dm-hint">' + hint + '</p>' : '') + '<div class="dm-opts">' + options.map(function (o) {
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
        group('voice', t('s_voice', lang), [['on', t('voice_on', lang)], ['off', t('voice_off', lang)]], store.get('voiceConsent', null) === true ? 'on' : 'off', t('s_voiceHint', lang)) +
        '<p class="dm-status" role="status" aria-live="polite"></p></form></div>';
    }
  }
  if (!customElements.get('savanna-onboarding-settings')) customElements.define('savanna-onboarding-settings', SavannaOnboardingSettings);
  if (!customElements.get('dimts-settings')) customElements.define('dimts-settings', class extends SavannaOnboardingSettings {});
  injectCss(); // tokens are available to the host page as soon as the script runs
  applyPrefs();

  /* Resume links (?resume=CODE): the draft is stored on this device under its form, so the form finds it by itself.
     A code that is not on this device (the link was opened on another phone) is explained by the form. */

  var API = window.SavannaOnboarding = {
    version: '0.5.0', register: register, forms: FORMS, NEEDS: NEEDS, store: store, setStorage: setStorage, setSpeech: setSpeech,
    FormState: FormState, validate: validateAnswer,
    eth: { toGregorian: ethToGregorian, valid: ethValid, months: ETH_MONTHS, daysInMonth: ethDaysInMonth },
    speak: speak, stopSpeaking: stopSpeaking, label: L,
    prefs: getPrefs, setPrefs: setPrefs
  };
  window.Dimts = API; // deprecated alias
  emit(document, 'ready', null);
})();
