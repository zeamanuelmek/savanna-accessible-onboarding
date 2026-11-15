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
  /* Languages: Amharic (default), English and Afaan Oromo. Each name is written in its own language.
     Afaan Oromo is a DRAFT for native-speaker review; where a text has no Oromo version yet, English is shown. */
  var LANGS = ['am', 'en', 'om'];
  var LANG_NAMES = { am: 'አማርኛ', en: 'English', om: 'Afaan Oromoo' };
  // Speech codes for the browser engines. Few browsers have Oromo voices or recognition: they then say so, and
  // everything stays written on the screen.
  var SPEECH_CODES = { am: 'am-ET', en: 'en-US', om: 'om-ET' };
  // easy = read aloud. pictures = pictures and bigger buttons (separate since Phase 4; older saves follow "simple" mode).
  function getPrefs() {
    var p = store.get('prefs', {});
    return { lang: LANGS.indexOf(p.lang) !== -1 ? p.lang : 'am', easy: !!p.easy, pictures: p.pictures != null ? !!p.pictures : p.mode === 'simple',
      mode: p.mode || '', size: p.size || 'normal', contrast: p.contrast || 'normal', motion: p.motion === 'reduce' ? 'reduce' : 'normal' };
  }
  function applyPrefs() {
    var p = getPrefs(), root = document.documentElement;
    root.setAttribute('data-dm-size', p.size);
    root.setAttribute('data-dm-contrast', p.contrast);
    root.setAttribute('data-dm-motion', p.motion); // "Stop motion": no animations, transitions or smooth scrolling
  }
  /* Events are named savanna-onboarding:<name>. The old dimts:<name> event is also sent (deprecated alias). */
  function emit(target, name, detail, bubbles) {
    target.dispatchEvent(new CustomEvent('savanna-onboarding:' + name, { bubbles: !!bubbles, detail: detail }));
    target.dispatchEvent(new CustomEvent('dimts:' + name, { bubbles: !!bubbles, detail: detail }));
  }
  // Values a preference may take; anything else is ignored (a host bug can never wipe the learner's choices)
  var PREF_VALUES = { lang: LANGS, size: ['normal', 'large', 'xlarge'], contrast: ['normal', 'high'], motion: ['normal', 'reduce'], mode: [''].concat(MODES) };
  function setPrefs(patch) {
    var p = getPrefs();
    Object.keys(patch || {}).forEach(function (k) {
      if (PREF_VALUES[k] && PREF_VALUES[k].indexOf(patch[k]) === -1) return;
      p[k] = patch[k];
    });
    store.set('prefs', p);
    applyPrefs();
    emit(document, 'prefs', p);
    return p;
  }
  // Choosing a way of answering sets sensible defaults; each can still be changed separately in Settings.
  function prefsForMode(mode) {
    var p = getPrefs(), patch = { mode: mode, easy: mode !== 'read_type', pictures: mode === 'simple' };
    if (mode === 'simple' && p.size === 'normal') patch.size = 'large';
    return patch;
  }

  /* ---------- interface strings (Amharic to be reviewed by a native speaker) ---------- */
  var UI = {
    en: {
      back: 'Back', next: 'Continue', submit: 'Submit', listen: 'Listen to the question',
      speak: 'Answer by voice', stop: 'Stop listening', listening: 'Microphone on. Listening… speak now, and press Stop listening when you have finished.',
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
      day: 'Day', month: 'Month', year: 'Year', chooseMonth: 'Choose a month', chooseDay: 'Choose a day', chooseYear: 'Choose a year',
      gregorian: 'In the Gregorian calendar this is {date}.', ethiopian: 'In the Ethiopian calendar this is {date}.',
      calendar: 'Which calendar do you use?', calEth: 'Ethiopian calendar', calGreg: 'Gregorian (European) calendar',
      errDateGreg: 'Enter a real date in the Gregorian calendar, for example 5 March 1995.',
      voiceNoDate: 'I did not catch a date. Say the day, the month and the year, for example "12 Meskerem 1995", or type it below.',
      prefilled: 'We filled this in from your profile. You can change it.',
      welcomeTitle: 'How would you like to complete registration?',
      welcomeHint: 'This is only about how you like to use the form. We never ask why. You can change it at any time in Settings.',
      m_read_type: 'Read and type', m_listen: 'Listen and respond', m_speak: 'Speak my answers', m_simple: 'Simple steps with pictures and big text',
      errMode: 'Choose one way to continue.',
      settings: 'Settings', settingsHint: 'Your settings are saved on this phone and used everywhere this tool appears.',
      s_lang: 'Language', s_size: 'Text size', s_contrast: 'Contrast', s_mode: 'How I like to answer', s_read: 'Read aloud',
      s_readHint: 'Questions are read out, and every answer has its own Listen button. Everything is also written on the screen.',
      s_pictures: 'Pictures and bigger buttons',
      askHelperDone: 'I have the phone back', voiceAmbiguous: 'I heard more than one answer. Please say just one, or tap your answer.',
      srTip: 'If your screen reader spells Amharic letters one by one, turn on Read aloud to hear recorded Amharic, or switch to English.',
      s_offlineAudio: 'Amharic audio for offline use',
      oa_intro: 'Recordings are kept on this phone the first time they play. You can also download them all now, so they work with no connection.',
      oa_download: 'Download Amharic audio for offline use (about {mb} MB)', oa_remove: 'Remove downloaded audio',
      oa_progressLabel: 'Download progress', oa_progress: 'Downloading: {done} of {total} recordings ({mbDone} of {mb} MB).',
      oa_started: 'Downloading Amharic audio.', oa_done: 'Done. {n} recordings are on this phone and work offline.',
      oa_partial: 'Downloaded {done} of {total}. {failed} could not be downloaded. Check the connection and try again.',
      oa_stored: '{n} of {total} recordings are on this phone.', oa_notStored: 'No recordings are downloaded yet.',
      oa_removed: 'Downloaded audio was removed from this phone.', oa_offline: 'You need a connection to download.',
      oa_none: 'Amharic recordings are not available yet.', oa_unsupported: 'This browser cannot keep audio for offline use.',
      offline: 'You are offline. Your answers are saved on this phone, and you can keep going. Voice answers need a connection.',
      online: 'You are back online.',
      play: 'Listen', pause: 'Pause', resume: 'Resume', stopAudio: 'Stop', replay: 'Play again',
      noAudio: 'There is no recording for this yet, and this phone has no voice for this language. Everything is written on the screen.',
      clipFailed: 'A recording could not be played, so the phone\'s voice is reading instead.',
      size_normal: 'Normal', size_large: 'Large', size_xlarge: 'Extra large',
      s_motion: 'Motion', motion_normal: 'Allow animations', motion_reduce: 'Stop motion',
      s_motionHint: 'Stops animations, sliding and smooth scrolling.',
      s_preview: 'Preview', previewText: 'This is how text and buttons look with your settings.', previewBtn: 'Example button',
      contrast_normal: 'Standard', contrast_high: 'High contrast',
      on: 'On', off: 'Off',
      settingsSaved: 'Saved. This setting now applies everywhere this tool is used on this phone.',
      countChanged: 'Your answer changed the number of questions. There are now {total} questions.',
      resumeMissing: 'We could not find saved answers for this link on this phone. Answers are saved only on the phone where you started. You can start again here.'
    },
    am: {
      back: 'ተመለስ', next: 'ቀጥል', submit: 'ላክ', listen: 'ጥያቄውን አዳምጥ',
      speak: 'በድምፅ ይመልሱ', stop: 'ማዳመጥ አቁም', listening: 'ማይክሮፎኑ በርቷል። እያዳመጥኩ ነው… አሁን ይናገሩ፤ ሲጨርሱ «ማዳመጥ አቁም»ን ይጫኑ።',
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
      day: 'ቀን', month: 'ወር', year: 'ዓመት', chooseMonth: 'ወር ይምረጡ', chooseDay: 'ቀን ይምረጡ', chooseYear: 'ዓመት ይምረጡ',
      gregorian: 'በፈረንጆች አቆጣጠር {date} ነው።', ethiopian: 'በኢትዮጵያ አቆጣጠር {date} ነው።',
      calendar: 'የትኛውን አቆጣጠር ይጠቀማሉ?', calEth: 'የኢትዮጵያ አቆጣጠር', calGreg: 'የፈረንጆች (የአውሮፓ) አቆጣጠር',
      errDateGreg: 'በፈረንጆች አቆጣጠር ትክክለኛ ቀን ያስገቡ፤ ለምሳሌ 5 March 1995።',
      voiceNoDate: 'ቀን አልሰማሁም። ቀኑን፣ ወሩንና ዓመቱን ይናገሩ፤ ለምሳሌ «12 መስከረም 1995»፤ ወይም ከታች ይጻፉት።',
      prefilled: 'ይህን ከመገለጫዎ ሞልተነዋል። መቀየር ይችላሉ።',
      welcomeTitle: 'ምዝገባውን እንዴት መሙላት ይፈልጋሉ?',
      welcomeHint: 'ይህ ቅጹን መጠቀም የሚመርጡበትን መንገድ ብቻ ነው። ምክንያቱን በፍጹም አንጠይቅም። በማንኛውም ጊዜ በቅንብሮች ውስጥ መቀየር ይችላሉ።',
      m_read_type: 'አንብቤ እጽፋለሁ', m_listen: 'አዳምጬ እመልሳለሁ', m_speak: 'በድምፅ እመልሳለሁ', m_simple: 'ቀላል ደረጃዎች ከሥዕልና ከትልቅ ጽሑፍ ጋር',
      errMode: 'ለመቀጠል አንድ መንገድ ይምረጡ።',
      settings: 'ቅንብሮች', settingsHint: 'ቅንብሮችዎ በዚህ ስልክ ላይ ይቀመጣሉ፤ ይህ መሣሪያ በሚገኝበት ቦታ ሁሉ ይሠራሉ።',
      s_lang: 'ቋንቋ', s_size: 'የጽሑፍ መጠን', s_contrast: 'ንፅፅር', s_mode: 'መመለስ የምመርጥበት መንገድ', s_read: 'ጮክ ብሎ ማንበብ',
      s_readHint: 'ጥያቄዎች ይነበባሉ፤ እያንዳንዱ መልስም የራሱ «አዳምጥ» አዝራር አለው። ሁሉም ነገር በማያ ገጹ ላይም ተጽፏል።',
      s_pictures: 'ሥዕሎችና ትልልቅ አዝራሮች',
      askHelperDone: 'ስልኩ ተመልሶልኛል', voiceAmbiguous: 'ከአንድ በላይ መልስ ሰማሁ። እባክዎ አንዱን ብቻ ይናገሩ ወይም መልስዎን ይንኩ።',
      srTip: 'የስክሪን አንባቢዎ የአማርኛ ፊደላትን አንድ በአንድ የሚያነብ ከሆነ፣ የተቀዳውን የአማርኛ ድምፅ ለመስማት «ጮክ ብሎ ማንበብ»ን ያብሩ፣ ወይም ወደ እንግሊዝኛ ይቀይሩ።',
      s_offlineAudio: 'ከኢንተርኔት ውጪ ለመጠቀም የአማርኛ ድምፅ',
      oa_intro: 'ቅጂዎች ለመጀመሪያ ጊዜ ሲጫወቱ በዚህ ስልክ ላይ ይቀመጣሉ። ያለ ግንኙነት እንዲሠሩ ሁሉንም አሁን ማውረድም ይችላሉ።',
      oa_download: 'የአማርኛ ድምፅን ከኢንተርኔት ውጪ ለመጠቀም አውርድ (ወደ {mb} ሜባ ገደማ)', oa_remove: 'የወረደውን ድምፅ አስወግድ',
      oa_progressLabel: 'የማውረድ ሂደት', oa_progress: 'በማውረድ ላይ፦ ከ{total} ቅጂዎች {done} ({mbDone} ከ{mb} ሜባ)።',
      oa_started: 'የአማርኛ ድምፅ በማውረድ ላይ።', oa_done: 'ተጠናቋል። {n} ቅጂዎች በዚህ ስልክ ላይ አሉ፤ ያለ ግንኙነትም ይሠራሉ።',
      oa_partial: 'ከ{total} {done} ወርዷል። {failed} ማውረድ አልተቻለም። ግንኙነቱን ያረጋግጡና እንደገና ይሞክሩ።',
      oa_stored: 'ከ{total} ቅጂዎች {n} በዚህ ስልክ ላይ አሉ።', oa_notStored: 'እስካሁን ምንም ቅጂ አልወረደም።',
      oa_removed: 'የወረደው ድምፅ ከዚህ ስልክ ተሰርዟል።', oa_offline: 'ለማውረድ የኢንተርኔት ግንኙነት ያስፈልጋል።',
      oa_none: 'የአማርኛ ቅጂዎች ገና አልተዘጋጁም።', oa_unsupported: 'ይህ ብራውዘር ድምፅን ከኢንተርኔት ውጪ ለመጠቀም ማስቀመጥ አይችልም።',
      offline: 'ከኢንተርኔት ውጪ ነዎት። መልሶችዎ በዚህ ስልክ ላይ ይቀመጣሉ፤ መቀጠልም ይችላሉ። በድምፅ መመለስ ግንኙነት ያስፈልገዋል።',
      online: 'እንደገና ከኢንተርኔት ጋር ተገናኝተዋል።',
      play: 'አዳምጥ', pause: 'ለአፍታ አቁም', resume: 'ማጫወት ቀጥል', stopAudio: 'አቁም', replay: 'እንደገና አጫውት',
      noAudio: 'ለዚህ ገና ቅጂ የለም፤ ይህ ስልክም ለዚህ ቋንቋ ድምፅ የለውም። ሁሉም ነገር በማያ ገጹ ላይ ተጽፏል።',
      clipFailed: 'ቅጂው መጫወት አልቻለም፤ ስለዚህ የስልኩ ድምፅ እያነበበ ነው።',
      s_motion: 'እንቅስቃሴ', motion_normal: 'እንቅስቃሴ ፍቀድ', motion_reduce: 'እንቅስቃሴ አቁም',
      s_motionHint: 'እንቅስቃሴዎችን፣ መንሸራተትንና ቀስ ብሎ መሸብለልን ያቆማል።',
      s_preview: 'ቅድመ እይታ', previewText: 'በቅንብሮችዎ ጽሑፍና አዝራሮች እንደዚህ ይታያሉ።', previewBtn: 'የምሳሌ አዝራር',
      size_normal: 'መደበኛ', size_large: 'ትልቅ', size_xlarge: 'በጣም ትልቅ',
      contrast_normal: 'መደበኛ', contrast_high: 'ከፍተኛ ንፅፅር',
      on: 'በርቷል', off: 'ጠፍቷል',
      settingsSaved: 'ተቀምጧል። ይህ ቅንብር ይህ መሣሪያ በዚህ ስልክ በሚሠራበት ቦታ ሁሉ ይተገበራል።',
      countChanged: 'መልስዎ የጥያቄዎቹን ብዛት ቀይሯል። አሁን {total} ጥያቄዎች አሉ።',
      resumeMissing: 'ለዚህ ሊንክ የተቀመጡ መልሶችን በዚህ ስልክ ላይ ማግኘት አልቻልንም። መልሶች የሚቀመጡት በጀመሩበት ስልክ ላይ ብቻ ነው። እዚህ እንደገና መጀመር ይችላሉ።'
    },
    // Afaan Oromo: DRAFT for review by a native speaker (team review planned)
    om: {
      back: 'Duubatti',
      next: 'Itti fufi',
      submit: 'Ergi',
      listen: 'Gaaffii dhaggeeffadhu',
      speak: 'Sagaleen deebisi',
      stop: 'Dhaggeeffachuu dhaabi',
      listening: 'Maayikiraafoonni banameera. Dhaggeeffachaa jira… amma dubbadhu, yoo xumurte "Dhaggeeffachuu dhaabi" tuqi.',
      heard: 'Kan ani dhage\'e:',
      yes: 'Deebii kana fayyadami',
      again: 'Irra deebi\'ii jedhi',
      type: 'Kanaa mannaa barreessi',
      micAsk: 'Biraawuzarri kee maayikiraafoonii fayyadamuuf hayyama si gaafachuu danda\'a. "Hayyami" filadhu.',
      micOn: 'Maayikiraafoonni banameera',
      processing: 'Waan jette hubachaa jira…',
      heardCheck: 'Ilaali, yoo barbaachise sirreessi. Hanga "Deebii kana fayyadami" filattutti homtuu hin kuufamu.',
      tapInstead: 'Kanaa mannaa tuqi',
      heardEdit: 'Deebii kee, sagalee kee irraa',
      heardMatch: 'Kun wal sima:',
      orDid: 'Moo kana jettee:',
      voiceUsed: 'Deebiin sagalee kee irraa itti dabalameera. Ilaali, achiis "Itti fufi" filadhu.',
      voiceDiscarded: 'Deebiin sagalee kuffifameera. Deebii kee barreessi ykn tuqi.',
      voiceCheckFirst: 'Dura deebii sagalee kee ilaali: "Deebii kana fayyadami" ykn "Kanaa mannaa barreessi" filadhu.',
      voiceDenied: 'Maayikiraafoonni cufameera. Kanaa mannaa barreessuu ykn tuquu dandeessa, ykn qindaa\'ina biraawuzaraa keessatti maayikiraafoonii hayyami.',
      voiceNetwork: 'Deebiin sagaleen walqunnamtii interneetii barbaada. Maaloo deebii kee barreessi ykn tuqi.',
      voiceNoSpeech: 'Homaa hin dhageenye. Irra deebi\'ii yaali, ykn deebii kee barreessi ykn tuqi.',
      voiceNoMic: 'Maayikiraafoonni hin argamne. Maaloo deebii kee barreessi ykn tuqi.',
      voiceLangUnsupported: 'Deebiin sagaleen afaan kanaan biraawuzara kana irratti hin jiru. Maaloo deebii kee barreessi ykn tuqi.',
      s_voice: 'Deebii sagaleen',
      voice_on: 'Hayyamameera',
      voice_off: 'Hin hayyamamne',
      s_voiceHint: 'Sagalee kee gara barreeffamaatti jijjiiruuf, biraawuzarri kun waraabbii kee Google\'tti erga. Gaaffii eenyummaa ykn deeggarsaa irratti sagaleen gonkumaa hin dhiyaatu.',
      progress: 'Gaaffii {n} kan {total} keessaa',
      optional: '(dirqama miti)',
      problem: 'Rakkoon jira',
      review: 'Deebii kee mirkaneessi',
      reviewHint: 'Osoo hin ergin dura wanti hundi sirrii ta\'uu isaa mirkaneeffadhu.',
      change: 'Jijjiiri',
      notGiven: 'Hin kennamne',
      later: 'Booda xumuri',
      help: 'Gargaarsa argadhu',
      helpTitle: 'Gargaarsa barbaaddaa?',
      helpClose: 'Gargaarsa cufi',
      helpText: 'Daangaan yeroo hin jiru. Deebiin kee gaaffii hunda booda bilbila kana irratti kuufama. Dhaabbata michuu kan akka AAAPD akka siif guutu gaafachuu ykn booda deebi\'uu dandeessa.',
      easyOn: 'Sagaleen dubbisi: banaa',
      easyOff: 'Sagaleen dubbisi: cufaa',
      langSwitch: 'Afaan Oromoo',
      langSwitchLabel: 'Afaan gara Afaan Oromootti jijjiiri',
      resumed: 'Baga nagaan deebite. Deebii kee kuufneerra.',
      savedTitle: 'Deebiin kee kuufameera',
      savedText: 'Homtuu hin badne. Itti fufuuf geessituu kana bilbila kana irratti bani:',
      smsPreview: 'Gosa dhugaa keessatti ergaa gabaabaa (SMS) kana siif ergina turre:',
      voiceConsentTitle: 'Osoo sagalee kee hin fayyadamin dura',
      voiceConsent: 'Sagalee kee gara barreeffamaatti jijjiiruuf, biraawuzarri kun waraabbii kee Google\'tti erga. Kanaa mannaa barreessuu ykn tuquu dandeessa. Yeroo kamiyyuu Qindaa\'ina keessatti cufuu dandeessa. Sagalee kee fayyadamuu barbaaddaa?',
      voiceAllow: 'Eeyyee, sagalee koo fayyadami',
      voiceDeny: 'Lakki, nan barreessa ykn nan tuqa',
      voiceUnsupported: 'Deebiin sagaleen biraawuzara kana irratti hin jiru. Chrome Android irratti yaali, ykn deebii kee barreessi ykn tuqi.',
      voiceNoMatch: 'Filannoo keessaa tokkollee hin qabanne. Maaloo irra deebi\'ii jedhi ykn deebii kee tuqi.',
      voiceError: 'Maayikiraafoonni hin hojjenne. Maaloo deebii kee barreessi ykn tuqi.',
      noAmVoice: 'Sagaleen Afaan Amaaraa ammaaf meeshaa kana irratti hin jiru. Sagaleen waraabame ni dabalama.',
      saved: 'Kuufameera.',
      selected: 'Filatameera:',
      errRequired: 'Itti fufuuf maaloo gaaffii kana deebisi.',
      errChoice: 'Itti fufuuf deebii tokko filadhu.',
      errMulti: 'Yoo xiqqaate deebii tokko filadhu.',
      errPhone: 'Lakkoofsa bilbilaa dijiitii 10 qabu galchi, fakkeenyaaf 0911 234 567.',
      errDate: 'Guyyaa dhugaa dhaha Itoophiyaatiin galchi. Guyyaan 1 hanga 30, Qaammee 1 hanga 5 ykn 6.',
      errConsent: 'Itti fufuuf walii galuu qabda. Yoo hin mirkaneeffatin, "Gargaarsa argadhu" filadhu.',
      day: 'Guyyaa',
      month: 'Ji\'a',
      year: 'Waggaa',
      chooseMonth: 'Ji\'a filadhu',
      chooseDay: 'Guyyaa filadhu',
      chooseYear: 'Waggaa filadhu',
      gregorian: 'Dhaha Gorgooriyaanitti kun {date} dha.',
      ethiopian: 'Dhaha Itoophiyaatiin kun {date} dha.',
      calendar: 'Dhaha kam fayyadamta?',
      calEth: 'Dhaha Itoophiyaa',
      calGreg: 'Dhaha Gorgooriyaan (Awurooppaa)',
      errDateGreg: 'Guyyaa dhugaa dhaha Gorgooriyaaniitiin galchi, fakkeenyaaf 5 Bitootessa 1995.',
      voiceNoDate: 'Guyyaa hin qabanne. Guyyaa, ji\'aa fi waggaa jedhi, fakkeenyaaf "12 Fulbaana 1995", ykn armaan gaditti barreessi.',
      prefilled: 'Kana piroofaayilii kee irraa guutneerra. Jijjiiruu dandeessa.',
      welcomeTitle: 'Galmee akkamitti xumuruu barbaadda?',
      welcomeHint: 'Kun akkaataa unka kana itti fayyadamuu barbaaddu qofa ilaala. Sababa gonkumaa hin gaafannu. Yeroo kamiyyuu Qindaa\'ina keessatti jijjiiruu dandeessa.',
      m_read_type: 'Dubbisuu fi barreessuu',
      m_listen: 'Dhaggeeffachuu fi deebisuu',
      m_speak: 'Deebii koo sagaleen kennuu',
      m_simple: 'Tarkaanfii salphaa fakkii fi barreeffama gurguddaa wajjin',
      errMode: 'Itti fufuuf karaa tokko filadhu.',
      settings: 'Qindaa\'ina',
      settingsHint: 'Qindaa\'inni kee bilbila kana irratti kuufamee bakka meeshaan kun mul\'atu hundatti hojjeta.',
      s_lang: 'Afaan',
      s_size: 'Hamma barreeffamaa',
      s_contrast: 'Garaagarummaa halluu',
      s_mode: 'Akkaataa deebisuu barbaadu',
      s_read: 'Sagaleen dubbisi',
      s_readHint: 'Gaaffiiwwan sagaleen dubbifamu, deebii hundi immoo qabduu "Dhaggeeffadhu" mataa isaa qaba. Wanti hundi iskiriinii irrattis ni barreeffama.',
      s_pictures: 'Fakkiiwwan fi qabduuwwan gurguddaa',
      askHelperDone: 'Bilbilli natti deebi\'eera',
      voiceAmbiguous: 'Deebii tokkoo ol dhaga\'e. Maaloo tokko qofa jedhi, ykn deebii kee tuqi.',
      srTip: 'Yoo dubbisaan iskiriinii kee qubee Afaan Amaaraa tokko tokkoon dubbise, sagalee Afaan Amaaraa waraabame dhaggeeffachuuf «Sagaleen dubbisi» bani, ykn gara Ingiliffaatti jijjiiri.',
      s_offlineAudio: 'Sagalee Afaan Amaaraa interneetii malee',
      oa_intro: 'Waraabbiiwwan yeroo jalqabaaf yommuu taphataman bilbila kana irratti kuufamu. Akka walqunnamtii malee hojjetaniif, amma hunda buufachuus dandeessa.',
      oa_download: 'Sagalee Afaan Amaaraa interneetii malee fayyadamuuf buufadhu (gara {mb} MB)',
      oa_remove: 'Sagalee buufame haqi',
      oa_progressLabel: 'Adeemsa buufachuu',
      oa_progress: 'Buufachaa jira: waraabbii {total} keessaa {done} ({mb} MB keessaa {mbDone}).',
      oa_started: 'Sagalee Afaan Amaaraa buufachaa jira.',
      oa_done: 'Xumurameera. Waraabbiin {n} bilbila kana irra jiru, interneetii malees ni hojjetu.',
      oa_partial: '{total} keessaa {done} buufameera. {failed} buufamuu hin dandeenye. Walqunnamtii ilaaliitii irra deebi\'ii yaali.',
      oa_stored: 'Waraabbii {total} keessaa {n} bilbila kana irra jiru.',
      oa_notStored: 'Ammaaf waraabbiin buufame hin jiru.',
      oa_removed: 'Sagaleen buufame bilbila kana irraa haqameera.',
      oa_offline: 'Buufachuuf walqunnamtii barbaadda.',
      oa_none: 'Waraabbiin Afaan Amaaraa ammaaf hin jiru.',
      oa_unsupported: 'Biraawuzarri kun sagalee interneetii malee fayyadamuuf kuusuu hin danda\'u.',
      offline: 'Interneetii irraa ala jirta. Deebiin kee bilbila kana irratti kuufameera, itti fufuu dandeessa. Deebiin sagaleen walqunnamtii barbaada.',
      online: 'Interneetiitti deebi\'teetta.',
      play: 'Dhaggeeffadhu',
      pause: 'Yeroof dhaabi',
      resume: 'Itti fufi',
      stopAudio: 'Dhaabi',
      replay: 'Irra deebi\'ii taphachiisi',
      noAudio: 'Kanaaf ammaaf waraabbiin hin jiru, bilbilli kun immoo afaan kanaaf sagalee hin qabu. Wanti hundi iskiriinii irratti barreeffameera.',
      clipFailed: 'Waraabbiin tokko taphachuu hin dandeenye, kanaaf sagaleen bilbilaa dubbisaa jira.',
      s_motion: 'Sochii', motion_normal: 'Sochii hayyami', motion_reduce: 'Sochii dhaabi',
      s_motionHint: 'Sochii, mucucaachuu fi gadi-ol suuta socho\'uu dhaaba.',
      s_preview: 'Dursa ilaali', previewText: 'Qindaa\'ina keetiin barreeffamni fi qabduuwwan akkana mul\'atu.', previewBtn: 'Qabduu fakkeenyaa',
      size_normal: 'Idilee',
      size_large: 'Guddaa',
      size_xlarge: 'Baay\'ee guddaa',
      contrast_normal: 'Idilee',
      contrast_high: 'Garaagarummaa halluu ol\'aanaa',
      on: 'Banaa',
      off: 'Cufaa',
      settingsSaved: 'Kuufameera. Qindaa\'inni kun amma bakka meeshaan kun bilbila kana irratti itti fayyadamu hundatti hojjeta.',
      countChanged: 'Deebiin kee baay\'ina gaaffiiwwanii jijjiireera. Amma gaaffiiwwan {total} jiru.',
      resumeMissing: 'Geessituu kanaaf deebii kuufame bilbila kana irratti argachuu hin dandeenye. Deebiin kan kuufamu bilbila itti jalqabde qofa irratti. Asitti irra deebi\'ee jalqabuu dandeessa.'
    }
  };
  function t(key, lang, vars) {
    var s = (UI[lang] && UI[lang][key]) || UI.en[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }
  function L(v, lang) {
    if (v == null) return '';
    if (typeof v === 'function') return v(lang) || '';
    if (typeof v === 'string') return v;
    return v[lang] || v.en || '';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- shared support vocabulary (used by learners AND employers) ---------- */
  var NEEDS = [
    { value: 'screen_reader', icon: '📱', label: { en: 'Works with a screen reader', am: 'ከስክሪን አንባቢ ጋር የሚሰራ', om: 'Dubbisaa iskiriinii wajjin kan hojjetu' } },
    { value: 'audio', icon: '🔊', label: { en: 'Audio for everything', am: 'ሁሉም ነገር በድምፅ', om: 'Wanti hundi sagaleen' } },
    { value: 'sign_language', icon: '🤟', label: { en: 'Sign language interpreter', am: 'የምልክት ቋንቋ አስተርጓሚ', om: 'Hiikaa afaan mallattoo' } },
    { value: 'captions', icon: '💬', label: { en: 'Captions on videos and calls', am: 'በቪዲዮና በጥሪ ላይ የጽሑፍ ትርጉም', om: 'Barreeffama viidiyoo fi waamicha irratti' } },
    { value: 'simple_words', icon: '🔤', label: { en: 'Simple words', am: 'ቀላል ቃላት', om: 'Jechoota salphaa' } },
    { value: 'written', icon: '📝', label: { en: 'Instructions in writing', am: 'በጽሑፍ የተሰጠ መመሪያ', om: 'Qajeelfama barreeffamaan' } },
    { value: 'step_free', icon: '♿', label: { en: 'Step-free building access', am: 'ደረጃ የሌለው መግቢያ', om: 'Seensa gamoo sadarkaa malee' } },
    { value: 'extra_time', icon: '⏳', label: { en: 'Extra time for tasks and tests', am: 'ለሥራና ለፈተና ተጨማሪ ጊዜ', om: 'Yeroo dabalataa hojii fi qormaataaf' } },
    { value: 'flexible_hours', icon: '🕒', label: { en: 'Flexible working hours', am: 'ተለዋዋጭ የሥራ ሰዓት', om: 'Sa\'aatii hojii jijjiiramaa' } },
    { value: 'remote', icon: '🏠', label: { en: 'Work from home', am: 'ከቤት መሥራት', om: 'Mana irraa hojjechuu' } },
    { value: 'helper', icon: '🤝', label: { en: 'Someone to help with forms', am: 'ቅጽ ለመሙላት የሚረዳ ሰው', om: 'Nama unka guutuuf gargaaru' } }
  ];

  /* ---------- honest ID trust status. Nothing is ever "verified": there is no verification service. ---------- */
  var TRUST = {
    self_declared: { en: 'Self-declared', am: 'በራስ የተገለጸ', om: 'Ofiin kan himame' },
    document_number_recorded: { en: 'Number recorded — not verified', am: 'ቁጥር ተመዝግቧል — አልተረጋገጠም', om: 'Lakkoofsi galmeeffameera — hin mirkanoofne' },
    partner_referral_pending: { en: 'Partner referral pending', am: 'የአጋር ድርጅት ማረጋገጫ በመጠበቅ ላይ', om: 'Ergaan michuu eegaa jira' }
  };
  /** Trust status from sign-up or profile answers: the ID route and whether a number was given. */
  function trustLevel(a) {
    if (!a || !a.id_route) return 'self_declared';
    if (a.id_route === 'none') return 'partner_referral_pending';
    return a.id_number ? 'document_number_recorded' : 'self_declared';
  }

  /** The ONLY support data an employer may receive: the Support Passport needs, and only when the learner said
      "share" in THIS application. Never other_need, never a reason or condition. Returns NEEDS entries. */
  function supportForEmployer(applyAnswers) {
    if (!applyAnswers || applyAnswers.share_passport !== 'share') return [];
    var p = store.get('passport', null);
    if (!p || !Array.isArray(p.needs)) return [];
    return p.needs.map(function (v) { return NEEDS.filter(function (n) { return n.value === v; })[0]; }).filter(Boolean);
  }

  /* ---------- Ethiopian calendar ---------- */
  var ETH_MONTHS = {
    en: ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miyazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'],
    am: ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'],
    om: ['Fulbaana', 'Onkololeessa', 'Sadaasa', 'Muddee', 'Amajjii', 'Guraandhala', 'Bitootessa', 'Eebila', 'Caamsaa', 'Waxabajjii', 'Adoolessa', 'Hagayya', 'Qaammee']
  };
  function ethToJdn(y, m, d) { return 1724221 + 365 * (y - 1) + Math.floor(y / 4) + 30 * m + d - 31; }
  function ethToGregorian(y, m, d) { return new Date((ethToJdn(y, m, d) - 2440588) * 86400000); }
  function ethDaysInMonth(y, m) { return m < 13 ? 30 : (y % 4 === 3 ? 6 : 5); }
  function ethValid(y, m, d) {
    return Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d) &&
      y >= 1900 && y <= 2030 && m >= 1 && m <= 13 && d >= 1 && d <= ethDaysInMonth(y, m);
  }
  var GREG_MONTHS = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    am: ['ጃንዩወሪ', 'ፌብሩወሪ', 'ማርች', 'ኤፕሪል', 'ሜይ', 'ጁን', 'ጁላይ', 'ኦገስት', 'ሴፕቴምበር', 'ኦክቶበር', 'ኖቬምበር', 'ዲሴምበር'],
    om: ['Amajjii', 'Guraandhala', 'Bitootessa', 'Eebila', 'Caamsaa', 'Waxabajjii', 'Adoolessa', 'Hagayya', 'Fulbaana', 'Onkololeessa', 'Sadaasa', 'Muddee']
  };
  function gregValid(y, m, d) {
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d) || y < 1900 || y > new Date().getFullYear() || m < 1 || m > 12 || d < 1) return false;
    var dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }
  // Gregorian -> Ethiopian (inverse of ethToJdn), for showing a Gregorian date in the Ethiopian calendar
  function gregToEth(date) {
    var jdn = Math.floor(date.getTime() / 86400000) + 2440588, r = (jdn - 1723856) % 1461, n = r % 365 + 365 * Math.floor(r / 1460);
    return { y: 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460), m: Math.floor(n / 30) + 1, d: n % 30 + 1 };
  }
  function monthsFor(cal, lang) { var set = cal === 'greg' ? GREG_MONTHS : ETH_MONTHS; return set[lang] || set.en; }
  /** A date answer: { cal: 'eth' | 'greg', d, m, y, gregorian: 'YYYY-MM-DD' } (older answers without cal are Ethiopian). */
  function dateValue(cal, d, m, y) {
    if (cal === 'greg') return gregValid(y, m, d) ? { cal: 'greg', d: d, m: m, y: y, gregorian: new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10) } : null;
    return ethValid(y, m, d) ? { cal: 'eth', d: d, m: m, y: y, gregorian: ethToGregorian(y, m, d).toISOString().slice(0, 10) } : null;
  }
  function fmtEthiopian(iso, lang) { var e = gregToEth(new Date(iso)); return e.d + ' ' + monthsFor('eth', lang)[e.m - 1] + ' ' + e.y; }
  /* A spoken date: "12 Meskerem 1995", "March 5 1990", "5 3 1990". A month name also tells which calendar is meant. */
  function parseSpokenDate(said, cal) {
    var words = norm(said).split(' ').filter(Boolean), nums = [], month = 0, mcal = '';
    words.forEach(function (w) {
      var digit = AM_DIGITS[w] || EN_DIGITS[w];
      if (/^\d+$/.test(w) || digit) { nums.push(parseInt(digit || w, 10)); return; }
      if (month) return;
      // the chosen calendar first: in Afaan Oromo both calendars use the same month names
      (cal === 'greg' ? [['greg', GREG_MONTHS], ['eth', ETH_MONTHS]] : [['eth', ETH_MONTHS], ['greg', GREG_MONTHS]]).forEach(function (pair) {
        Object.keys(pair[1]).forEach(function (lg) {
          pair[1][lg].forEach(function (name, i) {
            var n = norm(name);
            if (!month && n && (w === n || (n.length > 3 && w.length > 3 && (w.indexOf(n.slice(0, 4)) === 0)))) { month = i + 1; mcal = pair[0]; }
          });
        });
      });
    });
    if (mcal) cal = mcal;
    var y = 0, rest = [];
    nums.forEach(function (n) { if (!y && n >= 1000) y = n; else rest.push(n); });
    var d = rest[0];
    if (!month && rest.length >= 2) month = rest[1];
    return dateValue(cal, d, month, y);
  }
  function fmtGregorian(date, lang) {
    if (lang === 'om') return date.getUTCDate() + ' ' + GREG_MONTHS.om[date.getUTCMonth()] + ' ' + date.getUTCFullYear();
    try { return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); }
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
  function speak(text, lang, audioUrl, done) {
    stopSpeaking();
    if (audioUrl) {
      try { currentAudio = new Audio(audioUrl); if (done) currentAudio.onended = done; currentAudio.play(); return true; } catch (e) {}
    }
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return false;
    var code = SPEECH_CODES[lang] ? lang : 'en';
    var voices = window.speechSynthesis.getVoices() || [];
    var voice = voices.filter(function (v) { return (v.lang || '').toLowerCase().indexOf(code) === 0; })[0];
    if (!voice && code !== 'en') return false; // never read Amharic or Oromo text with an English voice
    var u = new SpeechSynthesisUtterance(text);
    u.lang = SPEECH_CODES[code];
    if (voice) u.voice = voice;
    u.rate = 0.95;
    if (done) { u.onend = done; u.onerror = function (e) { if (!e || e.error !== 'interrupted' && e.error !== 'canceled') done(); }; }
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
  /* The microphone stays on until the learner presses Stop. Browsers end recognition by themselves after a short
     pause (Android Chrome after about a second of silence, even in continuous mode), which cut phone numbers off
     half-way. So each time the browser stops on its own, listening starts again and the words are added together.
     What was heard is handed over only once, after the learner pressed Stop. */
  var browserInput = {
    supported: function () { return !!SR; },
    start: function (lang, h) {
      var heard = [], stopped = false, fatal = null, rec = null, quickEnds = 0, startedAt = 0;
      function segment(r) { var a = []; for (var i = 0; i < r.length; i++) a.push(r[i].transcript); return a; }
      function finish() {
        if (fatal) { h.error(fatal); h.end(); return; }
        if (!heard.length) { if (stopped !== 'abort') h.error('no-speech'); h.end(); return; }
        // best guess = the best words of each part; other guesses only when everything came in one part
        var best = heard.map(function (a) { return (a[0] || '').trim(); }).filter(Boolean).join(' ');
        h.result(heard.length === 1 ? [best].concat(heard[0].slice(1)) : [best]);
        h.end();
      }
      function open() {
        rec = new SR();
        rec.lang = SPEECH_CODES[lang] || 'en-US';
        rec.interimResults = false; rec.maxAlternatives = 3; rec.continuous = true;
        rec.onresult = function (ev) {
          for (var i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) heard.push(segment(ev.results[i]));
        };
        rec.onerror = function (ev) {
          var e = ev && ev.error;
          if (e === 'no-speech' || e === 'aborted') return; // a pause is not an error: keep listening until Stop
          fatal = e === 'service-not-allowed' ? 'not-allowed' : e === 'language-not-supported' || e === 'bad-grammar' ? 'language-not-supported' : e || 'failed';
        };
        rec.onend = function () {
          if (stopped || fatal) { finish(); return; }
          // the browser stopped by itself: listen again. Guard against a browser that refuses at once, over and over.
          quickEnds = Date.now() - startedAt < 400 ? quickEnds + 1 : 0;
          if (quickEnds >= 5) { fatal = 'failed'; finish(); return; }
          try { open(); } catch (e) { fatal = 'failed'; finish(); }
        };
        startedAt = Date.now();
        rec.start();
      }
      open();
      return {
        stop: function () { if (stopped) return; stopped = 'stop'; try { rec.stop(); } catch (e) { finish(); } },
        abort: function () { if (stopped) return; stopped = 'abort'; heard = []; try { rec.abort(); } catch (e) {} }
      };
    }
  };
  var speech = { input: browserInput, output: {
    speak: function (text, lang, audioUrl, done) { return speak(text, lang, audioUrl, done); },
    stop: function () { stopSpeaking(); },
    pause: function () { try { window.speechSynthesis.pause(); } catch (e) {} },
    resume: function () { try { window.speechSynthesis.resume(); } catch (e) {} }
  } };
  function setSpeech(o) { if (o && o.input) speech.input = o.input; if (o && o.output) speech.output = o.output; }

  /* ---------- recorded audio ----------
     Clips live in assets/audio/<lang>/ next to this script, named as in docs/audio-script.md
     (for example am/signup-name-question.mp3). assets/audio/manifest.json lists the clips that exist; it is written by
     "node tools/check-audio.cjs". Only listed clips are requested, so a missing clip never causes a failed download:
     the phone's voice reads instead, and if there is none, a message says the words are on the screen. */
  var AUDIO = { manifest: null, loading: null, failed: {} };
  function loadAudioManifest() {
    if (AUDIO.loading) return AUDIO.loading;
    if (!BASE || !window.fetch) { AUDIO.manifest = {}; AUDIO.loading = Promise.resolve(); return AUDIO.loading; }
    AUDIO.loading = fetch(BASE + 'assets/audio/manifest.json')
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
      .then(function (m) { AUDIO.manifest = m || {}; });
    return AUDIO.loading;
  }
  function clipUrl(key, lang) {
    var list = AUDIO.manifest && AUDIO.manifest[lang], name = list && list[key];
    if (!name) return null;
    var url = BASE + 'assets/audio/' + lang + '/' + name;
    return AUDIO.failed[url] ? null : url;
  }
  function clipKey() { return Array.prototype.join.call(arguments, '-').replace(/_/g, '-'); }

  /* ---------- learner-controlled download of all recordings for offline use (Settings) ---------- */
  var AUDIO_CACHE = 'savanna-onboarding-audio';
  var OfflineAudio = {
    state: 'idle', done: 0, total: 0, bytes: 0, totalBytes: 0, failed: 0, stored: null, subs: [],
    on: function (fn) { this.subs.push(fn); }, off: function (fn) { var k = this.subs.indexOf(fn); if (k !== -1) this.subs.splice(k, 1); },
    emit: function (msg) { var s = this; this.subs.slice().forEach(function (fn) { fn(s, msg); }); },
    canStore: function () { return !!(window.caches && window.fetch && window.isSecureContext !== false); },
    list: function (lang) {
      var m = AUDIO.manifest || {}, files = m[lang] || {}, sizes = (m.bytes && m.bytes[lang]) || {};
      return Object.keys(files).map(function (k) { return { url: BASE + 'assets/audio/' + lang + '/' + files[k], bytes: sizes[files[k]] || 0 }; });
    },
    refresh: function (lang) {
      var self = this;
      if (!this.canStore()) return Promise.resolve();
      return loadAudioManifest().then(function () { return caches.open(AUDIO_CACHE); }).then(function (c) { return c.keys(); })
        .then(function (keys) {
          var mine = self.list(lang).map(function (x) { return new URL(x.url, location.href).href; });
          self.stored = keys.filter(function (r) { return mine.indexOf(r.url) !== -1; }).length;
          self.emit();
        }).catch(function () {});
    },
    download: function (lang) {
      var self = this;
      if (this.state === 'downloading') return;
      if (navigator.onLine === false) { this.emit('oa_offline'); return; }
      var list = this.list(lang);
      this.state = 'downloading'; this.done = 0; this.failed = 0; this.bytes = 0; this.total = list.length;
      this.totalBytes = list.reduce(function (s, x) { return s + x.bytes; }, 0);
      this.emit('oa_started');
      caches.open(AUDIO_CACHE).then(function (cache) {
        // one at a time: gentle on a slow connection, and the progress is honest
        return list.reduce(function (p, x) {
          return p.then(function () {
            if (self.state !== 'downloading') return;
            return fetch(x.url, { cache: 'no-store', headers: { 'X-Savanna-Download': '1' } })
              .then(function (res) { if (!res.ok) throw new Error(res.status); return cache.put(x.url, res); })
              .then(function () { self.done++; self.bytes += x.bytes; }, function () { self.failed++; })
              .then(function () { self.emit(); });
          });
        }, Promise.resolve());
      }).then(function () {
        self.state = 'idle';
        self.refresh(lang).then(function () { self.emit(self.failed ? 'oa_partial' : 'oa_done'); });
      }, function () { self.state = 'idle'; self.emit('oa_unsupported'); });
    },
    remove: function () {
      var self = this;
      this.state = 'idle';
      // the download store, and any clip kept on first play by the sample service worker
      return caches.delete(AUDIO_CACHE).then(function () { return caches.keys(); }).then(function (names) {
        return Promise.all(names.filter(function (n) { return n.indexOf('savanna-onboarding') === 0; }).map(function (n) {
          return caches.open(n).then(function (c) {
            return c.keys().then(function (keys) {
              return Promise.all(keys.filter(function (r) { return /\/assets\/audio\/[a-z]{2}\/[^/]+\.(mp3|m4a)$/.test(new URL(r.url).pathname); })
                .map(function (r) { return c.delete(r); }));
            });
          });
        }));
      }).catch(function () {}).then(function () { self.stored = 0; self.emit('oa_removed'); });
    }
  };
  function mb(bytes) { return (bytes / 1048576).toFixed(1); }

  /* ---------- the player: one at a time, for every form on the page ----------
     play([{ key, text, url? }], lang) reads a list in order: each piece uses its recording when there is one, otherwise
     the phone's voice. pause / resume / stop / replay. Audio is never required: everything is also on screen. */
  var Player = {
    items: [], i: 0, state: 'idle', lang: 'en', last: null, owner: null, audio: null, subs: [],
    on: function (fn) { this.subs.push(fn); }, off: function (fn) { var k = this.subs.indexOf(fn); if (k !== -1) this.subs.splice(k, 1); },
    emit: function () { var s = this; this.subs.slice().forEach(function (fn) { fn(s); }); },
    play: function (items, lang, owner) {
      this.stop(true);
      var self = this;
      this.items = items; this.i = 0; this.lang = lang; this.owner = owner || null; this.state = 'playing';
      this.last = { items: items, lang: lang, owner: owner || null };
      this.emit();
      loadAudioManifest().then(function () { if (self.items === items && self.state === 'playing') self.next(); });
    },
    next: function () {
      var self = this, items = this.items;
      if (this.state !== 'playing') return;
      this.audio = null;
      if (this.i >= items.length) { this.state = 'idle'; this.emit(); return; }
      var it = items[this.i++], url = it.url || (it.key ? clipUrl(it.key, this.lang) : null);
      var done = function () { if (self.items === items) self.next(); };
      if (!url) return this.voice(it, done);
      // a downloaded copy (Settings) plays even where no service worker is installed
      if (window.caches && !it._checked) {
        it._checked = true; this.i--;
        caches.match(url).then(function (hit) { return hit ? hit.blob() : null; }).catch(function () { return null; }).then(function (blob) {
          if (self.items !== items || self.state !== 'playing') return;
          it._src = blob ? URL.createObjectURL(blob) : null;
          self.next();
        });
        return;
      }
      var src = it._src || url; it._checked = false; it._src = null;
      var a = this.audio = new Audio(src), failed = false;
      var fail = function () {
        if (failed || self.audio !== a) return;
        failed = true; AUDIO.failed[url] = true; self.audio = null;
        self.report('clipFailed');
        self.voice(it, done);
      };
      a.onended = done; a.onerror = fail;
      try { var pr = a.play(); if (pr && pr.catch) pr.catch(fail); } catch (e) { fail(); }
    },
    voice: function (it, done) {
      if (this.state !== 'playing') return;
      if (!speech.output.speak(it.text, this.lang, null, done)) { this.report('noAudio'); this.state = 'idle'; this.items = []; this.emit(); }
    },
    report: function (code) { if (this.owner && this.owner.audioIssue) this.owner.audioIssue(code); },
    pause: function () {
      if (this.state !== 'playing') return;
      this.state = 'paused';
      if (this.audio) { try { this.audio.pause(); } catch (e) {} } else if (speech.output.pause) speech.output.pause();
      this.emit();
    },
    resume: function () {
      if (this.state !== 'paused') return;
      this.state = 'playing';
      if (this.audio) { try { var pr = this.audio.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {} }
      else if (speech.output.resume) speech.output.resume();
      this.emit();
    },
    stop: function (quiet) {
      var was = this.state;
      this.state = 'idle'; this.items = [];
      if (this.audio) { try { this.audio.pause(); } catch (e) {} this.audio = null; }
      try { speech.output.stop(); } catch (e) {}
      if (!quiet && was !== 'idle') this.emit();
    },
    replay: function () { if (this.last) this.play(this.last.items, this.last.lang, this.last.owner); }
  };
  var AM_DIGITS = { 'ዜሮ': '0', 'አንድ': '1', 'ሁለት': '2', 'ሶስት': '3', 'ሦስት': '3', 'አራት': '4', 'አምስት': '5', 'ስድስት': '6', 'ሰባት': '7', 'ስምንት': '8', 'ዘጠኝ': '9' };
  var EN_DIGITS = { zero: '0', oh: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9' };
  function spokenDigits(s) {
    var words = s.toLowerCase().split(/\s+/);
    return words.map(function (w) { return AM_DIGITS[w] || EN_DIGITS[w] || w.replace(/\D/g, ''); }).join('');
  }
  function norm(s) { return String(s || '').toLowerCase().replace(/[.,!?።፣፤፡"'()/]/g, ' ').replace(/\s+/g, ' ').trim(); }
  /* Matching speech to a choice. A term counts only as whole words ("no" never matches inside "know" or "not now");
     Amharic terms may carry a suffix (አዎን, ስልኬ). The learner's own "say" words count first; label words longer
     than 3 letters count too. The caller treats more than one hit on a single choice as "say it again". */
  var STOP = ['with', 'this', 'that', 'from', 'have', 'your', 'what', 'about', 'there', 'their', 'want', 'like'];
  var ETHIOPIC = /[\u1200-\u137f]/;
  function hasTerm(saidWords, term) {
    var tw = norm(term).split(' ').filter(Boolean);
    if (!tw.length) return false;
    for (var i = 0; i + tw.length <= saidWords.length; i++) {
      var ok = tw.every(function (w, k) {
        var s = saidWords[i + k];
        return s === w || (ETHIOPIC.test(w) && w.length >= 2 && s.indexOf(w) === 0 && s.length - w.length <= 2);
      });
      if (ok) return true;
    }
    return false;
  }
  function matchOptions(transcript, options) {
    var words = norm(transcript).split(' ').filter(Boolean);
    // 1. the option's own "say" words, or its whole label
    var hits = options.filter(function (o) {
      return (o.say || []).concat([L(o.label, 'en'), L(o.label, 'am'), L(o.label, 'om')]).some(function (term) { return hasTerm(words, term); });
    });
    // 2. only if nothing matched: a significant single word of a label ("I agree" must not also match "No, I do not agree")
    if (!hits.length) hits = options.filter(function (o) {
      return [L(o.label, 'en'), L(o.label, 'am'), L(o.label, 'om')].some(function (lbl) {
        return norm(lbl).split(' ').some(function (w) { return w.length > 3 && STOP.indexOf(w) === -1 && hasTerm(words, w); });
      });
    });
    return hits.map(function (o) { return o.value; });
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
  function isEmpty(v) { return v == null || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && 'cal' in v && !v.d && !v.m && !v.y); }
  // Voice input is never offered on sensitive questions (support needs, ID), so that data never reaches a cloud speech service.
  function voiceAllowed(f, vm) { return f.voice !== false && !f.sensitive && !(f.type === 'ethdate' && vm && dateLists(vm)); }
  /** Day and year as lists (like the month) for "read and type" and "simple steps"; typed, with voice, for "listen" and "speak". */
  function dateLists(vm) { return vm.prefsMode !== 'listen' && vm.prefsMode !== 'speak'; }

  /** Checks one answer. Returns '' when it is fine, otherwise the error message in the given language. */
  function validateAnswer(f, v, answers, lang) {
    if (isEmpty(v)) {
      if (f.optional) return '';
      return f.type === 'choice' ? t('errChoice', lang) : f.type === 'multi' ? t('errMulti', lang) : f.type === 'consent' ? t('errConsent', lang) : t('errRequired', lang);
    }
    if (f.type === 'tel') { var digits = String(v).replace(/\D/g, ''); if (digits.indexOf('251') === 0) digits = '0' + digits.slice(3); if (digits.length !== 10) return t('errPhone', lang); }
    if (f.type === 'ethdate' && !v.gregorian) return t(v.cal === 'greg' ? 'errDateGreg' : 'errDate', lang);
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
      var src = ctx[f.prefill.from] || {}, keys = [].concat(f.prefill.key), v;
      for (var k = 0; k < keys.length && isEmpty(v); k++) v = src[keys[k]];
      if (isEmpty(self.answers[f.id]) && !isEmpty(v)) { self.answers[f.id] = v; self.prefilled[f.id] = true; }
    });
    this.cfg.fields.forEach(function (f) {
      if (f.default !== undefined && self.answers[f.id] === undefined) self.answers[f.id] = f.default;
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
    Object.keys(out).forEach(function (k) { if (isEmpty(out[k])) delete out[k]; }); // e.g. a calendar chosen but no date given
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
    // the host page already declares (and preloads) the same fonts, e.g. the Savanna journey's journey.css
    try { if (getComputedStyle(document.documentElement).getPropertyValue('--so-host-fonts').trim()) return ''; } catch (e) {}
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
    '.dm [hidden]{display:none!important}',
    '.dm button,.dm input,.dm select,.dm textarea{font:inherit}',
    '.dm :focus-visible{outline:var(--so-focus-width) solid var(--so-focus);outline-offset:var(--so-focus-offset);box-shadow:none}',
    // keep a gap when the browser scrolls a control into view, so the whole focus outline stays on screen (2.4.7, 2.4.11)
    '.dm a,.dm button,.dm input,.dm select,.dm textarea,.dm [tabindex]{scroll-margin:24px}',
    '.dm-q:focus,.dm-q:focus-visible{outline:none}',

    '.dm-bar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:.5em;margin-bottom:1em;padding-bottom:.75em;border-bottom:1px solid var(--so-border-subtle)}',
    '.dm-bar-r{display:flex;flex-wrap:wrap;gap:.5em;margin-left:auto}',
    '.dm-progress{color:var(--so-text-muted);margin:0 0 .25em;font-size:.95em;font-weight:500}',
    '.dm-meter{height:8px;background:var(--so-surface-alt);border-radius:var(--so-radius-pill);overflow:hidden;margin:.35em 0 1.25em}',
    '.dm-meter span{display:block;height:100%;background:var(--so-heading);border-radius:var(--so-radius-pill)}',

    '.dm-q{font-size:1.75em;line-height:1.3;margin:.25em 0 .5em;font-weight:600;color:var(--so-heading)}',
    '.dm-q label{display:block}',
    '.dm-opt-tag{font-weight:400;font-size:.6em;color:var(--so-text-muted)}',
    '.dm-badge{display:inline-block;margin:.2em 0 0;padding:.05em .6em;border:1px solid var(--so-border);border-radius:var(--so-radius-pill);font-size:.8em;font-weight:500;color:var(--so-text-muted);background:var(--so-surface)}',
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
    '.dm-lang{position:relative;display:inline-flex}',
    '.dm-lang-menu{position:absolute;right:0;top:calc(100% + .3em);z-index:20;display:flex;flex-direction:column;min-width:11em;padding:.3em;background:var(--so-surface);border:var(--so-border-width) solid var(--so-border-strong);border-radius:var(--so-radius);box-shadow:0 6px 18px rgba(0,43,86,.15)}',
    '.dm-lang-menu[hidden]{display:none}',
    '.dm-lang-menu button{display:flex;align-items:center;gap:.4em;min-height:44px;padding:.3em .7em;border:0;border-radius:var(--so-radius-sm);background:none;color:var(--so-heading);font:inherit;text-align:left;cursor:pointer}',
    '.dm-lang-menu button:hover,.dm-lang-menu button[aria-current]{background:var(--so-surface-alt)}.dm-lang-menu button[aria-current]{font-weight:700}',
    '.dm-lang-tick{display:inline-block;width:1em}',
    '.dm-preview{border:var(--so-border-width) dashed var(--so-border);border-radius:var(--so-radius);padding:.75em 1em;margin:0 0 1.5em;background:var(--so-surface)}',
    '.dm-preview-h{font-weight:600;margin:0 0 .25em;color:var(--so-heading)}.dm-preview-btn{pointer-events:none}',
    '.dm-cal{border:0;margin:0 0 1em;padding:0;min-width:0}.dm-cal legend{font-weight:600;margin-bottom:.5em;padding:0}.dm-cal-opts{margin:0}',
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
    '.dm-sr-tip p{margin:0 0 .4em}', '.dm-sr-tip p:last-child{margin:0}',
    '.dm-offline-audio{margin:0 0 1.5em}', '.dm-offline-audio h2{font-size:1.2em;margin:0 0 .4em;color:var(--so-heading)}',
    '.dm-offline-audio progress{width:100%;height:1.2em;accent-color:var(--so-heading)}',
    '.dm-offline{margin:0 0 1em;padding:.6em .9em;border:var(--so-border-width) solid var(--so-border-strong);border-radius:var(--so-radius);background:var(--so-surface-alt);color:var(--so-heading);font-weight:500}',
    '.dm-player{display:contents}',
    '.dm-player[hidden]{display:none}',
    '.dm-opt-row{display:flex;flex-wrap:wrap;gap:.4em;align-items:stretch}',
    '.dm-opt-row .dm-opt{flex:1 1 12em;min-width:0}',
    '.dm-play{flex:0 0 auto;min-height:56px}',
    '.dm-heard{border:var(--so-border-width) solid var(--so-info-accent);background:var(--so-surface-info);border-radius:var(--so-radius);padding:.9em;margin:1em 0}',
    '.dm-heard p{margin:0 0 .6em}',
    '.dm-heard q{font-weight:600;font-size:1.15em}',
    '.dm-heard-label{display:block;font-weight:600;margin:.25em 0}',
    '.dm-heard-warn{margin:0 0 .5em;color:var(--so-heading)}',
    '.dm-heard .dm-input{margin-bottom:.5em}',
    '.dm-mic-on{background:var(--so-primary)!important;border-color:var(--so-primary)!important;color:var(--so-on-primary)!important}',
    '.dm-status{min-height:1.5em;margin:.5em 0;color:var(--so-heading);font-weight:500}',
    '.dm-actions{display:flex;flex-wrap:wrap;gap:.75em;margin-top:1.5em;align-items:center}',

    '.dm-errors{border:4px solid var(--so-error);border-radius:var(--so-radius);padding:1em 1.1em;margin:0 0 1.25em;background:var(--so-surface)}',
    '.dm-errors :is(h2,h3,h4,h5){margin:0 0 .5em;font-size:1.25em;color:var(--so-heading)}',
    '.dm-errors ul{margin:0;padding-left:1.2em}',
    '.dm-errors a{color:var(--so-error);font-weight:600}',
    '.dm-err{display:block;color:var(--so-error);font-weight:600;margin:.25em 0 .5em}',

    '.dm-panel{border:1px solid var(--so-border-subtle);border-radius:var(--so-radius-card);padding:1em 1.1em;margin:1em 0;background:var(--so-surface-alt)}',
    '.dm-panel :is(h2,h3,h4,h5){margin:0 0 .5em;font-size:1.2em;color:var(--so-heading)}',
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
    /* Simple steps: a big picture per question, step circles, answers as picture tiles, a full-width Continue */
    '.dm-pic{display:grid;place-items:center;width:5.5rem;height:5.5rem;margin:.25em 0 .5em;border-radius:50%;background:var(--so-surface-alt);font-size:3rem;line-height:1}',
    '.dm-steps{display:flex;flex-wrap:wrap;gap:.4em;margin:.35em 0 1em}',
    '.dm-step{display:grid;place-items:center;min-width:2.1em;height:2.1em;padding:0 .3em;border-radius:var(--so-radius-pill);border:var(--so-border-width) solid var(--so-border);background:var(--so-surface);color:var(--so-heading);font-weight:600}',
    '.dm-step-done{background:var(--so-heading);border-color:var(--so-heading);color:var(--so-surface)}',
    '.dm-step-now{border-width:3px;border-color:var(--so-primary);transform:scale(1.15)}',
    '.dm-easy .dm-opts{grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr))}',
    '.dm-easy .dm-opt:has(.dm-ico){flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:.4em;min-height:9rem;padding:1em .75em;position:relative}',
    '.dm-easy .dm-opt:has(.dm-ico) input{position:absolute;top:.75em;left:.75em}',
    '.dm-easy .dm-opt:has(.dm-ico) .dm-ico{font-size:3em}',
    '.dm-easy .dm-opt-row{flex-direction:column}',
    '.dm-easy .dm-actions .dm-primary{flex:1 1 100%;min-height:60px;font-size:1.15em}',
    '.dm-easy .dm-actions .dm-primary::after{content:" →" / ""}',
    '.dm-easy .dm-ico{font-size:2.1em}',
    '.dm-easy .dm-opt{min-height:68px;font-size:1.15em}',

    'html[data-dm-contrast=high] .dm{background:#fff}',
    'html[data-dm-contrast=high] .dm-meter{border:2px solid #000}',
    'html[data-dm-contrast=high] .dm-panel,html[data-dm-contrast=high] .dm-note,html[data-dm-contrast=high] .dm-success,html[data-dm-contrast=high] .dm-heard{border:3px solid #000}',
    'html[data-dm-contrast=high] .dm-opt:has(input:checked){border-width:5px;box-shadow:none}',
    '@media (forced-colors:active){.dm-opt:has(input:checked){border-width:4px}.dm-meter span{background:CanvasText}}',
    '@media (prefers-reduced-motion:reduce){.dm *{transition:none!important;animation:none!important}}',
    'html[data-dm-motion=reduce]{scroll-behavior:auto!important}html[data-dm-motion=reduce] *,html[data-dm-motion=reduce] *::before,html[data-dm-motion=reduce] *::after{transition:none!important;animation:none!important}'
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
  /* Pictures (emoji) are part of "Simple steps with pictures and big text" only (the "Pictures and bigger buttons"
     setting). Everywhere else the words stand alone. Pictures are always decorative: the words carry the meaning. */
  function pic(on, e) { return on && e ? '<span class="dm-ico" aria-hidden="true">' + e + '</span> ' : ''; }
  // In "Simple steps", each question gets a large picture: its own (field.picture) or one for its type.
  var TYPE_PICTURES = { text: '✏️', tel: '📱', email: '✉️', textarea: '📝', choice: '👆', multi: '☑️', consent: '🤝', ethdate: '📅' };
  var View = {
    id: function (vm, name) { return vm.uid + '-' + name; },

    errorSummary: function (vm, msg) {
      return '<div class="dm-errors" role="alert" tabindex="-1"><h2>' + t('problem', vm.lang) + '</h2><ul><li><a href="#' + View.id(vm, 'input') + '" data-act="focus-input">' + esc(msg) + '</a></li></ul></div>';
    },
    errorLine: function (vm, msg) {
      return '<span id="' + View.id(vm, 'err') + '" class="dm-err"><span class="dm-vh">Error: </span>' + esc(msg) + '</span>';
    },
    status: function () { return '<p class="dm-status" role="status" aria-live="polite"></p>'; },
    srTip: function () {
      return '<div class="dm-note dm-sr-tip"><p lang="en">' + UI.en.srTip + '</p><p lang="am">' + UI.am.srTip + '</p><p lang="om">' + UI.om.srTip + '</p></div>';
    },

    /* "Listen" and the player controls (Pause/Resume, Stop, Play again). Shown and labelled by the controller. */
    listenTools: function (vm) {
      var lang = vm.lang;
      return '<button type="button" class="dm-btn" data-act="listen">' + pic(vm.pictures, '🔊') + t('listen', lang) + '</button>' +
        '<span class="dm-player" data-ref="player" hidden>' +
        '<button type="button" class="dm-btn" data-act="pause">' + pic(vm.pictures, '⏸️') + '<span data-ref="pause-label">' + t('pause', lang) + '</span></button>' +
        '<button type="button" class="dm-btn" data-act="stop-audio">' + pic(vm.pictures, '⏹️') + t('stopAudio', lang) + '</button>' +
        '<button type="button" class="dm-btn" data-act="replay"><span aria-hidden="true">↻ </span>' + t('replay', lang) + '</button></span>';
    },
    /* One answer option, with its own Listen button when read aloud is on. The button sits beside the label (never
       inside it), and its name starts with the visible word "Listen" (WCAG 2.5.3). */
    option: function (vm, label, play, i) {
      if (!vm.easy) return label;
      return '<div class="dm-opt-row">' + label + '<button type="button" class="dm-btn dm-play" data-act="play-opt" data-i="' + i + '" aria-label="' + esc(t('play', vm.lang) + ': ' + play) + '">' +
        pic(vm.pictures, '🔊') + t('play', vm.lang) + '</button></div>';
    },

    bar: function (vm, showBack) {
      var lang = vm.lang, helpId = View.id(vm, 'help');
      return '<div class="dm-bar">' +
        '<div>' + (showBack ? '<button type="button" class="dm-link" data-act="back">← ' + t('back', lang) + '</button>'
          // the first screen: "Back" leaves the form, to the page the host names (mount option backUrl)
          : vm.backUrl ? '<a class="dm-link" href="' + esc(vm.backUrl) + '">← ' + t('back', lang) + '</a>' : '') + '</div>' +
        '<div class="dm-bar-r">' +
        // Language: one dropdown (a disclosure button and a short list), each language named in its own language
        '<span class="dm-lang"><button type="button" class="dm-btn dm-small" data-act="lang-menu" aria-expanded="false" aria-controls="' + View.id(vm, 'langs') + '">' +
          '<span class="dm-vh">' + t('s_lang', lang) + ': </span><span lang="' + lang + '">' + LANG_NAMES[lang] + '</span><span aria-hidden="true"> ▾</span></button>' +
          '<span id="' + View.id(vm, 'langs') + '" class="dm-lang-menu" data-ref="langs" hidden>' + LANGS.map(function (l) {
            return '<button type="button" data-act="lang" data-lang="' + l + '" lang="' + l + '"' + (l === lang ? ' aria-current="true"' : '') + '><span aria-hidden="true" class="dm-lang-tick">' + (l === lang ? '✓' : '') + '</span>' + LANG_NAMES[l] + '</button>';
          }).join('') + '</span></span>' +
        '<button type="button" class="dm-btn dm-small" data-act="easy" aria-pressed="' + vm.easy + '">' + pic(vm.pictures, '🔊') + t(vm.easy ? 'easyOn' : 'easyOff', lang) + '</button>' +
        '<button type="button" class="dm-btn dm-small" data-act="help" aria-expanded="' + !!vm.helpOpen + '" aria-controls="' + helpId + '">' + t('help', lang) + '</button>' +
        '</div></div>' +
        '<div id="' + helpId + '" data-ref="help" class="dm-panel"' + (vm.helpOpen ? '' : ' hidden') + '><h2>' + t('helpTitle', lang) + '</h2><p>' + esc(L(vm.cfg.help, lang) || t('helpText', lang)) + '</p>' + View.srTip() +
        '<button type="button" class="dm-btn dm-small" data-act="help">' + t('helpClose', lang) + '</button></div>';
    },

    page: function (vm) {
      var html = '<div class="dm' + (vm.pictures ? ' dm-easy' : '') + (vm.voiceFirst ? ' dm-voice-first' : '') + '" lang="' + vm.lang + '">' +
        '<p class="dm-offline" data-ref="offline" role="status"' + (vm.offline ? '' : ' hidden') + '>' + (vm.offline ? t('offline', vm.lang) : '') + '</p>';
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
        '<p id="' + hintId + '" class="dm-hint">' + t('welcomeHint', lang) + '</p>' + View.srTip() +
        (err ? View.errorLine(vm, err) : '') +
        '<div class="dm-opts">' + MODES.map(function (m, i) {
          return View.option(vm, '<label class="dm-opt"><input' + (i === 0 ? ' id="' + View.id(vm, 'input') + '" data-ref="input"' : '') + ' type="radio" name="mode" value="' + m + '"' + (vm.prefsMode === m ? ' checked' : '') + '>' +
            (vm.pictures || m === 'simple' ? '<span class="dm-ico" aria-hidden="true">' + MODE_ICONS[m] + '</span>' : '') + '<span>' + t('m_' + m, lang) + '</span></label>', t('m_' + m, lang), i);
        }).join('') + '</div></fieldset>' +
        '<div class="dm-tools">' + View.listenTools(vm) + '</div>' +
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
      if (vm.pictures) { // "Simple steps": one circle per question, done ones ticked, the current one large
        var dots = '';
        for (var k = 1; k <= p.total; k++) dots += '<span class="dm-step' + (k < p.n ? ' dm-step-done' : k === p.n ? ' dm-step-now' : '') + '">' + (k < p.n ? '✓' : k) + '</span>';
        h += '<div class="dm-steps" aria-hidden="true">' + dots + '</div>';
      } else h += '<div class="dm-meter" aria-hidden="true"><span style="width:' + Math.round(p.n / p.total * 100) + '%"></span></div>';
      if (vm.error) h += View.errorSummary(vm, vm.error);
      h += '<form class="dm-form" novalidate>';
      if (vm.pictures) h += '<div class="dm-pic" aria-hidden="true">' + (f.picture || TYPE_PICTURES[f.type] || '❓') + '</div>';
      if (group) h += '<fieldset' + (describedBy ? ' aria-describedby="' + describedBy + '"' : '') + '><legend><h1 class="dm-q" tabindex="-1">' + esc(label) + opt + '</h1></legend>';
      else h += '<h1 class="dm-q" tabindex="-1"><label for="' + View.id(vm, 'input') + '">' + esc(label) + opt + '</label></h1>';
      if (f.body) h += '<div class="dm-note">' + esc(L(f.body, lang)) + '</div>';
      if (hint) h += '<p id="' + View.id(vm, 'hint') + '" class="dm-hint">' + esc(hint) + '</p>';
      if (s.prefilled[f.id]) h += '<p id="' + View.id(vm, 'pre') + '" class="dm-hint">' + t('prefilled', lang) + '</p>';
      if (vm.error) h += View.errorLine(vm, vm.error);
      h += View.input(vm, f, v, group ? '' : describedBy);
      if (group) h += '</fieldset>';
      h += '<div class="dm-tools">' + View.listenTools(vm);
      var canSpeak = voiceAllowed(f, vm) && speech.input.supported();
      if (canSpeak) h += '<button type="button" class="dm-btn" data-act="speak" aria-pressed="false">' + pic(vm.pictures, '🎤') + t('speak', lang) + '</button>';
      h += '</div>';
      // A learner who chose "speak my answers" is told plainly when this browser (e.g. an app's WebView) cannot listen.
      if (voiceAllowed(f, vm) && !canSpeak && vm.prefsMode === 'speak') h += '<p class="dm-note">' + t('voiceUnsupported', lang) + '</p>';
      if (f.askHelper) {
        // A learner who cannot type (or whose name voice gets wrong) can hand the phone to someone, then check the name.
        var pid = View.id(vm, 'askhelp');
        h += '<p><button type="button" class="dm-link" data-act="ask-helper" aria-expanded="' + !!vm.askHelperOpen + '" aria-controls="' + pid + '">' + esc(L(f.askHelper.button, lang)) + '</button></p>' +
          '<div id="' + pid + '" class="dm-note" data-ref="askhelp"' + (vm.askHelperOpen ? '' : ' hidden') + '><p>' + esc(L(f.askHelper.text, lang)) + '</p>' +
          '<button type="button" class="dm-btn dm-small" data-act="helper-done">' + t('askHelperDone', lang) + '</button></div>';
      }
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
          return View.option(vm, '<label class="dm-opt"><input' + (i === 0 ? ' id="' + inputId + '" data-ref="input"' : '') + ' type="' + (multi ? 'checkbox' : 'radio') + '" name="v" value="' + esc(o.value) + '"' + checked + '>' +
            (o.icon && vm.pictures ? '<span class="dm-ico" aria-hidden="true">' + o.icon + '</span>' : '') + '<span>' + esc(L(o.label, lang)) +
            (o.badge ? ' <span class="dm-badge">' + esc(L(o.badge, lang)) + '</span>' : '') + '</span></label>', L(o.label, lang), i);
        }).join('') + '</div>';
      }
      if (f.type === 'ethdate') {
        /* First the calendar (Ethiopian or Gregorian), then day, month and year. Learners who read and type, or chose
           simple steps, pick the day and year from lists like the month; learners who listen or speak type them, and
           can answer by voice. */
        var d = v || {}, cal = d.cal === 'greg' ? 'greg' : 'eth', months = monthsFor(cal, lang), mId = View.id(vm, 'm'), yId = View.id(vm, 'y');
        var lists = dateLists(vm), now = new Date(), topYear = cal === 'greg' ? now.getFullYear() : gregToEth(now).y;
        var calName = View.id(vm, 'cal');
        function opt(val, text, on) { return '<option value="' + val + '"' + (on ? ' selected' : '') + '>' + text + '</option>'; }
        var days = [], years = [];
        for (var k = 1; k <= (cal === 'greg' ? 31 : 30); k++) days.push(opt(k, k, Number(d.d) === k));
        for (var yr = topYear; yr >= topYear - 100; yr--) years.push(opt(yr, yr, Number(d.y) === yr));
        var dayCtl = lists
          ? '<select id="' + inputId + '" data-ref="input" class="dm-input" name="d"' + inv + '>' + opt('', t('chooseDay', lang), false) + days.join('') + '</select>'
          : '<input id="' + inputId + '" data-ref="input" class="dm-input" name="d" inputmode="numeric" autocomplete="bday-day" size="3" value="' + esc(d.d || '') + '"' + inv + '>';
        var yearCtl = lists
          ? '<select id="' + yId + '" data-ref="y" class="dm-input" name="y"' + inv + '>' + opt('', t('chooseYear', lang), false) + years.join('') + '</select>'
          : '<input id="' + yId + '" data-ref="y" class="dm-input" name="y" inputmode="numeric" autocomplete="bday-year" size="5" value="' + esc(d.y || '') + '"' + inv + '>';
        var conv = d.gregorian ? (cal === 'greg' ? t('ethiopian', lang, { date: fmtEthiopian(d.gregorian, lang) }) : t('gregorian', lang, { date: fmtGregorian(new Date(d.gregorian), lang) })) : '';
        return '<fieldset class="dm-cal"><legend>' + t('calendar', lang) + '</legend><div class="dm-opts dm-cal-opts">' +
          [['eth', 'calEth'], ['greg', 'calGreg']].map(function (c) {
            return '<label class="dm-opt"><input type="radio" name="cal" id="' + calName + '-' + c[0] + '" value="' + c[0] + '"' + (cal === c[0] ? ' checked' : '') + '><span>' + t(c[1], lang) + '</span></label>';
          }).join('') + '</div></fieldset>' +
          '<div class="dm-date">' +
          '<div><label for="' + inputId + '">' + t('day', lang) + '</label>' + dayCtl + '</div>' +
          '<div><label for="' + mId + '">' + t('month', lang) + '</label><select id="' + mId + '" data-ref="m" class="dm-input" name="m"' + inv + '>' + opt('', t('chooseMonth', lang), false) +
          months.map(function (m, i) { return opt(i + 1, m, Number(d.m) === i + 1); }).join('') + '</select></div>' +
          '<div><label for="' + yId + '">' + t('year', lang) + '</label>' + yearCtl + '</div>' +
          '</div><p class="dm-hint" data-ref="date-conv">' + conv + '</p>';
      }
      return '';
    },

    display: function (vm, f, v) {
      var lang = vm.lang, opts = optionsOf(f);
      if (isEmpty(v)) return t('notGiven', lang);
      if (f.type === 'choice' || f.type === 'consent') { var o = opts.filter(function (x) { return x.value === v; })[0]; return o ? L(o.label, lang) + (o.badge ? ' (' + L(o.badge, lang) + ')' : '') : v; }
      if (f.type === 'multi') return v.map(function (x) { var o = opts.filter(function (y) { return y.value === x; })[0]; return o ? L(o.label, lang) : x; }).join(', ');
      if (f.type === 'ethdate') return v.d + ' ' + monthsFor(v.cal, lang)[v.m - 1] + ' ' + v.y + ' (' + (v.cal === 'greg' ? fmtEthiopian(v.gregorian, lang) : fmtGregorian(new Date(v.gregorian), lang)) + ')';
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
      if (vm.easy) h += '<div class="dm-tools">' + View.listenTools(vm) + '</div>';
      return h + View.status() + '<div class="dm-actions"><button type="submit" class="dm-btn dm-primary">' + esc(L(cfg.submitLabel, lang) || t('submit', lang)) + '</button></div></form>';
    },

    saved: function (vm) {
      var lang = vm.lang, link = vm.resumeLink;
      var sms = ({ am: 'ምዝገባዎን ለመቀጠል፦ ', om: 'Unka kee itti fufuuf: ' }[lang] || 'Continue your form: ') + link;
      return View.bar(vm, false) + '<h1 class="dm-q" tabindex="-1">' + t('savedTitle', lang) + '</h1><p>' + t('savedText', lang) + '</p>' +
        '<p><a href="' + esc(link) + '">' + esc(link) + '</a></p>' +
        '<div class="dm-panel"><h2>' + t('smsPreview', lang) + '</h2><p lang="' + lang + '"><samp>' + esc(sms) + '</samp></p></div>' +
        '<div class="dm-actions"><button type="button" class="dm-btn dm-primary" data-act="resume">' + t('next', lang) + '</button></div>';
    },

    done: function (vm) {
      var lang = vm.lang;
      // Help stays in the same place on every screen (WCAG 3.2.6); the result is shown as a success panel.
      return View.bar(vm, false) + '<div class="dm-success"><h1 class="dm-q" tabindex="-1"><span aria-hidden="true">✓ </span>' + esc(L(vm.cfg.doneTitle, lang)) + '</h1><p>' + esc(L(vm.cfg.doneText, lang)) + '</p></div>' +
        (vm.easy ? '<div class="dm-tools">' + View.listenTools(vm) + '</div>' + View.status() : '') + '<div class="dm-done-slot"></div>';
    },

    /* Review panel. Nothing from speech reaches the answer until "Use this answer" is chosen. */
    heard: function (vm, v) {
      var lang = vm.lang, f = v.field, hid = View.id(vm, 'heard-h'), eid = View.id(vm, 'heard-edit');
      var choice = f.type === 'choice' || f.type === 'consent' || f.type === 'multi' || f.type === 'ethdate';
      var h = '<div class="dm-heard" role="group" aria-labelledby="' + hid + '"><p id="' + hid + '" data-ref="heard-h" tabindex="-1">' + t('heard', lang) + ' <q>' + esc(v.transcript) + '</q></p>';
      if (choice) {
        h += '<p>' + t('heardMatch', lang) + ' <strong>' + esc(v.shown) + '</strong></p>';
      } else {
        if (f.voiceWarning) h += '<p class="dm-heard-warn"><strong>' + esc(L(f.voiceWarning, lang)) + '</strong></p>';
        h += '<p class="dm-hint">' + t('heardCheck', lang) + '</p><label for="' + eid + '" class="dm-heard-label">' + t('heardEdit', lang) + '</label>' +
          (f.type === 'textarea' ? '<textarea id="' + eid + '" data-ref="heard-edit" class="dm-input">' + esc(v.value) + '</textarea>'
            : '<input id="' + eid + '" data-ref="heard-edit" class="dm-input" type="' + (f.type === 'tel' ? 'tel' : 'text') + '"' + (f.type === 'tel' ? ' inputmode="tel"' : '') + ' value="' + esc(v.value) + '">');
        if (v.others.length) h += '<p class="dm-hint">' + t('orDid', lang) + '</p><div class="dm-tools">' + v.others.map(function (o, i) {
          return '<button type="button" class="dm-btn dm-small" data-act="heard-alt" data-alt="' + i + '">' + esc(o) + '</button>';
        }).join('') + '</div>';
      }
      return h + '<div class="dm-actions"><button type="button" class="dm-btn dm-primary" data-act="heard-yes">' + t('yes', lang) + '</button>' +
        '<button type="button" class="dm-btn" data-act="heard-again">' + t('again', lang) + '</button>' +
        '<button type="button" class="dm-btn" data-act="heard-type">' + t(choice && f.type !== 'ethdate' ? 'tapInstead' : 'type', lang) + '</button></div></div>';
    },

    voiceConsent: function (vm) {
      var lang = vm.lang, hid = View.id(vm, 'vc');
      return '<div class="dm-panel" role="group" aria-labelledby="' + hid + '"><h2 id="' + hid + '" data-ref="vc" tabindex="-1">' + t('voiceConsentTitle', lang) + '</h2><p>' + t('voiceConsent', lang) + '</p>' +
        '<div class="dm-actions"><button type="button" class="dm-btn dm-primary" data-act="voice-allow">' + t('voiceAllow', lang) + '</button><button type="button" class="dm-btn" data-act="voice-deny">' + t('voiceDeny', lang) + '</button></div></div>';
    }
  };

  /** Moves every heading in module-made HTML down by (level - 1). Learner text is escaped, so only our tags match. */
  function shiftHeadings(html, level) {
    var by = level - 1;
    if (!by) return html;
    return html.replace(/<(\/?)h([1-5])\b/g, function (m, slash, n) { return '<' + slash + 'h' + Math.min(6, +n + by); });
  }

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
      this.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var lm = self.querySelector('[data-act=lang-menu][aria-expanded=true]');
        if (lm) { self.langMenu(false, true); return; }
        if (Player.state !== 'idle') Player.stop();
      });
      this._onDocClick = function (e) { if (!self.contains(e.target) || !e.target.closest('.dm-lang')) self.langMenu(false); };
      document.addEventListener('click', this._onDocClick);
      // A multi-line answer box is shown whole when it gets focus (browsers only reveal its first line), so a learner
      // using zoom sees all of it (found by the Phase 9 gate dry run at 200% zoom).
      this.addEventListener('focusin', function (e) { if (e.target.tagName === 'TEXTAREA' && e.target.scrollIntoView) e.target.scrollIntoView({ block: 'nearest' }); });
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
    this._onPlayer = function () { self.updatePlayer(); };
    Player.on(this._onPlayer);
    // Minimum offline mode: say so when the connection drops or comes back. Answers are saved on the device either way.
    this._onNet = function () {
      var b = self.ref('offline');
      if (!b) return;
      if (navigator.onLine === false) { b.hidden = false; b.textContent = t('offline', self.lang); }
      else { b.textContent = t('online', self.lang); setTimeout(function () { if (navigator.onLine !== false && b.textContent === t('online', self.lang)) b.hidden = true; }, 6000); }
    };
    window.addEventListener('online', this._onNet);
    window.addEventListener('offline', this._onNet);
    if (this.easy) loadAudioManifest();
    this.render(false);
  };
  SavannaOnboardingForm.prototype.disconnectedCallback = function () {
    document.removeEventListener('savanna-onboarding:prefs', this._onPrefs); this._ready = false; Player.off(this._onPlayer);
    window.removeEventListener('online', this._onNet); window.removeEventListener('offline', this._onNet);
    if (Player.owner === this) Player.stop();
    if (this.voice && this.voice.session) this.voice.session.abort();
    this.voice = null;
  };

  /* The question is the page's <h1> by default. A host page that has its own <h1> sets heading-level="2" (or 3):
     every heading inside the module moves down by the same amount, so the outline stays in order. */
  SavannaOnboardingForm.prototype.headingLevel = function () {
    var n = parseInt(this.getAttribute('heading-level'), 10);
    return n >= 1 && n <= 4 ? n : 1;
  };
  SavannaOnboardingForm.prototype.ref = function (name) { return this.querySelector('[data-ref="' + name + '"]'); };
  SavannaOnboardingForm.prototype.vm = function () {
    var s = this.state, mode = getPrefs().mode;
    return {
      askHelperOpen: !!this.askHelperOpen,
      cfg: this.cfg, s: s, lang: this.lang, easy: this.easy, pictures: getPrefs().pictures, offline: navigator.onLine === false, uid: this.uid, error: this.error, helpOpen: this.helpOpen,
      welcomeOn: this.welcomeOn, backUrl: this.getAttribute('back-url') || '', startAtReview: this.startAtReview, prefsMode: mode, voiceFirst: mode === 'speak',
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
    this.innerHTML = shiftHeadings(View.page(this.vm()), this.headingLevel());
    if (moveFocus !== false) {
      var target = this.querySelector('.dm-errors') || this.querySelector('.dm-q');
      if (target) target.focus();
    }
    // Filled in after the live region exists, so screen readers announce it.
    if (flash) this.status(flash);
    var m = this.state.mode;
    this._played = false;
    this.updatePlayer();
    // Read aloud reads each new question once; Pause and Stop appear at once, and Escape stops it (WCAG 1.4.2).
    if ((m === 'question' || m === 'welcome') && this.easy && this._interacted) this.readQuestion();
  };

  /* --- reading the current value out of the page into the state --- */
  SavannaOnboardingForm.prototype.readField = function (f) {
    var form = this.querySelector('.dm-form');
    if (!form) return undefined;
    if (f.type === 'multi') return Array.prototype.map.call(form.querySelectorAll('input[name=v]:checked'), function (i) { return i.value; });
    if (f.type === 'choice' || f.type === 'consent') { var c = form.querySelector('input[name=v]:checked'); return c ? c.value : ''; }
    if (f.type === 'ethdate') {
      var c = form.querySelector('input[name=cal]:checked'), cal = c && c.value === 'greg' ? 'greg' : 'eth';
      var d = parseInt(form.d.value, 10), m = parseInt(form.m.value, 10), y = parseInt(form.y.value, 10);
      var raw = { cal: cal, d: String(form.d.value).trim(), m: form.m.value, y: String(form.y.value).trim() };
      return dateValue(cal, d, m, y) || ((raw.d || raw.m || raw.y) ? raw : (cal === 'greg' ? { cal: 'greg', d: '', m: '', y: '' } : ''));
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
    this.askHelperOpen = false;
    this._interacted = true;
    Player.stop();
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
      var before = this.state.answers[f.id], nv = this.readField(f);
      if (e.target.name === 'cal' && nv && nv.cal) { // the same day in the other calendar, or start the month and year again
        if (before && before.gregorian) {
          var g = new Date(before.gregorian), e2 = gregToEth(g);
          nv = nv.cal === 'greg' ? dateValue('greg', g.getUTCDate(), g.getUTCMonth() + 1, g.getUTCFullYear()) : dateValue('eth', e2.d, e2.m, e2.y);
        } else nv = { cal: nv.cal, d: nv.d, m: '', y: '' };
      }
      if (nv !== undefined) this.state.setAnswer(f.id, nv);
      if (e.target.name === 'cal') { // month names change: redraw, and keep focus on the calendar choice
        this.render(false);
        var r = this.querySelector('input[name=cal]:checked'); if (r) r.focus();
      }
      var v = this.state.answers[f.id], lang = this.lang, msg = !v || !v.gregorian ? '' : v.cal === 'greg'
        ? t('ethiopian', lang, { date: fmtEthiopian(v.gregorian, lang) }) : t('gregorian', lang, { date: fmtGregorian(new Date(v.gregorian), lang) });
      var conv = this.ref('date-conv'); if (conv) conv.textContent = msg;
      if (msg && e.target.name !== 'cal') this.status(msg);
    }
    if (this.easy && (f.type === 'choice' || f.type === 'multi' || f.type === 'consent') && e.target.closest) {
      var lab = e.target.closest('.dm-opt');
      if (lab && e.target.checked) {
        var all = Array.prototype.slice.call(this.querySelectorAll('.dm-form .dm-opt'));
        this.readOption(all.indexOf(lab));
      }
    }
  };

  SavannaOnboardingForm.prototype.onClick = function (e) {
    var b = e.target.closest('[data-act]');
    if (!b || !this.contains(b)) return;
    this._interacted = true;
    var act = b.getAttribute('data-act'), s = this.state;
    if (act === 'focus-input') { e.preventDefault(); var i = this.ref('input'); if (i) i.focus(); return; }
    if (act === 'back') {
      Player.stop(); this.error = '';
      if (!s.returnToReview) this.collect(); // Back from a "Change" discards the unsaved edit, as before
      s.back(this.welcomeOn);
      this.save(); this.render(true); return;
    }
    if (act === 'lang-menu') { this.langMenu(b.getAttribute('aria-expanded') !== 'true'); return; }
    if (act === 'lang') {
      if (b.getAttribute('data-lang') === this.lang) { this.langMenu(false, true); return; }
      this.collect();
      var to = b.getAttribute('data-lang');
      this.lang = LANGS.indexOf(to) !== -1 ? to : (this.lang === 'am' ? 'en' : 'am'); this.error = ''; this.savePrefs(); this.render(true); return;
    }
    if (act === 'easy') {
      this.collect();
      this.easy = !this.easy; this.savePrefs(); Player.stop(); this.render(false);
      var eb = this.querySelector('[data-act=easy]'); if (eb) eb.focus();
      return;
    }
    if (act === 'help') {
      this.collect();
      this.helpOpen = !this.helpOpen; this.render(false);
      var target = this.helpOpen ? this.querySelector('[data-ref=help] :is(h2,h3,h4,h5)') : this.querySelector('[data-act=help]');
      if (target) { if (this.helpOpen) target.setAttribute('tabindex', '-1'); target.focus(); }
      return;
    }
    if (act === 'ask-helper') {
      this.collect(); this.askHelperOpen = !this.askHelperOpen; this.render(false);
      var ah = this.askHelperOpen ? this.querySelector('[data-ref=askhelp] p') : this.querySelector('[data-act=ask-helper]');
      if (ah) { if (this.askHelperOpen) ah.setAttribute('tabindex', '-1'); ah.focus(); }
      return;
    }
    if (act === 'helper-done') {
      // the learner checks what the helper typed: focus the answer, and read it out if read aloud is on
      this.collect(); this.askHelperOpen = false; this.render(false);
      var hi = this.ref('input'); if (hi) hi.focus();
      var fv = this.state.answers[this.state.field().id];
      if (this.easy && fv) Player.play([{ key: null, text: fv }], this.lang, this);
      return;
    }
    if (act === 'listen') { this.readQuestion(); return; }
    if (act === 'play-opt') { this.readOption(parseInt(b.getAttribute('data-i'), 10)); return; }
    if (act === 'pause') { if (Player.state === 'paused') Player.resume(); else Player.pause(); return; }
    if (act === 'stop-audio') { Player.stop(); var lb = this.querySelector('[data-act=listen]'); if (lb) lb.focus(); return; }
    if (act === 'replay') { if (Player.last && Player.last.owner === this) Player.replay(); else this.readQuestion(); return; }
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

  SavannaOnboardingForm.prototype.langMenu = function (open, focusBtn) {
    var b = this.querySelector('[data-act=lang-menu]'), m = this.ref('langs');
    if (!b || !m) return;
    b.setAttribute('aria-expanded', String(open)); m.hidden = !open;
    if (open) (m.querySelector('[aria-current]') || m.querySelector('button')).focus(); else if (focusBtn) b.focus();
  };
  SavannaOnboardingForm.prototype.status = function (msg) { var s = this.querySelector('.dm-status'); if (s) { s.textContent = ''; setTimeout(function () { s.textContent = msg; }, 50); } };
  SavannaOnboardingForm.prototype.setHeard = function (html) { var h = this.ref('heard'); if (h) h.innerHTML = shiftHeadings(html, this.headingLevel()); };

  /* --- read aloud: what to read on each screen, as pieces named like the clips in docs/audio-script.md --- */
  var ERROR_CLIPS = { errChoice: 'error-choose-one', errMulti: 'error-choose-some', errRequired: 'error-required', errPhone: 'error-phone',
    errDate: 'error-date', errConsent: 'error-consent', errMode: 'error-mode' };
  SavannaOnboardingForm.prototype.readItems = function () {
    var lang = this.lang, s = this.state, form = this.getAttribute('form'), cfg = this.cfg, items = [], self = this;
    if (this.error) {
      var ek = Object.keys(ERROR_CLIPS).filter(function (k) { return t(k, lang) === self.error; })[0];
      items.push({ key: ek ? ERROR_CLIPS[ek] : null, text: this.error });
    }
    if (s.mode === 'question') {
      var f = s.field();
      items.push({ key: clipKey(form, f.id, 'question'), url: f.audio && f.audio[lang],
        text: [L(f.label, lang), L(f.body, lang), L(f.hint, lang)].filter(Boolean).join(' ') });
      optionsOf(f).forEach(function (o) { items.push({ key: clipKey(form, f.id, 'option', o.value), text: L(o.label, lang) }); });
    } else if (s.mode === 'welcome') {
      items.push({ key: 'welcome-question', text: t('welcomeTitle', lang) + ' ' + t('welcomeHint', lang) });
      MODES.forEach(function (m) { items.push({ key: clipKey('welcome', 'option', m), text: t('m_' + m, lang) }); });
    } else if (s.mode === 'review') {
      items.push({ key: clipKey(form, 'check-answers'), text: (L(cfg.reviewTitle, lang) || t('review', lang)) + '. ' + (L(cfg.reviewHint, lang) || t('reviewHint', lang)) });
      if (cfg.reviewNote) items.push({ key: clipKey(form, 'check-answers-note'), text: L(cfg.reviewNote, lang) });
    } else if (s.mode === 'done') {
      items.push({ key: clipKey(form, 'done'), text: L(cfg.doneTitle, lang) + ' ' + L(cfg.doneText, lang) });
    } else if (s.mode === 'saved') {
      items.push({ key: 'saved-for-later', text: t('savedTitle', lang) + '. ' + t('savedText', lang) });
    }
    return items;
  };
  SavannaOnboardingForm.prototype.readQuestion = function () { this._played = true; Player.play(this.readItems(), this.lang, this); };
  SavannaOnboardingForm.prototype.readOption = function (i) {
    var lang = this.lang, s = this.state, form = this.getAttribute('form'), item;
    if (s.mode === 'welcome') item = { key: clipKey('welcome', 'option', MODES[i]), text: t('m_' + MODES[i], lang) };
    else { var f = s.field(), o = optionsOf(f)[i]; if (!o) return; item = { key: clipKey(form, f.id, 'option', o.value), text: L(o.label, lang) }; }
    this._played = true;
    Player.play([item], lang, this);
  };
  /* Player controls: Pause/Resume and Stop while something plays, Play again afterwards. */
  SavannaOnboardingForm.prototype.updatePlayer = function () {
    var box = this.ref('player');
    if (!box) return;
    var mine = Player.owner === this, active = mine && Player.state !== 'idle';
    box.hidden = !(active || (mine && this._played));
    var pause = box.querySelector('[data-act=pause]'), stop = box.querySelector('[data-act=stop-audio]'), again = box.querySelector('[data-act=replay]');
    pause.hidden = !active; stop.hidden = !active; again.hidden = active;
    var lbl = this.ref('pause-label'); if (lbl) lbl.textContent = t(Player.state === 'paused' ? 'resume' : 'pause', this.lang);
  };
  SavannaOnboardingForm.prototype.audioIssue = function (code) { this.status(t(code, this.lang)); };

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
    b.innerHTML = pic(getPrefs().pictures, on ? '⏹️' : '🎤') + esc(t(on ? 'stop' : 'speak', lang));
  };
  SavannaOnboardingForm.prototype.voiceReset = function () {
    if (this.voice && this.voice.session) this.voice.session.abort();
    this.voice = null; this.setHeard(''); this.setVoiceButton(false);
  };
  SavannaOnboardingForm.prototype.startVoice = function () {
    var lang = this.lang, self = this, f = this.state.field();
    if (!voiceAllowed(f)) return; // never on sensitive questions
    if (!speech.input.supported()) { this.status(t('voiceUnsupported', lang)); return; }
    if (navigator.onLine === false && speech.input === browserInput) { this.status(t('voiceNetwork', lang)); return; }
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
    Player.stop();
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
    if (f.type === 'ethdate') {
      var cur = this.readField(f), dv = null;
      for (var j = 0; j < alts.length && !dv; j++) dv = parseSpokenDate(alts[j], cur && cur.cal === 'greg' ? 'greg' : 'eth');
      if (!dv) { v.state = 'error'; this.setVoiceButton(false); this.status(t('voiceNoDate', lang)); return; }
      v.date = dv; v.shown = View.display(this.vm(), f, dv);
    } else if (f.type === 'choice' || f.type === 'consent' || f.type === 'multi') {
      var opts = optionsOf(f), hits = [];
      for (var i = 0; i < alts.length && !hits.length; i++) hits = matchOptions(alts[i], opts);
      if (!hits.length) { v.state = 'error'; this.status(t('voiceNoMatch', lang)); return; }
      // a single choice never guesses between two answers ("yes ... no")
      if (f.type !== 'multi' && hits.length > 1) { v.state = 'error'; this.status(t('voiceAmbiguous', lang)); return; }
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
    if (this.easy) Player.play([{ key: null, text: t('heard', lang) + ' ' + v.shown }], lang, this);
  };

  /* The learner checked the transcript: only now does it become the answer (still saved only on Continue). */
  SavannaOnboardingForm.prototype.confirmVoice = function () {
    var v = this.voice, form = this.querySelector('.dm-form');
    if (!v || v.state !== 'review' || !form) return;
    if (v.date) { // a checked spoken date: shown in the fields (calendar, day, month, year); saved on Continue
      this.voice = null; this.state.setAnswer(v.field.id, v.date); this.render(false);
      this.status(t('voiceUsed', this.lang));
      var sb = this.querySelector('.dm-form button[type=submit]'); if (sb) sb.focus();
      return;
    }
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
        else if (n === 'pictures') patch.pictures = v === 'on';
        else patch[n] = v;
        self._selfPrefs = true; setPrefs(patch); self._selfPrefs = false;
        var keep = n + '=' + (n === 'mode' ? v : patch[n] === true ? 'on' : patch[n] === false ? 'off' : v);
        if (n === 'easy' && !patch.easy) Player.stop();
        self.render();
        var el = self.querySelector('input[name="' + n + '"][value="' + keep.split('=')[1] + '"]') || self.querySelector('input[name="' + n + '"]:checked');
        if (el) el.focus();
        var s = self.querySelector('.dm-status');
        if (s) setTimeout(function () { s.textContent = t('settingsSaved', getPrefs().lang); }, 50);
      });
      this._onPrefs = function () { if (!self._selfPrefs) self.render(); };
      document.addEventListener('savanna-onboarding:prefs', this._onPrefs);
      this.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.getAttribute('data-act') === 'audio-download') OfflineAudio.download('am');
        if (b.getAttribute('data-act') === 'audio-remove') OfflineAudio.remove();
      });
      this._onAudio = function (s, msg) {
        self.renderAudio();
        if (msg) {
          var st = self.querySelector('[data-ref=audio-status]'), lang = getPrefs().lang;
          if (st) { st.textContent = ''; setTimeout(function () { st.textContent = t(msg, lang, { n: s.stored, total: s.total, done: s.done, failed: s.failed }); }, 50); }
          if (msg === 'oa_done' || msg === 'oa_partial' || msg === 'oa_removed') {
            var nb = self.querySelector('[data-act=audio-download]') || self.querySelector('[data-act=audio-remove]'); if (nb) nb.focus();
          }
        }
      };
      OfflineAudio.on(this._onAudio);
      this.render();
      OfflineAudio.refresh('am');
    }
    disconnectedCallback() { document.removeEventListener('savanna-onboarding:prefs', this._onPrefs); OfflineAudio.off(this._onAudio); this._ready = false; }
    /* "Amharic audio for offline use": size, progress, download and remove. Only the inner part is redrawn. */
    renderAudio() {
      var box = this.querySelector('[data-ref=audio-box]');
      if (!box) return;
      var lang = getPrefs().lang, s = OfflineAudio, list = s.list('am');
      var total = list.length, bytes = list.reduce(function (n, x) { return n + x.bytes; }, 0), h = '';
      if (!s.canStore()) h = '<p>' + t('oa_unsupported', lang) + '</p>';
      else if (!total) h = '<p>' + t('oa_none', lang) + '</p>';
      else {
        h = '<p>' + t('oa_intro', lang) + '</p>';
        if (s.state === 'downloading') {
          h += '<p><label for="so-audio-progress">' + t('oa_progressLabel', lang) + '</label></p>' +
            '<progress id="so-audio-progress" max="' + s.total + '" value="' + (s.done + s.failed) + '"></progress>' +
            '<p>' + t('oa_progress', lang, { done: s.done, total: s.total, mbDone: mb(s.bytes), mb: mb(s.totalBytes) }) + '</p>';
        } else {
          h += '<p>' + (s.stored ? t('oa_stored', lang, { n: s.stored, total: total }) : t('oa_notStored', lang)) + '</p><div class="dm-actions">' +
            (s.stored < total ? '<button type="button" class="dm-btn dm-primary" data-act="audio-download">' + t('oa_download', lang, { mb: mb(bytes) }) + '</button>' : '') +
            (s.stored ? '<button type="button" class="dm-btn" data-act="audio-remove">' + t('oa_remove', lang) + '</button>' : '') + '</div>';
        }
      }
      box.innerHTML = h;
    }
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
        group('lang', t('s_lang', lang), LANGS.map(function (l) { return [l, LANG_NAMES[l], l]; }), p.lang) +
        group('size', t('s_size', lang), [['normal', t('size_normal', lang)], ['large', t('size_large', lang)], ['xlarge', t('size_xlarge', lang)]], p.size) +
        group('contrast', t('s_contrast', lang), [['normal', t('contrast_normal', lang)], ['high', t('contrast_high', lang)]], p.contrast) +
        group('motion', t('s_motion', lang), [['normal', t('motion_normal', lang)], ['reduce', t('motion_reduce', lang)]], p.motion, t('s_motionHint', lang)) +
        // a live preview: the learner sees the effect of text size and contrast at once
        '<div class="dm-preview" aria-labelledby="so-preview-h" role="group"><p id="so-preview-h" class="dm-preview-h">' + t('s_preview', lang) + '</p>' +
        '<p>' + t('previewText', lang) + '</p><span class="dm-btn dm-primary dm-preview-btn" aria-hidden="true">' + t('previewBtn', lang) + '</span></div>' +
        group('mode', t('s_mode', lang), MODES.map(function (m) { return [m, t('m_' + m, lang), null, p.pictures || m === 'simple' ? MODE_ICONS[m] : null]; }), p.mode) +
        group('easy', t('s_read', lang), [['on', t('on', lang)], ['off', t('off', lang)]], p.easy ? 'on' : 'off', t('s_readHint', lang)) +
        group('pictures', t('s_pictures', lang), [['on', t('on', lang)], ['off', t('off', lang)]], p.pictures ? 'on' : 'off') +
        group('voice', t('s_voice', lang), [['on', t('voice_on', lang)], ['off', t('voice_off', lang)]], store.get('voiceConsent', null) === true ? 'on' : 'off', t('s_voiceHint', lang)) +
        '<p class="dm-status" role="status" aria-live="polite"></p></form>' +
        '<section class="dm-offline-audio" aria-labelledby="so-audio-h"><h2 id="so-audio-h">' + t('s_offlineAudio', lang) + '</h2>' +
        '<div data-ref="audio-box"></div><p class="dm-status" data-ref="audio-status" role="status" aria-live="polite"></p></section></div>';
      this.renderAudio();
    }
  }
  if (!customElements.get('savanna-onboarding-settings')) customElements.define('savanna-onboarding-settings', SavannaOnboardingSettings);
  if (!customElements.get('dimts-settings')) customElements.define('dimts-settings', class extends SavannaOnboardingSettings {});
  injectCss(); // tokens are available to the host page as soon as the script runs
  applyPrefs();

  /* Resume links (?resume=CODE): the draft is stored on this device under its form, so the form finds it by itself.
     A code that is not on this device (the link was opened on another phone) is explained by the form. */

  /* ---------- host integration: mount / unmount ----------
     SavannaOnboarding.mount(target, options) puts a form (or the settings panel) inside a host element and returns a
     handle. target: a CSS selector or an element. options:
       form: 'signup' | 'profile' | 'takeover' | 'passport' | 'apply' | 'employer' | a form you registered
       settings: true            show the settings panel instead of a form
       lang: 'am' | 'en'         starting language (otherwise the learner's saved choice)
       instance: 'id'            keeps a separate draft (for example one per job)
       welcome: true             start with the "how would you like to answer?" screen
       backUrl: 'page.html'      the first screen shows "Back" to this page (otherwise it has no Back)
       focus: true               move focus to the question (default true)
       headingLevel: 2           when the host page has its own <h1>: the question becomes an <h2>
       onComplete(detail, slot)  called with the same detail as the savanna-onboarding:complete event, and the
                                 element where the host can add its own "what next" content
     handle = { element, host, unmount() }. SavannaOnboarding.unmount(target or handle) removes it; speech and
     listeners stop, and the learner's saved draft stays on the device. */
  var MOUNTS = [];
  function resolveTarget(target) { return typeof target === 'string' ? document.querySelector(target) : target; }
  function unmount(targetOrHandle) {
    var h = targetOrHandle && targetOrHandle.element ? targetOrHandle : null;
    var host = h ? null : resolveTarget(targetOrHandle);
    MOUNTS.slice().forEach(function (m) {
      if (m === h || (host && m.host === host)) {
        if (m.element.parentNode) m.element.parentNode.removeChild(m.element); // disconnectedCallback stops speech
        MOUNTS.splice(MOUNTS.indexOf(m), 1);
      }
    });
  }
  function mount(target, options) {
    var host = resolveTarget(target), o = options || {};
    if (!host) throw new Error('[savanna-onboarding] mount: no element matches ' + target);
    unmount(host); // one module per host element
    var el = document.createElement(o.settings ? 'savanna-onboarding-settings' : 'savanna-onboarding-form');
    if (!o.settings) {
      if (!o.form) throw new Error('[savanna-onboarding] mount: options.form is required');
      el.setAttribute('form', o.form);
      if (o.instance) el.setAttribute('instance', o.instance);
      if (o.welcome) el.setAttribute('welcome', '');
      if (o.backUrl) el.setAttribute('back-url', o.backUrl);
      if (o.headingLevel) el.setAttribute('heading-level', String(o.headingLevel));
    }
    if (o.lang) el.setAttribute('lang', o.lang);
    if (typeof o.onComplete === 'function') {
      el.addEventListener('savanna-onboarding:complete', function (e) { o.onComplete(e.detail, el.querySelector('.dm-done-slot')); });
    }
    host.appendChild(el);
    if (o.focus !== false) { var q = el.querySelector('.dm-q'); if (q) q.focus(); }
    var handle = { element: el, host: host, unmount: function () { unmount(handle); } };
    MOUNTS.push(handle);
    return handle;
  }

  var API = window.SavannaOnboarding = {
    mount: mount, unmount: unmount,
    version: '0.11.0', register: register, forms: FORMS, NEEDS: NEEDS, store: store, setStorage: setStorage, setSpeech: setSpeech,
    FormState: FormState, validate: validateAnswer, TRUST: TRUST, trustLevel: trustLevel, supportForEmployer: supportForEmployer,
    eth: { toGregorian: ethToGregorian, valid: ethValid, months: ETH_MONTHS, daysInMonth: ethDaysInMonth, fromGregorian: gregToEth, gregorianMonths: GREG_MONTHS, parseSpoken: parseSpokenDate },
    speak: speak, stopSpeaking: function () { Player.stop(); stopSpeaking(); }, label: L,
    player: Player, offlineAudio: OfflineAudio, _matchOptions: matchOptions, audioManifest: function () { return loadAudioManifest().then(function () { return AUDIO.manifest; }); },
    prefs: getPrefs, setPrefs: setPrefs, languages: LANGS, languageNames: LANG_NAMES, prefsForMode: prefsForMode,
    /** Adds the module's styles and fonts to the page (done automatically when a form or settings element appears). */
    styles: function () { injectCss(); applyPrefs(); }
  };
  window.Dimts = API; // deprecated alias
  emit(document, 'ready', null);
})();
