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
      mode: p.mode || '', size: p.size || 'normal', contrast: p.contrast || 'normal', motion: p.motion === 'reduce' ? 'reduce' : 'normal',
      // automatic reading of page summaries: 'ask' until the learner first interacts, then 'on' or 'off'
      autoRead: p.autoRead === 'on' || p.autoRead === 'off' ? p.autoRead : 'ask' };
  }
  /** Automatic reading is one setting for the learner: page summaries (autoRead) and questions (easy) together. */
  function readingOn(p) { p = p || getPrefs(); return p.autoRead === 'on' || (p.autoRead !== 'off' && p.easy); }
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
  var PREF_VALUES = { lang: LANGS, size: ['normal', 'large', 'xlarge'], contrast: ['normal', 'high'], motion: ['normal', 'reduce'], mode: [''].concat(MODES), autoRead: ['ask', 'on', 'off'] };
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
    var p = getPrefs(), patch = { mode: mode, easy: mode !== 'read_type', autoRead: mode !== 'read_type' ? 'on' : 'off', pictures: mode === 'simple' };
    if (mode === 'simple' && p.size === 'normal') patch.size = 'large';
    return patch;
  }

  /* ---------- interface strings (Amharic to be reviewed by a native speaker) ---------- */
  var UI = {
    en: {
      back: 'Back', next: 'Continue', submit: 'Submit', listen: 'Listen to the question',
      speak: 'Answer by voice', stop: 'Stop listening', listening: 'Microphone on. Listening… speak now, and press Stop listening when you have finished.',
      heard: 'I heard:', yes: 'Use this answer', again: 'Say it again', type: 'Type it instead',
      recStart: 'Recording. Speak now, then press Stop when you have finished.',
      readFail: 'Reading aloud isn\'t available right now. Everything is written on the screen.',
      selected: 'Selected:', notSelected: 'Not selected:',
      heardChoose: 'Choose {yes}, {again}, or {type}.', yourAnswer: 'Your answer:', nothingTyped: 'Nothing is typed yet.',
      spell: 'Spell it', readBack: 'Read back my answer', readBackId: 'Read back the number', idNote: 'People near you may hear this.',
      readItAloud: 'Read it aloud', cancel: 'Cancel', readAll: 'Read all my answers',
      readAllIdQ: 'Your ID number is in these answers. People near you may hear it.', readAllWith: 'Read with my ID number', readAllWithout: 'Read without it',
      voiceRemoteFailed: 'The speech service did not answer. Please try again, or type your answer.', voiceNoCredit: 'The speech service is not available right now. Please type your answer.',
      remoteVoiceOff: 'The online voice is not available right now. Everything is written on the screen.', heardSay: 'I heard: {text}. Choose {yes}, {again}, or {type}.',
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
      s_voiceHint: 'To turn your voice into text, your recording is sent to Addis AI (Ethiopia) for Amharic and Afaan Oromo, and to Google (in Chrome) for English. Voice is never offered for ID or support questions.',
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
      voiceConsent: 'To turn your voice into text, your recording is sent to a speech service: Addis AI (Ethiopia) for Amharic and Afaan Oromo, and Google (in Chrome) for English, or when Addis AI is not available. You can type or tap instead. You can turn this off at any time in Settings. Do you want to use your voice?',
      voiceAllow: 'Yes, use my voice', voiceDeny: 'No, I will type or tap',
      voiceUnsupported: 'Voice answers are not available in this browser. Try Chrome on Android, or type or tap your answer.',
      voiceNoMatch: 'I did not catch one of the choices. Please say it again or tap your answer.',
      voiceError: 'The microphone did not work. Please type or tap your answer.',
      noAmVoice: 'Amharic audio is not installed on this device yet. Recorded Amharic audio will be added.',
      saved: 'Saved.', selected: 'Selected:',
      errRequired: 'Please answer this question to continue.',
      errChoice: 'Choose one answer to continue.',
      errMulti: 'Choose at least one answer.',
      errPhone: 'Enter a phone number with 10 digits, like 0911 23 45 67.',
      errDate: 'Enter a real date in the Ethiopian calendar. Day 1 to 30, Pagume 1 to 5 or 6.',
      errConsent: 'You need to agree to continue. If you are not sure, choose "Get help".',
      day: 'Day', month: 'Month', year: 'Year', chooseMonth: 'Choose a month', chooseDay: 'Choose a day', chooseYear: 'Choose a year',
      gregorian: 'In the Gregorian calendar this is {date}.', ethiopian: 'In the Ethiopian calendar this is {date}.',
      calendar: 'Which calendar do you use?', calEth: 'Ethiopian calendar', calGreg: 'Gregorian (European) calendar',
      errDateGreg: 'Enter a real date in the Gregorian calendar, for example 5 March 1995.',
      dvOpen: 'Answer by voice', dvPart: 'Part {n} of {m}',
      dvYearQ: 'Which year were you born?', dvYearHint: 'Say the year, for example 1990. You can also say the whole date at once.', dvYearOnlyHint: 'Say the year, for example 1990.',
      dvMonthQ: 'Which month were you born?', dvMonthHint: 'Say the name of the month, or "month" and a number, for example "month 3".',
      dvDayQ: 'Which day of the month were you born?', dvDayHint: 'Say a number from 1 to {n}.',
      dvAgeQ: 'How old are you?', dvAgeHint: 'Say a number, for example 25.',
      dvDontKnow: 'I don\'t know my exact date of birth', dvUnknown: 'That is fine. You can say just the year you were born, or your age.',
      dvKnowYear: 'Say the year', dvKnowAge: 'Say my age',
      dvYear: 'Year: {v}', dvMonth: 'Month: {v}', dvDay: 'Day: {v}', dvAge: 'Age: {v}',
      dvNoYear: 'I did not catch a year. Say it again, for example 1990, or type it.', dvNoMonth: 'I did not catch a month. Say its name, or "month" and a number.',
      dvNoDay: 'I did not catch a day. Say a number, for example 12.', dvNoAge: 'I did not catch an age. Say a number, for example 25.',
      dvBadYear: 'That would make you {age} years old. Say the year again.', dvBadYearSay: 'That year does not look right. Say the year again.',
      dvDayRange: '{month} has {n} days. Say the day again.', dvBadDaySay: 'That day is not in this month.',
      dvReadBack: 'You said {said}. That is {other}. Is that right?', dvReadBackYear: 'You said about {year}. Is that right?', dvReadBackAge: 'You said you are {age} years old. Is that right?',
      dvChange_year: 'Change the year', dvChange_month: 'Change the month', dvChange_day: 'Change the day',
      dvAboutYearEth: 'About {y} (in the Gregorian calendar {a} or {b})', dvAboutYearGreg: 'About {y} (in the Ethiopian calendar {a} or {b})', dvAboutAge: 'About {age} years old',
      dvExact: 'Enter an exact date instead',
      voiceNoDate: 'I did not catch a date. Say the day, the month and the year, for example "12 Meskerem 1995", or type it below.',
      prefilled: 'We filled this in from your profile. You can change it.',
      welcomeTitle: 'How would you like to complete registration?',
      welcomeHint: 'This is only about how you like to use the form. You can change it at any time in Settings.',
      m_read_type: 'Read and type', m_listen: 'Listen and respond', m_speak: 'Speak my answers', m_simple: 'Simple steps with pictures and big text',
      errMode: 'Choose one way to continue.',
      settings: 'Settings', settingsHint: 'Your settings are saved on this phone and used everywhere this tool appears.',
      s_lang: 'Language', s_size: 'Text size', s_contrast: 'Contrast', s_mode: 'How I like to answer', s_read: 'Automatic reading',
      s_readHint: 'Each page and question is read aloud when it opens, and every answer has its own Listen button. Everything is also written on the screen. Escape stops the sound.',
      s_auto: 'Automatic reading of page summaries', auto_on: 'Read a short summary of each page and step when it opens', auto_off: 'Turn off automatic reading',
      s_autoHint: 'English only for now. Pause and Stop are always at the top of the page, and Escape stops the sound at once. Screen reader users may prefer to turn it off.',
      s_pictures: 'Pictures and bigger buttons',
      askHelperDone: 'I have the phone back', voiceAmbiguous: 'I heard more than one answer. Please say just one, or tap your answer.',
      srTip: 'If your screen reader spells Amharic letters one by one, turn on Automatic reading (under Accessibility) to hear recorded Amharic, or switch to English.',
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
      play: 'Listen', pause: 'Pause', resume: 'Resume', stopAudio: 'Stop', replay: 'Play again', nowReading: 'Now reading…', audioControls: 'Audio playing',
      noAudio: 'There is no recording for this yet, and this phone has no voice for this language. Everything is written on the screen.',
      blocked: 'The browser did not allow sound yet. Press Listen to hear it. Everything is written on the screen.',
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
      recStart: 'እየተቀዳ ነው። አሁን ይናገሩ፤ ሲጨርሱ «{stop}»ን ይጫኑ።',
      readFail: 'ጮክ ብሎ ማንበብ አሁን አይገኝም። ሁሉም ነገር በማያ ገጹ ላይ ተጽፏል።',
      selected: 'ተመርጧል፦', notSelected: 'አልተመረጠም፦',
      heardChoose: '«{yes}»፣ «{again}» ወይም «{type}»ን ይምረጡ።', yourAnswer: 'መልስዎ፦', nothingTyped: 'እስካሁን ምንም አልተጻፈም።',
      spell: 'ፊደል በፊደል አንብብ', readBack: 'መልሴን አንብብልኝ', readBackId: 'ቁጥሩን አንብብልኝ', idNote: 'በአጠገብዎ ያሉ ሰዎች ሊሰሙት ይችላሉ።',
      readItAloud: 'ጮክ ብለህ አንብበው', cancel: 'ተው', readAll: 'መልሶቼን ሁሉ አንብብልኝ',
      readAllIdQ: 'የመታወቂያ ቁጥርዎ በእነዚህ መልሶች ውስጥ አለ። በአጠገብዎ ያሉ ሰዎች ሊሰሙት ይችላሉ።', readAllWith: 'ከመታወቂያ ቁጥሬ ጋር አንብብ', readAllWithout: 'ያለ እሱ አንብብ',
      voiceRemoteFailed: 'የንግግር አገልግሎቱ አልመለሰም። እባክዎ እንደገና ይሞክሩ፣ ወይም መልስዎን ይጻፉ።', voiceNoCredit: 'የንግግር አገልግሎቱ አሁን አይገኝም። እባክዎ መልስዎን ይጻፉ።',
      remoteVoiceOff: 'የኦንላይን ድምፁ አሁን አይገኝም። ሁሉም ነገር በማያ ገጹ ላይ ተጽፏል።', heardSay: 'የሰማሁት፦ {text}። «{yes}»፣ «{again}» ወይም «{type}»ን ይምረጡ።',
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
      s_voiceHint: 'ድምፅዎን ወደ ጽሑፍ ለመቀየር ቅጂዎ ለአማርኛና ለአፋን ኦሮሞ ወደ Addis AI (ኢትዮጵያ)፣ ለእንግሊዝኛ ወደ Google (በChrome) ይላካል። ለመታወቂያ ወይም ለድጋፍ ጥያቄዎች ድምፅ በፍጹም አይቀርብም።',
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
      voiceConsent: 'ድምፅዎን ወደ ጽሑፍ ለመቀየር ቅጂዎ ወደ የንግግር አገልግሎት ይላካል፦ ለአማርኛና ለአፋን ኦሮሞ Addis AI (ኢትዮጵያ)፣ ለእንግሊዝኛ ወይም Addis AI በማይገኝበት ጊዜ Google (በChrome)። በምትኩ መጻፍ ወይም መንካት ይችላሉ። ይህን በማንኛውም ጊዜ በቅንብሮች ውስጥ ማጥፋት ይችላሉ። ድምፅዎን መጠቀም ይፈልጋሉ?',
      voiceAllow: 'አዎ፣ ድምፄን ተጠቀም', voiceDeny: 'አይ፣ እጽፋለሁ ወይም እነካለሁ',
      voiceUnsupported: 'በዚህ ብራውዘር በድምፅ መመለስ አይቻልም። በአንድሮይድ ላይ Chrome ይሞክሩ ወይም ይጻፉ።',
      voiceNoMatch: 'ከምርጫዎቹ አንዱን አልሰማሁም። እባክዎ እንደገና ይናገሩ ወይም መልስዎን ይንኩ።',
      voiceError: 'ማይክሮፎኑ አልሰራም። እባክዎ ይጻፉ ወይም ይንኩ።',
      noAmVoice: 'የአማርኛ ድምፅ በዚህ ስልክ ላይ ገና አልተጫነም። የተቀዳ የአማርኛ ድምፅ ይጨመራል።',
      saved: 'ተቀምጧል።', selected: 'የተመረጠ፦',
      errRequired: 'ለመቀጠል እባክዎ ይህን ጥያቄ ይመልሱ።',
      errChoice: 'ለመቀጠል አንድ መልስ ይምረጡ።',
      errMulti: 'ቢያንስ አንድ መልስ ይምረጡ።',
      errPhone: 'ባለ 10 አሃዝ ስልክ ቁጥር ያስገቡ፤ ለምሳሌ 0911 23 45 67።',
      errDate: 'በኢትዮጵያ አቆጣጠር ትክክለኛ ቀን ያስገቡ። ቀን ከ1 እስከ 30፣ ጳጉሜን ከ1 እስከ 5 ወይም 6።',
      errConsent: 'ለመቀጠል መስማማት ያስፈልጋል። እርግጠኛ ካልሆኑ "እርዳታ"ን ይምረጡ።',
      day: 'ቀን', month: 'ወር', year: 'ዓመት', chooseMonth: 'ወር ይምረጡ', chooseDay: 'ቀን ይምረጡ', chooseYear: 'ዓመት ይምረጡ',
      gregorian: 'በፈረንጆች አቆጣጠር {date} ነው።', ethiopian: 'በኢትዮጵያ አቆጣጠር {date} ነው።',
      calendar: 'የትኛውን አቆጣጠር ይጠቀማሉ?', calEth: 'የኢትዮጵያ አቆጣጠር', calGreg: 'የፈረንጆች (የአውሮፓ) አቆጣጠር',
      errDateGreg: 'በፈረንጆች አቆጣጠር ትክክለኛ ቀን ያስገቡ፤ ለምሳሌ 5 March 1995።',
      dvOpen: 'በድምፅ ይመልሱ', dvPart: 'ክፍል {n} ከ{m}',
      dvYearQ: 'በየትኛው ዓመት ተወለዱ?', dvYearHint: 'ዓመቱን ይናገሩ፤ ለምሳሌ 1990። ሙሉውን ቀን በአንድ ጊዜም መናገር ይችላሉ።', dvYearOnlyHint: 'ዓመቱን ይናገሩ፤ ለምሳሌ 1990።',
      dvMonthQ: 'በየትኛው ወር ተወለዱ?', dvMonthHint: 'የወሩን ስም ይናገሩ፤ ወይም «ወር» እና ቁጥር፤ ለምሳሌ «ወር 3»።',
      dvDayQ: 'በወሩ ስንተኛው ቀን ተወለዱ?', dvDayHint: 'ከ1 እስከ {n} ያለ ቁጥር ይናገሩ።',
      dvAgeQ: 'ዕድሜዎ ስንት ነው?', dvAgeHint: 'ቁጥር ይናገሩ፤ ለምሳሌ 25።',
      dvDontKnow: 'ትክክለኛ የትውልድ ቀኔን አላውቅም', dvUnknown: 'ችግር የለም። የተወለዱበትን ዓመት ብቻ ወይም ዕድሜዎን መናገር ይችላሉ።',
      dvKnowYear: 'ዓመቱን እናገራለሁ', dvKnowAge: 'ዕድሜዬን እናገራለሁ',
      dvYear: 'ዓመት፦ {v}', dvMonth: 'ወር፦ {v}', dvDay: 'ቀን፦ {v}', dvAge: 'ዕድሜ፦ {v}',
      dvNoYear: 'ዓመት አልሰማሁም። እንደገና ይናገሩ፤ ለምሳሌ 1990፤ ወይም ይጻፉት።', dvNoMonth: 'ወር አልሰማሁም። የወሩን ስም ወይም «ወር» እና ቁጥር ይናገሩ።',
      dvNoDay: 'ቀን አልሰማሁም። ቁጥር ይናገሩ፤ ለምሳሌ 12።', dvNoAge: 'ዕድሜ አልሰማሁም። ቁጥር ይናገሩ፤ ለምሳሌ 25።',
      dvBadYear: 'ይህ ዕድሜዎን {age} ዓመት ያደርገዋል። ዓመቱን እንደገና ይናገሩ።', dvBadYearSay: 'ይህ ዓመት ትክክል አይመስልም። ዓመቱን እንደገና ይናገሩ።',
      dvDayRange: '{month} {n} ቀናት አሉት። ቀኑን እንደገና ይናገሩ።', dvBadDaySay: 'ይህ ቀን በዚህ ወር ውስጥ የለም።',
      dvReadBack: '{said} ብለዋል። ይህም {other} ነው። ትክክል ነው?', dvReadBackYear: 'በግምት {year} ብለዋል። ትክክል ነው?', dvReadBackAge: 'ዕድሜዎ {age} ዓመት ነው ብለዋል። ትክክል ነው?',
      dvChange_year: 'ዓመቱን ይቀይሩ', dvChange_month: 'ወሩን ይቀይሩ', dvChange_day: 'ቀኑን ይቀይሩ',
      dvAboutYearEth: 'በግምት {y} (በፈረንጆች አቆጣጠር {a} ወይም {b})', dvAboutYearGreg: 'በግምት {y} (በኢትዮጵያ አቆጣጠር {a} ወይም {b})', dvAboutAge: 'በግምት {age} ዓመት',
      dvExact: 'በምትኩ ትክክለኛ ቀን ያስገቡ',
      voiceNoDate: 'ቀን አልሰማሁም። ቀኑን፣ ወሩንና ዓመቱን ይናገሩ፤ ለምሳሌ «12 መስከረም 1995»፤ ወይም ከታች ይጻፉት።',
      prefilled: 'ይህን ከመገለጫዎ ሞልተነዋል። መቀየር ይችላሉ።',
      welcomeTitle: 'ምዝገባውን እንዴት መሙላት ይፈልጋሉ?',
      welcomeHint: 'ይህ ቅጹን መጠቀም የሚመርጡበትን መንገድ ብቻ ነው። በማንኛውም ጊዜ በቅንብሮች ውስጥ መቀየር ይችላሉ።',
      m_read_type: 'አንብቤ እጽፋለሁ', m_listen: 'አዳምጬ እመልሳለሁ', m_speak: 'በድምፅ እመልሳለሁ', m_simple: 'ቀላል ደረጃዎች ከሥዕልና ከትልቅ ጽሑፍ ጋር',
      errMode: 'ለመቀጠል አንድ መንገድ ይምረጡ።',
      settings: 'ቅንብሮች', settingsHint: 'ቅንብሮችዎ በዚህ ስልክ ላይ ይቀመጣሉ፤ ይህ መሣሪያ በሚገኝበት ቦታ ሁሉ ይሠራሉ።',
      s_lang: 'ቋንቋ', s_size: 'የጽሑፍ መጠን', s_contrast: 'ንፅፅር', s_mode: 'መመለስ የምመርጥበት መንገድ', s_read: 'በራስ-ሰር ማንበብ',
      s_auto: 'የገጽ ማጠቃለያዎችን በራስ-ሰር ማንበብ', auto_on: 'እያንዳንዱ ገጽና ደረጃ ሲከፈት አጭር ማጠቃለያ አንብብ', auto_off: 'በራስ-ሰር ማንበብን አጥፋ',
      s_autoHint: 'ለጊዜው በእንግሊዝኛ ብቻ። «ለአፍታ አቁም» እና «አቁም» ሁልጊዜ በገጹ አናት ላይ ናቸው፤ Escape ድምፁን ወዲያው ያቆማል። የስክሪን አንባቢ ተጠቃሚዎች ማጥፋትን ሊመርጡ ይችላሉ።',
      s_readHint: 'ጥያቄዎች ይነበባሉ፤ እያንዳንዱ መልስም የራሱ «አዳምጥ» አዝራር አለው። ሁሉም ነገር በማያ ገጹ ላይም ተጽፏል።',
      s_pictures: 'ሥዕሎችና ትልልቅ አዝራሮች',
      askHelperDone: 'ስልኩ ተመልሶልኛል', voiceAmbiguous: 'ከአንድ በላይ መልስ ሰማሁ። እባክዎ አንዱን ብቻ ይናገሩ ወይም መልስዎን ይንኩ።',
      srTip: 'የስክሪን አንባቢዎ የአማርኛ ፊደላትን አንድ በአንድ የሚያነብ ከሆነ፣ የተቀዳውን የአማርኛ ድምፅ ለመስማት «በራስ-ሰር ማንበብ»ን (በ«ተደራሽነት» ውስጥ) ያብሩ፣ ወይም ወደ እንግሊዝኛ ይቀይሩ።',
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
      play: 'አዳምጥ', pause: 'ለአፍታ አቁም', resume: 'ማጫወት ቀጥል', stopAudio: 'አቁም', replay: 'እንደገና አጫውት', nowReading: 'እያነበብኩ ነው…', audioControls: 'ድምፅ እየተጫወተ ነው',
      noAudio: 'ለዚህ ገና ቅጂ የለም፤ ይህ ስልክም ለዚህ ቋንቋ ድምፅ የለውም። ሁሉም ነገር በማያ ገጹ ላይ ተጽፏል።',
      blocked: 'ብራውዘሩ ድምፅ ገና አልፈቀደም። ለመስማት «አዳምጥ»ን ይጫኑ። ሁሉም ነገር በማያ ገጹ ላይ ተጽፏል።',
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
      recStart: 'Waraabamaa jira. Amma dubbadhu, yoo xumurte "{stop}" tuqi.',
      readFail: 'Sagaleen dubbisuun amma hin jiru. Wanti hundi iskiriinii irratti barreeffameera.',
      selected: 'Filatame:',
      notSelected: 'Hin filatamne:',
      heardChoose: '"{yes}", "{again}" ykn "{type}" filadhu.',
      yourAnswer: 'Deebii kee:',
      nothingTyped: 'Ammaaf wanti barreeffame hin jiru.',
      spell: 'Qubee qubeen dubbisi',
      readBack: 'Deebii koo naaf dubbisi',
      readBackId: 'Lakkoofsa naaf dubbisi',
      idNote: 'Namoonni si bira jiran dhagahuu danda\'u.',
      readItAloud: 'Sagaleen dubbisi',
      cancel: 'Dhiisi',
      readAll: 'Deebii koo hunda naaf dubbisi',
      readAllIdQ: 'Lakkoofsi eenyummaa kee deebii kana keessa jira. Namoonni si bira jiran dhagahuu danda\'u.',
      readAllWith: 'Lakkoofsa eenyummaa koo wajjin dubbisi',
      readAllWithout: 'Isa malee dubbisi',
      voiceRemoteFailed: 'Tajaajilli dubbii deebii hin kennine. Maaloo irra deebi\'ii yaali, ykn deebii kee barreessi.',
      voiceNoCredit: 'Tajaajilli dubbii amma hin jiru. Maaloo deebii kee barreessi.',
      remoteVoiceOff: 'Sagaleen toora interneetii amma hin jiru. Wanti hundi iskiriinii irratti barreeffameera.',
      heardSay: 'Kan ani dhage\'e: {text}. "{yes}", "{again}" ykn "{type}" filadhu.',
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
      s_voiceHint: 'Sagalee kee gara barreeffamaatti jijjiiruuf, waraabbiin kee Afaan Amaaraa fi Afaan Oromootiif gara Addis AI (Itoophiyaa), Ingiliffaaf immoo gara Google (Chrome keessatti) ergama. Gaaffii eenyummaa ykn deeggarsaa irratti sagaleen gonkumaa hin dhiyaatu.',
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
      voiceConsent: 'Sagalee kee gara barreeffamaatti jijjiiruuf, waraabbiin kee tajaajila dubbii tokkotti ergama: Afaan Amaaraa fi Afaan Oromootiif Addis AI (Itoophiyaa), Ingiliffaaf ykn yeroo Addis AI hin jirretti Google (Chrome keessatti). Kanaa mannaa barreessuu ykn tuquu dandeessa. Yeroo kamiyyuu Qindaa\'ina keessatti cufuu dandeessa. Sagalee kee fayyadamuu barbaaddaa?',
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
      errPhone: 'Lakkoofsa bilbilaa dijiitii 10 qabu galchi, fakkeenyaaf 0911 23 45 67.',
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
      dvOpen: 'Sagaleen deebisi', dvPart: 'Kutaa {n} keessaa {m}',
      dvYearQ: 'Bara kam dhalatte?', dvYearHint: 'Waggaa jedhi, fakkeenyaaf 1990. Guyyaa guutuu yeroo tokkotti jechuus dandeessa.', dvYearOnlyHint: 'Waggaa jedhi, fakkeenyaaf 1990.',
      dvMonthQ: 'Ji\'a kam keessa dhalatte?', dvMonthHint: 'Maqaa ji\'aa jedhi, ykn "ji\'a" fi lakkoofsa, fakkeenyaaf "ji\'a 3".',
      dvDayQ: 'Guyyaa ji\'aa meeqaffaa dhalatte?', dvDayHint: 'Lakkoofsa 1 hanga {n} jedhi.',
      dvAgeQ: 'Umuriin kee meeqa?', dvAgeHint: 'Lakkoofsa jedhi, fakkeenyaaf 25.',
      dvDontKnow: 'Guyyaa dhaloota koo sirrii hin beeku', dvUnknown: 'Rakkoo hin qabu. Waggaa itti dhalatte qofa ykn umurii kee jechuu dandeessa.',
      dvKnowYear: 'Waggaa nan jedha', dvKnowAge: 'Umurii koo nan jedha',
      dvYear: 'Waggaa: {v}', dvMonth: 'Ji\'a: {v}', dvDay: 'Guyyaa: {v}', dvAge: 'Umurii: {v}',
      dvNoYear: 'Waggaa hin qabanne. Irra deebi\'ii jedhi, fakkeenyaaf 1990, ykn barreessi.', dvNoMonth: 'Ji\'a hin qabanne. Maqaa isaa ykn "ji\'a" fi lakkoofsa jedhi.',
      dvNoDay: 'Guyyaa hin qabanne. Lakkoofsa jedhi, fakkeenyaaf 12.', dvNoAge: 'Umurii hin qabanne. Lakkoofsa jedhi, fakkeenyaaf 25.',
      dvBadYear: 'Kun umurii kee waggaa {age} taasisa. Waggaa irra deebi\'ii jedhi.', dvBadYearSay: 'Waggaan kun sirrii hin fakkaatu. Waggaa irra deebi\'ii jedhi.',
      dvDayRange: '{month} guyyoota {n} qaba. Guyyaa irra deebi\'ii jedhi.', dvBadDaySay: 'Guyyaan kun ji\'a kana keessa hin jiru.',
      dvReadBack: '{said} jette. Kun {other} dha. Sirrii dha?', dvReadBackYear: 'Gara {year} jette. Sirrii dha?', dvReadBackAge: 'Umuriin kee waggaa {age} jette. Sirrii dha?',
      dvChange_year: 'Waggaa jijjiiri', dvChange_month: 'Ji\'a jijjiiri', dvChange_day: 'Guyyaa jijjiiri',
      dvAboutYearEth: 'Gara {y} (dhaha Gorgooriyaaniitiin {a} ykn {b})', dvAboutYearGreg: 'Gara {y} (dhaha Itoophiyaatiin {a} ykn {b})', dvAboutAge: 'Gara waggaa {age}',
      dvExact: 'Kanaa mannaa guyyaa sirrii galchi',
      voiceNoDate: 'Guyyaa hin qabanne. Guyyaa, ji\'aa fi waggaa jedhi, fakkeenyaaf "12 Fulbaana 1995", ykn armaan gaditti barreessi.',
      prefilled: 'Kana piroofaayilii kee irraa guutneerra. Jijjiiruu dandeessa.',
      welcomeTitle: 'Galmee akkamitti xumuruu barbaadda?',
      welcomeHint: 'Kun akkaataa unka kana itti fayyadamuu barbaaddu qofa ilaala. Yeroo kamiyyuu Qindaa\'ina keessatti jijjiiruu dandeessa.',
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
      s_read: 'Ofumaan dubbisuu',
      s_auto: 'Cuunfaa fuulaa ofumaan dubbisuu', auto_on: 'Yeroo fuulli fi tarkaanfiin banamu cuunfaa gabaabaa dubbisi', auto_off: 'Dubbisa ofumaan dhaabi',
      s_autoHint: 'Ammaaf Ingiliffaa qofa. "Dhaabi xiqqoo" fi "Dhaabi" yeroo hunda fuula gubbaa jiru, Escape immoo sagalee battaluma dhaaba. Fayyadamtoonni dubbisaa iskiriinii dhaabuu filachuu danda\'u.',
      s_readHint: 'Gaaffiiwwan sagaleen dubbifamu, deebii hundi immoo qabduu "Dhaggeeffadhu" mataa isaa qaba. Wanti hundi iskiriinii irrattis ni barreeffama.',
      s_pictures: 'Fakkiiwwan fi qabduuwwan gurguddaa',
      askHelperDone: 'Bilbilli natti deebi\'eera',
      voiceAmbiguous: 'Deebii tokkoo ol dhaga\'e. Maaloo tokko qofa jedhi, ykn deebii kee tuqi.',
      srTip: 'Yoo dubbisaan iskiriinii kee qubee Afaan Amaaraa tokko tokkoon dubbise, sagalee Afaan Amaaraa waraabame dhaggeeffachuuf «Ofumaan dubbisuu» (Dhaqqabummaa keessatti) bani, ykn gara Ingiliffaatti jijjiiri.',
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
      nowReading: 'Dubbisaa jira…',
      audioControls: 'Sagaleen taphachaa jira',
      resume: 'Itti fufi',
      stopAudio: 'Dhaabi',
      replay: 'Irra deebi\'ii taphachiisi',
      noAudio: 'Kanaaf ammaaf waraabbiin hin jiru, bilbilli kun immoo afaan kanaaf sagalee hin qabu. Wanti hundi iskiriinii irratti barreeffameera.',
      blocked: 'Biraawuzarri ammaaf sagalee hin hayyamne. Dhaggeeffachuuf "Dhaggeeffadhu" tuqi. Wanti hundi iskiriinii irratti barreeffameera.',
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
    no_id_yet: { en: 'No ID added yet', am: 'ገና መታወቂያ አልተጨመረም', om: 'Ammaaf eenyummaan hin dabalamne' },
    self_declared: { en: 'Self-declared', am: 'በራስ የተገለጸ', om: 'Ofiin kan himame' },
    document_number_recorded: { en: 'Number recorded — not verified', am: 'ቁጥር ተመዝግቧል — አልተረጋገጠም', om: 'Lakkoofsi galmeeffameera — hin mirkanoofne' },
    partner_referral_pending: { en: 'Partner referral pending', am: 'የአጋር ድርጅት ማረጋገጫ በመጠበቅ ላይ', om: 'Ergaan michuu eegaa jira' }
  };
  /** Trust status from the "Add your ID (optional)" answers: the ID route and whether a number was given. */
  function trustLevel(a) {
    if (!a || !a.id_route) return 'no_id_yet';
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
  /* ---------- numbers and dates said aloud (date of birth by voice) ----------
     Number words in English, Amharic and Afaan Oromo (Amharic and Oromo: drafts for native-speaker review).
     Amharic spellings that sound the same (ሀ/ሐ/ኀ, ሰ/ሠ, አ/ዐ, ጸ/ፀ, and ሀ/ሃ, አ/ኣ) count as one. */
  function ethFold(s) {
    return String(s).replace(/[ሀ-ፚ]/g, function (c) {
      var cp = c.charCodeAt(0), base = cp - (cp % 8), ord = cp % 8;
      if (base === 0x1210 || base === 0x1280) base = 0x1200;
      else if (base === 0x1220) base = 0x1230;
      else if (base === 0x12D0) base = 0x12A0;
      else if (base === 0x1340) base = 0x1338;
      if ((base === 0x1200 || base === 0x12A0) && ord === 3) ord = 0;
      return String.fromCharCode(base + ord);
    });
  }
  /** Lower case, no punctuation, apostrophes joined (Oromo ji'a -> jia), hyphens split (twenty-five), Amharic folded. */
  function sayNorm(s) { return ethFold(String(s || '').toLowerCase().replace(/[’'`]/g, '').replace(/[.,!?።፣፤፡;:"()\/\-–—]/g, ' ').replace(/\s+/g, ' ').trim()); }
  var NUMW = null;
  function numWords() {
    if (NUMW) return NUMW;
    var w = {};
    function put(words, n, extra) { words.split(' ').forEach(function (x) { var e = { n: n }; if (extra) Object.keys(extra).forEach(function (k) { e[k] = extra[k]; }); w[ethFold(x)] = e; }); }
    // English
    ['zero oh nought', 'one first', 'two second', 'three third', 'four fourth', 'five fifth', 'six sixth', 'seven seventh', 'eight eighth', 'nine ninth']
      .forEach(function (x, i) { put(x, i); });
    ['ten tenth', 'eleven eleventh', 'twelve twelfth', 'thirteen thirteenth', 'fourteen fourteenth', 'fifteen fifteenth', 'sixteen sixteenth',
      'seventeen seventeenth', 'eighteen eighteenth', 'nineteen nineteenth'].forEach(function (x, i) { put(x, 10 + i); });
    ['twenty twentieth', 'thirty thirtieth', 'forty fourty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'].forEach(function (x, i) { put(x, 20 + 10 * i); });
    put('hundred', 100, { scale: true }); put('thousand', 1000, { scale: true }); put('and', 0, { and: true });
    // Amharic
    ['ዜሮ', 'አንድ አንደኛ', 'ሁለት ሁለተኛ', 'ሶስት ሦስት ሶስተኛ ሦስተኛ', 'አራት አራተኛ', 'አምስት አምስተኛ', 'ስድስት ስድስተኛ', 'ሰባት ሰባተኛ', 'ስምንት ስምንተኛ', 'ዘጠኝ ዘጠነኛ']
      .forEach(function (x, i) { put(x, i); });
    put('አስር አሥር አስራ አሥራ አስረኛ አሥረኛ', 10); // አስራ ሁለት = 12
    ['ሃያ', 'ሰላሳ ሠላሳ', 'አርባ', 'ሃምሳ', 'ስልሳ ስድሳ ሥልሳ', 'ሰባ', 'ሰማንያ ሰማኒያ', 'ዘጠና'].forEach(function (x, i) { put(x, 20 + 10 * i); });
    put('መቶ', 100, { scale: true }); put('ሺህ ሺ', 1000, { scale: true }); put('እና', 0, { and: true });
    // Afaan Oromo: the number after dhibba / kuma says how many ("kuma tokko fi dhibba sagal" = 1900)
    ['duwwaa', 'tokko tokkoo tokkoffaa', 'lama lamaan lammaffaa', 'sadii sadi sadaffaa', 'afur afrii afraffaa', 'shan shanan shanaffaa', 'jaha jaa jahaffaa',
      'torba torbaffaa', 'saddeet saddeeti saddeettaffaa', 'sagal sagali sagalaffaa'].forEach(function (x, i) { put(x, i); });
    put('kudhan kurna kudha kurnaffaa', 10); // kudha lama = 12
    ['digdama digdamii', 'soddoma soddomii', 'afurtama afurtamii', 'shantama shantamii', 'jaatama jaatamii jahatama', 'torbaatama torbaatamii',
      'saddeettama saddeettamii saddeetama', 'sagaltama sagaltamii'].forEach(function (x, i) { put(x, 20 + 10 * i); });
    put('dhibba', 100, { scale: true, post: true }); put('kuma', 1000, { scale: true, post: true }); put('fi', 0, { and: true });
    return (NUMW = w);
  }
  /** Words as number tokens: { n, digit }, { n, scale, post }, { and }, or { word } (anything else). "12th", "12ኛ", "በ1990" are digits. */
  function numTokens(text) {
    var W = numWords();
    return sayNorm(text).split(' ').filter(Boolean).map(function (tok) {
      var dg = tok.match(/\d+/g);
      if (dg && dg.length === 1) return { n: parseInt(dg[0], 10), digit: true };
      var bare = tok.replace(/ው$/, ''), unprefixed = /^[በከ]./.test(tok) ? tok.slice(1) : '';
      return W[tok] || W[bare] || (unprefixed && (W[unprefixed] || W[unprefixed.replace(/ው$/, '')])) || { word: tok };
    });
  }
  /** The numbers in a sentence, in order. Words make one number ("nineteen ninety" = 1990, "አንድ ሺህ ዘጠኝ መቶ ዘጠና ሁለት"
   *  = 1992, "kuma tokko fi dhibba sagal fi sagaltamii lama" = 1992); digits are numbers of their own. */
  function numberGroups(toks) {
    var groups = [], total = 0, chunk = 0, any = false, post = 0;
    function settle() { if (post) { if (post === 1000) total += 1000; else chunk += 100; post = 0; } }
    function flush() { settle(); if (any) groups.push(total + chunk); total = 0; chunk = 0; any = false; }
    toks.forEach(function (tk) {
      if (tk.and) return;
      if (tk.word != null) { flush(); return; }
      if (tk.digit) { flush(); groups.push(tk.n); return; }
      if (tk.scale) {
        settle(); any = true;
        if (tk.post) { post = tk.n; return; }
        if (tk.n === 1000) { total += (chunk || 1) * 1000; chunk = 0; } else chunk = (chunk || 1) * 100;
        return;
      }
      var v = tk.n;
      if (post) { if (post === 1000) total += v * 1000; else chunk += v * 100; post = 0; return; }
      if (!any) { chunk = v; any = true; return; }
      var low = chunk % 100;
      if (chunk === 0 || (low === 0 && v < 100)) { chunk += v; return; }          // "two thousand five", "nine hundred ninety"
      if (low >= 10 && low % 10 === 0 && v < 10) { chunk += v; return; }          // "twenty five", "አስራ ሁለት", "digdamii shan"
      if (!total && chunk >= 10 && chunk < 100 && v < 100) { chunk = chunk * 100 + v; return; } // "nineteen ninety", "twenty twenty"
      flush(); chunk = v; any = true;
    });
    flush();
    return groups;
  }
  /** One number said aloud, in English, Amharic or Afaan Oromo, as digits or words. null when there is none (or several). */
  function parseSpokenNumber(text, lang) {
    var g = numberGroups(numTokens(text));
    if (!g.length) return null;
    if (g.length === 1) return g[0];
    if (g.length === 2 && g[0] >= 10 && g[0] < 100 && g[1] < 100) return g[0] * 100 + g[1]; // "19 90"
    return g.every(function (x) { return x === g[0]; }) ? g[0] : null;
  }
  function nowYear(cal) { var now = new Date(); return cal === 'greg' ? now.getFullYear() : gregToEth(now).y; }
  /** A year: two digits get the century that gives an age from 14 to 80 in the chosen calendar ("90" = 1990, "05" = 2005). */
  function inferYear(n, cal) {
    if (n == null) return null;
    if (n >= 1000) return n;
    if (n >= 100) return null;
    var top = nowYear(cal), c = [1900 + n, 2000 + n];
    return c.filter(function (y) { var a = top - y; return a >= 14 && a <= 80; })[0] || c.filter(function (y) { return y <= top; }).pop() || null;
  }
  // Other ways the months are said or written (besides the names on screen in three languages)
  var MONTH_SAY = {
    eth: ['meskerem meskeram maskaram mesekerem', 'tikimt tikemt tekemt tikmt tiqimt teqemt', 'hidar hedar ህዳር', 'tahsas tahisas tahesas tehsas ታህሳስ',
      'tir', 'yekatit yakatit', 'megabit magabit', 'miyazia miyazya miyaziya ሚያዚያ', 'ginbot genbot gimbot', 'sene senie', 'hamle hamlie', 'nehase nehasie nahase',
      'pagume pagumen pagumie ጳጉሜ'],
    greg: ['jan', 'feb ፌብሯሪ', 'mar', 'apr', '', 'jun', 'jul', 'aug ኦጋስት', 'sep sept', 'oct', 'nov ኖቨምበር', 'dec']
  };
  var MONTH_CANDS = null;
  function monthCandidates() {
    if (MONTH_CANDS) return MONTH_CANDS;
    var out = [];
    [['eth', ETH_MONTHS], ['greg', GREG_MONTHS]].forEach(function (pair) {
      Object.keys(pair[1]).forEach(function (lg) { pair[1][lg].forEach(function (name, i) { out.push({ w: sayNorm(name), m: i + 1, cal: pair[0] }); }); });
      MONTH_SAY[pair[0]].forEach(function (list, i) { list.split(' ').filter(Boolean).forEach(function (x) { out.push({ w: sayNorm(x), m: i + 1, cal: pair[0] }); }); });
    });
    return (MONTH_CANDS = out);
  }
  function lev(a, b) {
    var A = Array.from(a), B = Array.from(b), prev = [], cur, i, j;
    for (j = 0; j <= B.length; j++) prev[j] = j;
    for (i = 1; i <= A.length; i++) {
      cur = [i];
      for (j = 1; j <= B.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[B.length];
  }
  /** A month name heard in a sentence, in either calendar and any of the three languages, allowing small mistakes
   *  ("Meskeram", "ታህሳስ", "Onkoloolessa"). In Afaan Oromo both calendars use the same names: the chosen one wins.
   *  Returns { m, cal, at } (at: the word's position) or null. */
  function matchMonth(text, cal) {
    var best = null;
    sayNorm(text).split(' ').forEach(function (tk, at) {
      if (!tk || /\d/.test(tk)) return;
      var ethiopic = /[ሀ-፿]/.test(tk);
      monthCandidates().forEach(function (c) {
        var d = tk === c.w ? 0 : -1, len = Array.from(c.w).length;
        if (d < 0) {
          var allow = ethiopic ? (len >= 3 ? 1 : 0) : (len >= 7 ? 2 : len >= 4 ? 1 : 0);
          if (!ethiopic && tk.charAt(0) !== c.w.charAt(0)) allow = 0; // a misheard name keeps its first sound ("remember" is not December)
          if (allow && Math.abs(Array.from(tk).length - len) <= allow) { var x = lev(tk, c.w); if (x <= allow) d = x; }
          // a month name with a little added (በመስከረም, Fulbaanaa)
          if (d < 0 && len >= 4 && tk.indexOf(c.w) !== -1 && Array.from(tk).length - len <= 2) d = 1;
        }
        if (d < 0) return;
        var score = d * 2 + (c.cal === cal ? 0 : 1);
        if (!best || score < best.score) best = { m: c.m, cal: c.cal, at: at, score: score };
      });
    });
    return best && { m: best.m, cal: best.cal, at: best.at };
  }
  /** "month 3", "the third month", "ወር 3", "3ኛው ወር", "ji'a 3": the month by its number. */
  function monthByNumber(text, cal) {
    var s = sayNorm(text), kw = /(^| )(month|ወር|ወሩ|jia|jiaa)( |$)/;
    var n = parseSpokenNumber(kw.test(s) ? s.replace(kw, ' ') : s);
    return n != null && n >= 1 && n <= (cal === 'greg' ? 12 : 13) ? { m: n, cal: cal } : null;
  }
  /** Parts of a date said in one sentence: { cal, y?, m?, d? }. "12 Meskerem 1990", "March 5 1990", "5 3 1990",
   *  "Meskerem 90", "መስከረም 12 አንድ ሺህ ዘጠኝ መቶ ዘጠና". A month name also tells which calendar is meant. */
  function parseDateParts(text, cal) {
    var out = { cal: cal === 'greg' ? 'greg' : 'eth' }, mm = matchMonth(text, out.cal);
    if (mm) { out.m = mm.m; out.cal = mm.cal; }
    var g = numberGroups(numTokens(text)), i, y = null;
    for (i = 0; i < g.length; i++) if (g[i] >= 1000) { y = g.splice(i, 1)[0]; break; }
    if (y == null && g.length >= 3 && g[g.length - 2] >= 10 && g[g.length - 2] <= 20 && g[g.length - 1] < 100) { var lo = g.pop(); y = g.pop() * 100 + lo; } // "5 3 19 90"
    if (y == null && (g.length >= (out.m ? 2 : 3) || (out.m && g.length === 1 && g[0] > 31))) y = inferYear(g.pop(), out.cal); // "12 Meskerem 90"
    if (y != null) out.y = y;
    if (g.length) out.d = g.shift();
    if (!out.m && g.length) out.m = g.shift();
    return out;
  }
  function partCount(p) { return ['y', 'm', 'd'].filter(function (k) { return p[k] != null; }).length; }
  function daysIn(cal, y, m) {
    if (!m) return cal === 'greg' ? 31 : 30;
    if (cal === 'greg') return new Date(Date.UTC(y || 2000, m, 0)).getUTCDate(); // without a year, 29 February is allowed
    return m < 13 ? 30 : (y ? ethDaysInMonth(y, m) : 6);
  }
  var AGE_MIN = 10, AGE_MAX = 100; // outside this, a year was almost certainly misheard
  /** The first part of a (partial) date that cannot be right: { part: 'year'|'month'|'day', msg (on screen), say (read aloud) }. */
  function dateProblem(p, lang) {
    if (p.y != null) {
      var age = nowYear(p.cal) - p.y;
      if (age < AGE_MIN || age > AGE_MAX) return { part: 'year', msg: age < 0 ? t('dvBadYearSay', lang) : t('dvBadYear', lang, { age: age }), say: { key: 'dv-bad-year', text: t('dvBadYearSay', lang), lang: lang } };
    }
    if (p.m != null && (p.m < 1 || p.m > (p.cal === 'greg' ? 12 : 13))) return { part: 'month', msg: t('dvNoMonth', lang), say: { key: 'dv-no-month', text: t('dvNoMonth', lang), lang: lang } };
    if (p.d != null) {
      var n = daysIn(p.cal, p.y, p.m);
      if (p.d < 1 || p.d > n) return { part: 'day', msg: p.m ? t('dvDayRange', lang, { month: monthsFor(p.cal, lang)[p.m - 1], n: n }) : t('dvNoDay', lang), say: { key: 'dv-bad-day', text: t('dvBadDaySay', lang), lang: lang } };
    }
    return null;
  }
  /* A spoken date: "12 Meskerem 1995", "March 5 1990", "5 3 1990". A month name also tells which calendar is meant. */
  function parseSpokenDate(said, cal) {
    var p = parseDateParts(said, cal);
    return dateValue(p.cal, p.d, p.m, p.y);
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
  function speak(text, lang, audioUrl, done, opts) {
    stopSpeaking();
    if (audioUrl) {
      try { currentAudio = new Audio(audioUrl); if (done) currentAudio.onended = done; var pr = currentAudio.play(); if (pr && pr.catch) pr.catch(function () {}); return true; } catch (e) {} // blocked sound never throws
    }
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return false;
    var code = SPEECH_CODES[lang] ? lang : 'en';
    var voices = window.speechSynthesis.getVoices() || [];
    var mine = voices.filter(function (v) { return (v.lang || '').toLowerCase().indexOf(code) === 0; });
    // local: only a voice that runs on this phone (some browser voices are online services)
    if (opts && opts.local) mine = mine.filter(function (v) { return v.localService; });
    var voice = mine[0];
    if (!voice && (code !== 'en' || (opts && opts.local))) return false; // never read Amharic or Oromo text with an English voice
    var u = new SpeechSynthesisUtterance(text);
    u.lang = SPEECH_CODES[code];
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.onerror = function (e) {
      if (e && e.error === 'not-allowed') { audioBlocked(); return; } // autoplay rules: wait for the learner
      if (done && (!e || e.error !== 'interrupted' && e.error !== 'canceled')) done();
    };
    if (done) u.onend = done;
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
  /* REMOTE SPEECH THROUGH THE HOST'S PROXY (for example Addis AI for Amharic and Afaan Oromo). The module holds no key
     and calls no third party: the host passes the address of its own proxy with mount({ speechProxy: '/api' }) or
     SavannaOnboarding.setSpeechProxy('/api'). Contract (same origin):
       POST <proxy>/stt?lang=am|om  body: the recording (audio/webm or audio/mp4)  -> { "text": "…" }
       POST <proxy>/tts  JSON { "text": "…", "lang": "am"|"om" }                -> audio/mpeg
       errors -> { "error": "not_configured" | "no_credit" | "busy" | … }
     Used only for Amharic and Afaan Oromo; English keeps the browser's own engines. Recorded clips always come first.
     Recordings stop at 30 seconds. Anything that fails (no proxy, no key, no credit, offline) falls back to the
     browser's engines with a plain message, and the proxy is not asked again in this tab when it is not set up. */
  // Paused only when the proxy is not set up (no proxy, no key, wrong origin), and tried again after 60 seconds. A
  // passing failure ("unavailable", "busy") never switches it off: the next piece simply tries again.
  var REMOTE = { url: null, langs: ['am', 'om'], downUntil: 0, maxSeconds: 30, timeoutMs: 20000, retryMs: 60000 };
  try { var du = sessionStorage.getItem('savanna-onboarding.remoteDown'); REMOTE.downUntil = du === '1' ? Infinity : +du || 0; } catch (e) {}
  function setSpeechProxy(url) { REMOTE.url = url ? String(url).replace(/\/+$/, '') : null; }
  function remoteIsDown() { return Date.now() < REMOTE.downUntil; }
  function remoteOn(lang) { return !!REMOTE.url && !remoteIsDown() && REMOTE.langs.indexOf(lang) !== -1 && navigator.onLine !== false && !!window.fetch; }
  function remoteDown() { REMOTE.downUntil = Date.now() + REMOTE.retryMs; try { sessionStorage.setItem('savanna-onboarding.remoteDown', String(REMOTE.downUntil)); } catch (e) {} }
  /** POST to the proxy; resolves with the Response, rejects with a short code. Not set up -> remembered for this tab. */
  function remoteFetch(path, init) {
    var ctl = window.AbortController ? new AbortController() : null, timer = ctl ? setTimeout(function () { ctl.abort(); }, REMOTE.timeoutMs) : null;
    if (ctl) init.signal = ctl.signal;
    init.credentials = 'same-origin';
    init.referrerPolicy = 'same-origin'; // so the browser sends our Origin (the site's no-referrer policy would send "null")
    return fetch(REMOTE.url + path, init).then(function (r) {
      clearTimeout(timer);
      if (r.ok) return r;
      if (r.status === 404 || r.status === 405 || r.status === 501) { remoteDown(); throw 'not_configured'; } // no proxy here
      return r.json().catch(function () { return {}; }).then(function (j) {
        var code = (j && j.error) || 'unavailable';
        if (code === 'not_configured' || code === 'origin') remoteDown();
        throw code;
      });
    }, function () { clearTimeout(timer); throw 'unavailable'; });
  }
  /** Text-to-speech: an object URL of the MP3. Cached in the browser by text + language + voice, never paid twice. */
  var TTS_CACHE = 'savanna-onboarding-tts';
  function ttsKey(text, lang) {
    var h = 0, s = lang + '|proxy-default|' + text; // the voice is the proxy's choice for the language
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return REMOTE.url + '/tts?lang=' + lang + '&n=' + s.length + '&h=' + (h >>> 0).toString(36);
  }
  var ttsPending = {}; // the same words asked twice at once: one request, never paid twice
  function remoteTts(text, lang) {
    var key = ttsKey(text, lang);
    if (ttsPending[key]) return ttsPending[key].then(function (b) { return URL.createObjectURL(b); });
    var p = remoteTtsBlob(text, lang, key);
    ttsPending[key] = p;
    p.then(function () { delete ttsPending[key]; }, function () { delete ttsPending[key]; });
    return p.then(function (b) { return URL.createObjectURL(b); });
  }
  function remoteTtsBlob(text, lang, key) {
    var store = window.caches && window.isSecureContext !== false ? window.caches : null;
    var cached = store ? store.open(TTS_CACHE).then(function (c) { return c.match(key); }).catch(function () { return null; }) : Promise.resolve(null);
    return cached.then(function (hit) {
      if (hit) return hit.blob();
      return remoteFetch('/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.slice(0, 600), lang: lang }) })
        .then(function (r) { return r.blob(); })
        .then(function (b) {
          if (store) store.open(TTS_CACHE).then(function (c) { return c.put(key, new Response(b, { headers: { 'Content-Type': 'audio/mpeg' } })); }).catch(function () {});
          return b;
        });
    });
  }
  /** Speech-to-text of one recording. */
  function remoteStt(blob, lang) {
    var type = (blob.type || 'audio/webm').split(';')[0];
    return remoteFetch('/stt?lang=' + encodeURIComponent(lang), { method: 'POST', headers: { 'Content-Type': type }, body: blob })
      .then(function (r) { return r.json(); }).then(function (j) { return (j && typeof j.text === 'string') ? j.text.trim() : ''; });
  }
  function recorderType() {
    if (!window.MediaRecorder) return null;
    var types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    for (var i = 0; i < types.length; i++) { try { if (!MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(types[i])) return types[i]; } catch (e) {} }
    return null;
  }
  /* Records with the microphone until Stop (at most 30 seconds), then sends the recording to the proxy. Same
     interface as the browser engine, so the reviewed voice state machine is unchanged. */
  var remoteInput = {
    supported: function () { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && recorderType()); },
    start: function (lang, h) {
      var stopped = false, rec = null, stream = null, chunks = [], timer = null, ended = false;
      function end() { if (!ended) { ended = true; h.end(); } }
      function release() { clearTimeout(timer); if (stream) stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} }); stream = null; }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (st) {
        stream = st;
        if (stopped) { release(); end(); return; }
        var type = recorderType();
        rec = new MediaRecorder(st, { mimeType: type, audioBitsPerSecond: 32000 });
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = function () {
          release();
          if (stopped === 'abort') { end(); return; }
          var blob = new Blob(chunks, { type: rec.mimeType || type });
          if (!blob.size) { h.error('no-speech'); end(); return; }
          remoteStt(blob, lang).then(function (text) {
            if (!text) h.error('no-speech'); else h.result([text]);
            end();
          }, function (code) { h.error(code === 'no_credit' ? 'remote-no-credit' : 'remote-failed'); end(); });
        };
        rec.start();
        timer = setTimeout(function () { if (rec && rec.state === 'recording') { stopped = 'stop'; rec.stop(); } }, REMOTE.maxSeconds * 1000); // protects the balance
      }, function (e) {
        h.error(e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'not-allowed' : 'audio-capture'); end();
      });
      return {
        stop: function () { if (stopped) return; stopped = 'stop'; if (rec && rec.state === 'recording') rec.stop(); },
        abort: function () { stopped = 'abort'; chunks = []; if (rec && rec.state === 'recording') rec.stop(); else { release(); end(); } }
      };
    }
  };
  /* The default input: Amharic and Afaan Oromo through the proxy when the host set one up; otherwise (and for English)
     the browser's engine. */
  var autoInput = {
    supported: function (lang) { return (remoteOn(lang) && remoteInput.supported()) || browserInput.supported(lang); },
    start: function (lang, h) { return (remoteOn(lang) && remoteInput.supported() ? remoteInput : browserInput).start(lang, h); }
  };
  var speech = { input: autoInput, output: {
    speak: function (text, lang, audioUrl, done, opts) { return speak(text, lang, audioUrl, done, opts); },
    stop: function () { stopSpeaking(); },
    pause: function () { try { window.speechSynthesis.pause(); } catch (e) {} },
    resume: function () { try { window.speechSynthesis.resume(); } catch (e) {} }
  } };
  /** A short, quiet beep when recording starts. Never throws: no Web Audio, or sound blocked, means no beep. */
  var beepCtx = null;
  function beep() {
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      var c = beepCtx || (beepCtx = new C());
      if (c.state === 'suspended' && c.resume) { var pr = c.resume(); if (pr && pr.catch) pr.catch(function () {}); }
      var o = c.createOscillator(), g = c.createGain();
      o.frequency.value = 880; g.gain.value = 0.12;
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.15);
    } catch (e) { /* no beep */ }
  }
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
  /* The browser blocked sound (autoplay rules: no interaction with this page yet). Nothing is thrown: the player
     stops quietly, tells its owner ('blocked') and the page (event savanna-onboarding:audioblocked), so the host can
     ask the learner to tap or press a key. Everything stays written on the screen. */
  function audioBlocked() {
    var owner = Player.owner;
    Player.stop(true);
    if (owner && owner.audioIssue) { try { owner.audioIssue('blocked'); } catch (e) {} }
    emit(document, 'audioblocked', null);
  }
  /* PLAYBACK BAR: "Now reading… Pause · Stop", pinned to the bottom of the page and shown only while audio plays.
     The words are announced politely. While it is shown, the page gets bottom padding and scroll padding of the
     bar's height, so it never covers focused content (WCAG 2.4.11). Escape stops the sound. If focus is inside the
     bar when it hides, focus goes back to where the learner was before. */
  var PlayBar = {
    el: null, before: null,
    build: function () {
      if (this.el || !document.body) return this.el;
      var self = this, el = this.el = document.createElement('div');
      el.className = 'so-playbar'; el.id = 'so-playbar'; el.hidden = true;
      el.setAttribute('role', 'region');
      el.innerHTML = '<p class="so-playbar-t" data-so-play="text" role="status" aria-live="polite"></p>' +
        '<button type="button" class="so-playbar-b" data-so-play="pause"></button><button type="button" class="so-playbar-b" data-so-play="stop"></button>';
      el.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-so-play]'), act = b && b.getAttribute('data-so-play');
        if (act === 'pause') { if (Player.state === 'paused') Player.resume(); else Player.pause(); }
        else if (act === 'stop') { Player.stop(); stopSpeaking(); }
      });
      document.addEventListener('focusin', function (e) { if (!el.contains(e.target)) self.before = e.target; });
      document.body.appendChild(el);
      return el;
    },
    update: function () {
      var el = this.build(); if (!el) return;
      var lang = getPrefs().lang, on = Player.state !== 'idle', root = document.documentElement;
      el.setAttribute('lang', lang); el.setAttribute('aria-label', t('audioControls', lang));
      el.querySelector('[data-so-play=pause]').textContent = t(Player.state === 'paused' ? 'resume' : 'pause', lang);
      el.querySelector('[data-so-play=stop]').textContent = t('stopAudio', lang);
      var txt = el.querySelector('[data-so-play=text]');
      if (on && el.hidden) {
        var ae = document.activeElement; if (ae && ae !== document.body && !el.contains(ae)) this.before = ae; // where to return to
        el.hidden = false; txt.textContent = ''; setTimeout(function () { if (Player.state !== 'idle') txt.textContent = t('nowReading', lang); }, 50); }
      if (!on && !el.hidden) {
        var had = el.contains(document.activeElement);
        el.hidden = true; txt.textContent = '';
        if (had && this.before && document.contains(this.before)) { try { this.before.focus(); } catch (e) {} }
      }
      root.classList.toggle('so-playing', on);
      if (on) root.style.setProperty('--so-playbar-h', el.offsetHeight + 'px');
    }
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && Player.state !== 'idle') { Player.stop(); stopSpeaking(); } });
  var Player = {
    items: [], i: 0, state: 'idle', lang: 'en', last: null, owner: null, audio: null, subs: [],
    on: function (fn) { this.subs.push(fn); }, off: function (fn) { var k = this.subs.indexOf(fn); if (k !== -1) this.subs.splice(k, 1); },
    emit: function () { var s = this; this.subs.slice().forEach(function (fn) { fn(s); }); try { PlayBar.update(); } catch (e) {} },
    play: function (items, lang, owner) {
      this.stop(true);
      var self = this;
      this.items = items; this.i = 0; this.lang = lang; this.owner = owner || null; this.state = 'playing';
      this._pending = false; this._failReported = false;
      this.last = { items: items, lang: lang, owner: owner || null };
      this.emit();
      loadAudioManifest().then(function () { if (self.items === items && self.state === 'playing') self.next(); });
    },
    next: function () {
      var self = this, items = this.items;
      if (this.state !== 'playing') return;
      this.audio = null;
      if (this.i >= items.length) { this.state = 'idle'; this.emit(); return; }
      // each piece in its own language (mixed content: Amharic labels with English job text)
      var it = items[this.i++], url = it.url || (it.key ? clipUrl(it.key, it.lang || this.lang) : null);
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
      try {
        var pr = a.play();
        if (pr && pr.catch) pr.catch(function (e) { if (e && e.name === 'NotAllowedError') { if (self.audio === a) audioBlocked(); } else fail(); });
      } catch (e) { fail(); }
    },
    /* No recorded clip: Addis AI for Amharic and Afaan Oromo (through the host's proxy), then the phone's own voice.
       Only when every source fails is a plain message shown (once), and reading goes on with the next piece.
       local pieces (an ID number) never leave the phone: no online voice, only a voice that runs on the phone. */
    voice: function (it, done) {
      if (this.state !== 'playing') return;
      var self = this, items = this.items, lang = it.lang || this.lang;
      if (!it._remote && !it.local && it.text && remoteOn(lang)) {
        it._remote = true;
        remoteTts(it.text, lang).then(function (url) {
          if (self.items !== items || self.state === 'idle') { URL.revokeObjectURL(url); return; }
          it.url = url; it._checked = true; self.i--; // play it like a recording (Pause, Stop, Escape all work)
          if (self.state === 'playing') self.next(); else self._pending = true;
        }, function () {
          if (self.items !== items || self.state === 'idle') return;
          self.voice(it, done); // the phone's own voice next
        });
        return;
      }
      if (!it.text || !speech.output.speak(it.text, lang, null, done, it.local ? { local: true } : null)) {
        if (!this._failReported) { this._failReported = true; this.report('readFail'); }
        setTimeout(done, 0); // the other pieces may still be readable (another language, a recording)
      }
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
      if (this._pending) { this._pending = false; this.emit(); this.next(); return; }
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
  /** Pieces to read the content of an element (a confirmation, a card): each visible heading, paragraph, list item,
   *  term and description in order, in the language of its nearest lang attribute. Buttons and hidden text are left out. */
  function itemsFromElement(root, lang) {
    if (!root) return [];
    var blocks = root.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd'), items = [];
    Array.prototype.forEach.call(blocks, function (el) {
      if (el.closest('[hidden],[aria-hidden="true"],.dm-vh,.sj-vh,.vh,.dm-actions,.actions,button') || el.querySelector('h1,h2,h3,h4,p,li,dt,dd')) return;
      if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return;
      // the words only: no buttons, no decorative icons
      var copy = el.cloneNode(true);
      Array.prototype.forEach.call(copy.querySelectorAll('button,.btn,[aria-hidden="true"],.dm-vh,.sj-vh,.vh'), function (x) { x.parentNode.removeChild(x); });
      var text = (copy.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      var near = el.closest('[lang]'), l = near ? near.getAttribute('lang') : lang;
      items.push({ key: null, text: text, lang: LANGS.indexOf(l) !== -1 ? l : lang });
    });
    return items;
  }
  /* ---------- reading back what the learner gave, so it can be checked by ear ----------
     Phone numbers digit by digit in groups ("zero nine one one, two three four, five six seven"); names as they are,
     and spelled letter by letter (Ethiopic: syllable by syllable) on request; each part in its own script's
     language. ID numbers only on request, digit by digit, never through an online voice. */
  var DIGIT_WORDS = {
    en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
    am: ['ዜሮ', 'አንድ', 'ሁለት', 'ሶስት', 'አራት', 'አምስት', 'ስድስት', 'ሰባት', 'ስምንት', 'ዘጠኝ'],
    om: ['zeeroo', 'tokko', 'lama', 'sadii', 'afur', 'shan', 'jaha', 'torba', 'saddeet', 'sagal']
  };
  /* Numbers 0-99 in words (Amharic and Afaan Oromo are drafts for native-speaker review). Used to read phone numbers
     the Ethiopian way, and the same words as the recorded number clips num-0 … num-99 (tools/audio-script.cjs). */
  var TENS_WORDS = {
    en: ['', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
    am: ['', 'አስር', 'ሃያ', 'ሰላሳ', 'አርባ', 'ሃምሳ', 'ስልሳ', 'ሰባ', 'ሰማንያ', 'ዘጠና'],
    om: ['', 'kudhan', 'digdama', 'soddoma', 'afurtama', 'shantama', 'jaatama', 'torbaatama', 'saddeettama', 'sagaltama']
  };
  var EN_TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  function numberWords(n, lang) {
    var W = DIGIT_WORDS[lang] || DIGIT_WORDS.en, T = TENS_WORDS[lang] || TENS_WORDS.en, o = n % 10, t = Math.floor(n / 10);
    if (n < 10) return W[n];
    if (lang === 'am') return n < 20 ? (n === 10 ? T[1] : 'አስራ ' + W[o]) : T[t] + (o ? ' ' + W[o] : '');
    if (lang === 'om') return n < 20 ? (n === 10 ? T[1] : 'kudha ' + W[o]) : (o ? T[t].replace(/a$/, 'ii') + ' ' + W[o] : T[t]);
    return n < 20 ? EN_TEENS[o] : T[t] + (o ? '-' + W[o] : '');
  }
  /** Ethiopian phone numbers: 0911 23 45 67 (shown), read "zero nine, eleven, twenty-three, forty-five, sixty-seven".
   *  Returns the parts: single digits (the 0 and the 9) and two-digit numbers (a pair starting with 0 is read as
   *  two digits). Anything else: pairs of digits. */
  function phoneParts(v) {
    var d = String(v || '').replace(/\D/g, ''), head = [], rest = d;
    if (d.length === 12 && d.indexOf('251') === 0) { head = ['2', '5', '1', d.charAt(3)]; rest = d.slice(4); }
    else if (d.length === 10 && d.charAt(0) === '0') { head = [d.charAt(0), d.charAt(1)]; rest = d.slice(2); }
    var pairs = rest.match(/.{1,2}/g) || [], parts = head.slice();
    pairs.forEach(function (pr) { if (pr.length === 2 && pr.charAt(0) === '0') parts.push('0', pr.charAt(1)); else parts.push(pr); });
    return parts;
  }
  function formatPhone(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.length === 10 && d.charAt(0) === '0') return d.slice(0, 4) + ' ' + d.slice(4, 6) + ' ' + d.slice(6, 8) + ' ' + d.slice(8);
    if (d.length === 12 && d.indexOf('251') === 0) return '+251 ' + d.slice(3, 6) + ' ' + d.slice(6, 8) + ' ' + d.slice(8, 10) + ' ' + d.slice(10);
    return String(v || '');
  }
  function spokenPhone(v, lang) {
    var parts = phoneParts(v), out = [];
    // the leading single digits are said together ("zero nine"), then each number after a pause
    var lead = []; while (parts.length && parts[0].length === 1 && out.length === 0 && lead.length < (String(v).replace(/\D/g, '').length === 12 ? 4 : 2)) lead.push(numberWords(+parts.shift(), lang));
    if (lead.length) out.push(lead.join(' ') + (parts.length ? ' ' + numberWords(+parts.shift(), lang) : '')); // "zero nine eleven"
    return out.concat(parts.map(function (x) { return numberWords(+x, lang); })).join(', ');
  }
  /** A phone number, on the phone only: recorded number clips where they exist (num-0 … num-99), otherwise a voice
   *  that runs on the phone. Never sent to an online voice. */
  function phoneItems(v, lang) {
    var clips = AUDIO.manifest && AUDIO.manifest[lang] && AUDIO.manifest[lang]['num-11'];
    if (!clips) return [{ key: null, text: spokenPhone(v, lang), lang: lang, local: true }];
    return phoneParts(v).map(function (x) { return { key: 'num-' + (+x), text: numberWords(+x, lang), lang: lang, local: true }; });
  }
  /** The language to read a piece of text in: Ethiopic letters are read as Amharic, other letters in the page's
   *  language when it is Afaan Oromo (Latin script), otherwise English. */
  function scriptLang(text, lang) { return /[\u1200-\u137F]/.test(text) ? 'am' : (lang === 'om' ? 'om' : 'en'); }
  function spelled(text) {
    return Array.from(String(text || '')).filter(function (c) { return /\S/.test(c); }).map(function (c) { return /[a-z]/i.test(c) ? c.toUpperCase() : c; }).join(', ');
  }
  function isNameField(f) { return !!f.voiceWarning || (f.type === 'text' && /name/.test(f.id)); }
  /** Pieces to read back an answer. prefix: 'heard' or 'yourAnswer'. */
  function readBackItems(f, value, lang, prefix) {
    var items = [{ key: prefix === 'heard' ? 'msg-heard' : 'msg-your-answer', text: t(prefix, lang), lang: lang }];
    if (f.type === 'tel') items = items.concat(phoneItems(value, lang)); // on the phone only
    else items.push({ key: null, text: String(value), lang: scriptLang(String(value), lang) });
    return items;
  }
  /** An ID number, digit by digit, on this phone only (recorded Amharic digits, or the phone's own voice). */
  function localDigitItems(value, lang) {
    var W = DIGIT_WORDS[lang] || DIGIT_WORDS.en;
    return Array.from(String(value || '')).filter(function (c) { return /[0-9a-z]/i.test(c); }).map(function (c) {
      return /\d/.test(c) ? { key: 'num-' + c, text: W[+c], lang: lang, local: true } : { key: null, text: c.toUpperCase(), lang: 'en', local: true };
    });
  }
  /* --- date of birth by voice: what is read aloud. Every piece is a recorded clip (numbers 0-99, month names,
     "thousand", "hundred", the fixed sentences), all on the phone: a date of birth is never sent to an online voice. --- */
  var SCALE_WORDS = { en: { k: 'thousand', h: 'hundred', and: 'and' }, am: { k: 'ሺህ', h: 'መቶ', and: 'እና' }, om: { k: 'kuma', h: 'dhibba', and: 'fi' } };
  function numPiece(n, lang) { return n >= 0 && n < 100 ? { key: 'num-' + n, text: numberWords(n, lang), lang: lang, local: true } : { key: null, text: String(n), lang: lang, local: true }; }
  /** A year in words: Amharic "አንድ ሺህ ዘጠኝ መቶ ዘጠና", Oromo "kuma tokko fi dhibba sagal fi sagaltama". */
  function yearPieces(y, lang) {
    var S = SCALE_WORDS[lang] || SCALE_WORDS.en, th = Math.floor(y / 1000), hu = Math.floor(y % 1000 / 100), r = y % 100, out = [];
    var K = { key: 'num-1000', text: S.k, lang: lang, local: true }, H = { key: 'num-100', text: S.h, lang: lang, local: true }, AND = { key: 'num-and', text: S.and, lang: lang, local: true };
    if (lang === 'en') return [{ key: null, text: String(y), lang: 'en', local: true }];
    if (lang === 'om') {
      if (th) out.push(K, numPiece(th, lang));
      if (hu) { if (out.length) out.push(AND); out.push(H, numPiece(hu, lang)); }
      if (r) { if (out.length) out.push(AND); out.push(numPiece(r, lang)); }
      return out;
    }
    if (th) out.push(numPiece(th, lang), K);
    if (hu) out.push(numPiece(hu, lang), H);
    if (r) out.push(numPiece(r, lang));
    return out;
  }
  function monthPiece(cal, m, lang) { return { key: 'month-' + cal + '-' + m, text: monthsFor(cal, lang)[m - 1], lang: lang, local: true }; }
  function fmtDateParts(cal, d, m, y, lang) { return d + ' ' + monthsFor(cal, lang)[m - 1] + ' ' + y; }
  function datePieces(cal, d, m, y, lang) {
    if (lang === 'en') return [{ key: null, text: fmtDateParts(cal, d, m, y, lang), lang: 'en', local: true }];
    return [numPiece(d, lang), monthPiece(cal, m, lang)].concat(yearPieces(y, lang));
  }
  /** A sentence with slots ({said}, {other}…) as pieces: the fixed words between the slots are clips named key-a, key-b…
   *  (the same names in every language, whatever the word order). */
  function templatePieces(key, tpl, slots, lang) {
    var out = [], letter = 0;
    tpl.split(/\{(\w+)\}/).forEach(function (p, i) {
      if (i % 2) { out = out.concat(slots[p] || []); return; }
      var k = key + '-' + 'abcdef'.charAt(letter++), clean = p.replace(/^[\s.,።፣]+/, '').trim();
      if (clean) out.push({ key: k, text: clean, lang: lang, local: true });
    });
    return out;
  }
  var DV_PARTS = { full: ['year', 'month', 'day'], year: ['year'], age: ['age'] };
  var DV_KEY = { year: 'y', month: 'm', day: 'd', age: 'age' };
  var DV_Q = { year: 'dvYearQ', month: 'dvMonthQ', day: 'dvDayQ', age: 'dvAgeQ' };
  var DV_NO = { year: 'dvNoYear', month: 'dvNoMonth', day: 'dvNoDay', age: 'dvNoAge' };
  var DV_DAY_COUNTS = [5, 6, 28, 29, 30, 31];
  function dvHint(dv, lang) {
    if (dv.part === 'year') return t(dv.mode === 'full' ? 'dvYearHint' : 'dvYearOnlyHint', lang);
    if (dv.part === 'month') return t('dvMonthHint', lang);
    if (dv.part === 'day') return t('dvDayHint', lang, { n: daysIn(dv.cal, dv.y, dv.m) });
    return t('dvAgeHint', lang);
  }
  function dvPromptKey(dv) {
    return dv.part === 'year' ? (dv.mode === 'full' ? 'dv-year' : 'dv-year-only') : dv.part === 'day' ? 'dv-day-' + daysIn(dv.cal, dv.y, dv.m) : 'dv-' + dv.part;
  }
  function dvOther(dv, lang) {
    var v = dateValue(dv.cal, dv.d, dv.m, dv.y);
    return v ? (dv.cal === 'greg' ? fmtEthiopian(v.gregorian, lang) : fmtGregorian(new Date(v.gregorian), lang)) : '';
  }
  function dvReadBackText(dv, lang) {
    if (dv.mode === 'year') return t('dvReadBackYear', lang, { year: dv.y });
    if (dv.mode === 'age') return t('dvReadBackAge', lang, { age: dv.age });
    return t('dvReadBack', lang, { said: fmtDateParts(dv.cal, dv.d, dv.m, dv.y, lang), other: dvOther(dv, lang) });
  }
  function dvReadBackItems(dv, lang) {
    if (lang === 'en') return [{ key: null, text: dvReadBackText(dv, lang), lang: 'en', local: true }];
    if (dv.mode === 'year') return templatePieces('dv-about', t('dvReadBackYear', lang), { year: yearPieces(dv.y, lang) }, lang);
    if (dv.mode === 'age') return templatePieces('dv-age-said', t('dvReadBackAge', lang), { age: [numPiece(dv.age, lang)] }, lang);
    var v = dateValue(dv.cal, dv.d, dv.m, dv.y), o = dv.cal === 'greg' ? gregToEth(new Date(v.gregorian)) : null, g = new Date(v.gregorian);
    var other = dv.cal === 'greg' ? datePieces('eth', o.d, o.m, o.y, lang) : datePieces('greg', g.getUTCDate(), g.getUTCMonth() + 1, g.getUTCFullYear(), lang);
    return templatePieces('dv-readback', t('dvReadBack', lang), { said: datePieces(dv.cal, dv.d, dv.m, dv.y, lang), other: other }, lang);
  }
  /** What was heard for one part (or several), on screen: "Year: 1990, Month: Meskerem". */
  function dvShown(vals, cal, lang) {
    var out = [];
    if (vals.y != null) out.push(t('dvYear', lang, { v: vals.y }));
    if (vals.m != null) out.push(t('dvMonth', lang, { v: monthsFor(cal, lang)[vals.m - 1] }));
    if (vals.d != null) out.push(t('dvDay', lang, { v: vals.d }));
    if (vals.age != null) out.push(t('dvAge', lang, { v: vals.age }));
    return out.join(', ');
  }
  function dvValuePieces(vals, cal, lang) {
    if (lang === 'en') return [{ key: null, text: dvShown(vals, cal, lang), lang: 'en', local: true }];
    var out = [];
    if (vals.d != null) out.push(numPiece(vals.d, lang));
    if (vals.m != null) out.push(monthPiece(cal, vals.m, lang));
    if (vals.y != null) out = out.concat(yearPieces(vals.y, lang));
    if (vals.age != null) out.push(numPiece(vals.age, lang));
    return out;
  }
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
  function isEmpty(v) { return v == null || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && 'cal' in v && !v.d && !v.m && !v.y && !v.age); }
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
    if (f.type === 'ethdate' && !v.gregorian && !(v.precision === 'year' && v.y >= 1900) && !(v.precision === 'age' && v.age > 0 && v.age < 130))
      return t(v.cal === 'greg' ? 'errDateGreg' : 'errDate', lang);
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
    // the playback bar (outside any form: on the page itself)
    '.so-playbar{position:fixed;left:0;right:0;bottom:0;z-index:2000;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.5em 1em;padding:.5em 1em;background:var(--so-heading);color:#fff;font-family:var(--so-font);font-size:calc(var(--so-base-size) * var(--so-scale));box-shadow:0 -2px 8px rgba(0,0,0,.25)}',
    '.so-playbar[hidden]{display:none}',
    '.so-playbar-t{margin:0;font-weight:600}',
    '.so-playbar-b{min-height:44px;min-width:44px;padding:.3em 1em;border:2px solid #fff;border-radius:var(--so-radius-sm);background:#fff;color:var(--so-heading);font:inherit;font-weight:600;cursor:pointer}',
    '.so-playbar-b:focus-visible{outline:3px solid #fff;outline-offset:3px}',
    'html.so-playing{scroll-padding-bottom:calc(var(--so-playbar-h, 4.5em) + 1em)}',
    'html.so-playing body{padding-bottom:calc(var(--so-playbar-h, 4.5em) + 1em)}',
    'html[data-dm-contrast=high] .so-playbar{background:#000}',
    'html[data-dm-contrast=high] .so-playbar-b{color:#000}',
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

    /* "Listen to the question". */
    listenTools: function (vm) {
      var lang = vm.lang;
      // Pause and Stop are in the playback bar at the bottom of the page, shown only while audio plays
      return '<button type="button" class="dm-btn" data-act="listen">' + pic(vm.pictures, '🔊') + t('listen', lang) + '</button>';
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
        // No language choice here: the host page sets the language (on Savanna's pages, from the bar at the top)
        // no reading switch here: "Automatic reading" is one setting, in the page's Accessibility panel and Settings
        '<button type="button" class="dm-btn dm-small" data-act="help" aria-expanded="' + !!vm.helpOpen + '" aria-controls="' + helpId + '">' + t('help', lang) + '</button>' +
        '</div></div>' +
        '<div id="' + helpId + '" data-ref="help" class="dm-panel"' + (vm.helpOpen ? '' : ' hidden') + '><h2>' + t('helpTitle', lang) + '</h2><p>' + esc(L(vm.cfg.help, lang) || t('helpText', lang)) + '</p>' + View.srTip() +
        '<div class="dm-actions"><button type="button" class="dm-btn dm-small" data-act="listen-help">' + pic(vm.pictures, '🔊') + t('listen', lang) + '</button>' +
        '<button type="button" class="dm-btn dm-small" data-act="help">' + t('helpClose', lang) + '</button></div></div>';
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
      // read back what was typed (names and phone numbers); the ID number only on request, after a short note
      if (isNameField(f) || f.type === 'tel') h += '<button type="button" class="dm-btn" data-act="readback">' + pic(vm.pictures, '🔁') + t('readBack', lang) + '</button>';
      if (f.sensitive && f.type === 'text') h += '<button type="button" class="dm-btn" data-act="readback-id" aria-expanded="false" aria-controls="' + View.id(vm, 'idnote') + '">' + t('readBackId', lang) + '</button>';
      var canSpeak = voiceAllowed(f, vm) && speech.input.supported(lang);
      if (canSpeak) h += f.type === 'ethdate' // the date by voice: one part at a time, in its own panel below
        ? '<button type="button" class="dm-btn" data-act="date-voice">' + pic(vm.pictures, '🎤') + t('dvOpen', lang) + '</button>'
        : '<button type="button" class="dm-btn" data-act="speak" aria-pressed="false">' + pic(vm.pictures, '🎤') + t('speak', lang) + '</button>';
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
      if (f.sensitive && f.type === 'text') h += '<div id="' + View.id(vm, 'idnote') + '" class="dm-note" data-ref="idnote" hidden><p>' + t('idNote', lang) + '</p>' +
        '<div class="dm-actions"><button type="button" class="dm-btn dm-primary" data-act="readback-id-go">' + t('readItAloud', lang) + '</button><button type="button" class="dm-btn" data-act="readback-id-cancel">' + t('cancel', lang) + '</button></div></div>';
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
        if (v && v.precision) // only the year, or the age (said by voice): shown as it is, with a way back to an exact date
          return '<p class="dm-note" data-ref="date-about">' + esc(View.display(vm, f, v)) + '</p><p><button type="button" class="dm-link" data-act="dv-exact">' + t('dvExact', lang) + '</button></p>';
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
      if (f.type === 'tel') return formatPhone(v);
      if (f.type === 'ethdate' && v.precision === 'age') return t('dvAboutAge', lang, { age: v.age });
      if (f.type === 'ethdate' && v.precision === 'year') return v.cal === 'greg' ? t('dvAboutYearGreg', lang, { y: v.y, a: v.y - 8, b: v.y - 7 }) : t('dvAboutYearEth', lang, { y: v.y, a: v.y + 7, b: v.y + 8 });
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
      h += '<div class="dm-tools">' + (vm.easy ? View.listenTools(vm) : '') + '<button type="button" class="dm-btn" data-act="readall" aria-expanded="false" aria-controls="' + View.id(vm, 'readallq') + '">' + pic(vm.pictures, '🔁') + t('readAll', lang) + '</button></div>' +
        '<div id="' + View.id(vm, 'readallq') + '" class="dm-note" data-ref="readallq" hidden><p>' + t('readAllIdQ', lang) + '</p><div class="dm-actions">' +
        '<button type="button" class="dm-btn" data-act="readall-with">' + t('readAllWith', lang) + '</button><button type="button" class="dm-btn dm-primary" data-act="readall-without">' + t('readAllWithout', lang) + '</button></div></div>';
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
        if (isNameField(f)) h += '<p><button type="button" class="dm-btn dm-small" data-act="spell">' + t('spell', lang) + '</button></p>';
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

    /* Date of birth by voice, one part at a time: the year, then the month, then the day (or only the year, or the
       age). Each part has its own question, Listen button and "I heard…" check; then the whole date is read back. */
    datePanel: function (vm, dv) {
      var lang = vm.lang, hid = View.id(vm, 'dv-h'), parts = DV_PARTS[dv.mode], h = '<div class="dm-panel dm-dv" role="group" aria-labelledby="' + hid + '">';
      function btn(act, text, cls, extra) { return '<button type="button" class="dm-btn' + (cls ? ' ' + cls : '') + '" data-act="' + act + '"' + (extra || '') + '>' + text + '</button>'; }
      var head = function (text) { return '<h2 id="' + hid + '" data-ref="dv-h" tabindex="-1">' + esc(text) + '</h2>'; };
      if (dv.part === 'unknown') {
        return h + head(t('dvDontKnow', lang)) + '<p>' + t('dvUnknown', lang) + '</p><div class="dm-actions">' +
          btn('dv-mode', t('dvKnowYear', lang), 'dm-primary', ' data-mode="year"') + btn('dv-mode', t('dvKnowAge', lang), '', ' data-mode="age"') +
          btn('dv-mode', t('back', lang), '', ' data-mode="full"') + '</div></div>';
      }
      if (dv.part === 'check') {
        h += head(dvReadBackText(dv, lang)) + '<div class="dm-actions">' + btn('dv-use', t('yes', lang), 'dm-primary') + btn('dv-again', t('again', lang)) + btn('heard-type', t('type', lang)) + '</div>';
        if (dv.mode === 'full') h += '<div class="dm-tools">' + parts.map(function (p) { return btn('dv-change', t('dvChange_' + p, lang), 'dm-small', ' data-part="' + p + '"'); }).join('') + '</div>';
        return h + '</div>';
      }
      if (parts.length > 1) h += '<p class="dm-progress">' + t('dvPart', lang, { n: parts.indexOf(dv.part) + 1, m: parts.length }) + '</p>';
      h += head(t(DV_Q[dv.part], lang)) + '<p class="dm-hint">' + esc(dvHint(dv, lang)) + '</p>';
      if (dv.msg) h += '<p class="dm-heard-warn" data-ref="dv-msg"><strong>' + esc(dv.msg) + '</strong></p>';
      if (dv.heard) {
        return h + '<p data-ref="heard-h" tabindex="-1">' + t('heard', lang) + ' <q>' + esc(dv.heard.transcript) + '</q></p><p><strong data-ref="dv-shown">' + esc(dv.heard.shown) + '</strong></p>' +
          (dv.heard.warn ? '<p class="dm-heard-warn"><strong>' + esc(dv.heard.warn) + '</strong></p>' : '') +
          '<div class="dm-actions">' + btn('heard-yes', t('yes', lang), 'dm-primary') + btn('heard-again', t('again', lang)) + btn('heard-type', t('type', lang)) + '</div></div>';
      }
      h += '<div class="dm-actions"><button type="button" class="dm-btn dm-primary" data-act="speak" aria-pressed="false">' + pic(vm.pictures, '🎤') + t('speak', lang) + '</button>' +
        btn('dv-listen', pic(vm.pictures, '🔊') + t('listen', lang)) + btn('heard-type', t('type', lang)) + '</div>';
      if (dv.part === 'year' && dv.mode === 'full') h += '<p><button type="button" class="dm-link" data-act="dv-unknown">' + t('dvDontKnow', lang) + '</button></p>';
      return h + '</div>';
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
    loadAudioManifest(); // early, so the recorded clips (numbers too) are known before the learner presses Listen
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
        if (Player.state !== 'idle') Player.stop();
      });
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
      var msg = t(navigator.onLine === false ? 'offline' : 'online', self.lang);
      if (navigator.onLine === false) { b.hidden = false; b.textContent = msg; }
      else { b.textContent = msg; setTimeout(function () { if (navigator.onLine !== false && b.textContent === t('online', self.lang)) b.hidden = true; }, 6000); }
      // read aloud too when automatic reading is on (offline: a recording or the phone's voice; the online voice is skipped)
      if (readingOn()) Player.play([{ key: navigator.onLine === false ? 'msg-offline' : 'msg-online', text: msg, lang: self.lang }], self.lang, { audioIssue: function () {} });
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
    if (this.dv) { // the date-by-voice panel survives a redraw of the same question (language, calendar), not a new one
      var cf = this.state.mode === 'question' && this.state.field();
      if (cf && cf.id === this.dv.field && this.state.step === this.dv.step) this.dvDraw(false); else this.dv = null;
    }
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
    // (a host page that reads each step itself, like the Savanna pages, sets SavannaOnboarding.hostReads = true)
    if ((m === 'question' || m === 'welcome') && this.easy && this._interacted && !API.hostReads) this.readQuestion();
    // A new screen: tell the host, with its summary, so it can put it first in the page and read it (see summary())
    var key = m + ':' + this.state.step + ':' + this.lang;
    if (key !== this._stepKey) { this._stepKey = key; emit(this, 'step', { form: this.getAttribute('form'), mode: m, step: this.state.step, summary: this.summary() }, true); }
  };

  /* --- page summaries (English only for now; hand-written, never generated): what this screen asks, how to answer,
     and what is below it. Field topics are in forms.js (summary); the sentences around them are here. --- */
  /* Hand-written sentence patterns for the step summaries (Amharic and Afaan Oromo: drafts for native review). The
     topic of each question is in forms.js (English); in Amharic and Oromo the question itself is the topic. */
  var SUMMARY_T = {
    en: { welcome: '{title}. First, choose how you like to fill in the form: read and type, listen, speak my answers, or simple steps with pictures. Below is {next}.',
      step: 'Step {n} of {m}: {topic}.', one: 'Choose one answer.', many: 'Choose all that apply.', date: 'First choose your calendar, then the day, month and year.',
      'date-voice': 'First choose your calendar. Then type the day, month and year, or choose "{voice}" to say them one at a time.',
      say: 'You can type it or say it.', type: 'Type it.', skip: 'You can skip it.', both: 'Below are {next} and {back}.', only: 'Below is {next}.',
      review: '{title}: {n} answers, each with a {change} button. At the bottom is {submit}.', done: '{title}. {text} Below are the next steps.',
      saved: 'Your answers are saved on this phone. Below is the link to continue later.' },
    am: { welcome: '{title}። መጀመሪያ ቅጹን እንዴት መሙላት እንደሚፈልጉ ይምረጡ፦ አንብቤ እጽፋለሁ፣ አዳምጬ እመልሳለሁ፣ በድምፅ እመልሳለሁ፣ ወይም ቀላል ደረጃዎች ከሥዕል ጋር። ከታች «{next}» አለ።',
      step: 'ደረጃ {n} ከ{m}፦ {topic}', one: 'አንድ መልስ ይምረጡ።', many: 'የሚስማሙትን ሁሉ ይምረጡ።', 'date-voice': 'መጀመሪያ አቆጣጠርዎን ይምረጡ። ከዚያ ቀኑን፣ ወሩንና ዓመቱን ይጻፉ፤ ወይም አንድ በአንድ ለመናገር «{voice}» ይምረጡ።', date: 'መጀመሪያ አቆጣጠሩን፣ ከዚያ ቀን፣ ወርና ዓመት ይምረጡ።',
      say: 'መጻፍ ወይም መናገር ይችላሉ።', type: 'ይጻፉት።', skip: 'መዝለል ይችላሉ።', both: 'ከታች «{next}» እና «{back}» አሉ።', only: 'ከታች «{next}» አለ።',
      review: '{title}፦ {n} መልሶች፣ እያንዳንዱ «{change}» አዝራር አለው። ከታች «{submit}» አለ።', done: '{title}። {text} ከታች ቀጣዮቹ እርምጃዎች አሉ።',
      saved: 'መልሶችዎ በዚህ ስልክ ላይ ተቀምጠዋል። በኋላ ለመቀጠል ሊንኩ ከታች አለ።' },
    om: { welcome: '{title}. Jalqaba akkaataa unka kana guutuu barbaaddu filadhu: dubbisuu fi barreessuu, dhaggeeffachuu, sagaleen deebisuu, ykn tarkaanfii salphaa fakkii wajjin. Gadi "{next}" jira.',
      step: 'Tarkaanfii {n} keessaa {m}: {topic}', one: 'Deebii tokko filadhu.', many: 'Kan siif ta\'an hunda filadhu.', 'date-voice': 'Dura dhaha kee filadhu. Sana booda guyyaa, ji\'aa fi waggaa barreessi, ykn tokko tokkoon jechuuf "{voice}" filadhu.', date: 'Dura dhaha, sana booda guyyaa, ji\'aa fi waggaa filadhu.',
      say: 'Barreessuu ykn dubbachuu dandeessa.', type: 'Barreessi.', skip: 'Dabarsuu dandeessa.', both: 'Gadi "{next}" fi "{back}" jiru.', only: 'Gadi "{next}" jira.',
      review: '{title}: deebii {n}, tokkoon tokkoon isaa qabduu "{change}" qaba. Gadi "{submit}" jira.', done: '{title}. {text} Gadi tarkaanfiiwwan itti aanan jiru.',
      saved: 'Deebiin kee bilbila kana irratti kuufameera. Booda itti fufuuf geessituun gadi jira.' }
  };
  function fill(str, vars) { Object.keys(vars).forEach(function (k) { str = str.split('{' + k + '}').join(vars[k]); }); return str; }
  /* --- page summaries (hand-written, never generated): what this screen asks, how to answer, and what is below it.
     English, with Amharic and Afaan Oromo drafts. --- */
  /** The summary as pieces to read, each with its recorded clip (sum-…): in Amharic and Afaan Oromo the question
   *  itself follows, so the step piece is "Step 3 of 5" without the topic; in English it includes the topic. */
  SavannaOnboardingForm.prototype.summaryItems = function () {
    var lang = SUMMARY_T[this.lang] ? this.lang : 'en', T = SUMMARY_T[lang], s = this.state, vm = this.vm(), cfg = this.cfg, m = s.mode, form = this.getAttribute('form');
    var names = { next: t('next', lang), back: t('back', lang), change: t('change', lang) }, it = function (key, text) { return { key: key, text: text, lang: lang }; };
    if (m === 'welcome') return [it('sum-welcome-' + form, fill(T.welcome, { title: L(cfg.title, lang), next: names.next }))];
    if (m === 'question') {
      var f = s.field(), p = s.progress(), back = s.step > 0 || !!vm.backUrl || this.welcomeOn;
      var canSay = voiceAllowed(f, vm) && speech.input.supported(lang);
      var how = f.type === 'choice' || f.type === 'consent' ? 'one' : f.type === 'multi' ? 'many' : f.type === 'ethdate' ? (canSay ? 'date-voice' : 'date') : canSay ? 'say' : 'type';
      var step = lang === 'en' ? fill(T.step, { n: p.n, m: p.total, topic: L(f.summary, 'en') || L(f.label, 'en') }) : fill(T.step, { n: p.n, m: p.total, topic: '' }).trim();
      var items = [it('sum-step-' + p.n + '-' + p.total, step), it('sum-' + how, fill(T[how], { voice: t('dvOpen', lang) }))];
      if (f.optional) items.push(it('sum-skip', T.skip));
      items.push(it(back ? 'sum-both' : 'sum-only', fill(back ? T.both : T.only, names)));
      return items;
    }
    if (m === 'review') {
      var n = s.visible().filter(function (x) { return !x.reviewHide; }).length;
      return [it('sum-review-' + form + '-' + n, fill(T.review, { title: L(cfg.reviewTitle, lang) || t('review', lang), n: n, change: names.change, submit: L(cfg.submitLabel, lang) || t('submit', lang) }))];
    }
    if (m === 'done') return [it('sum-done-' + form, fill(T.done, { title: L(cfg.doneTitle, lang), text: L(cfg.doneText, lang) }))];
    if (m === 'saved') return [it('sum-saved', T.saved)];
    return [];
  };
  SavannaOnboardingForm.prototype.summary = function () {
    var lang = SUMMARY_T[this.lang] ? this.lang : 'en', T = SUMMARY_T[lang], s = this.state, vm = this.vm(), cfg = this.cfg, m = s.mode;
    var names = { next: t('next', lang), back: t('back', lang), change: t('change', lang) };
    if (m === 'welcome') return fill(T.welcome, { title: L(cfg.title, lang), next: names.next });
    if (m === 'question') {
      var f = s.field(), p = s.progress(), back = s.step > 0 || !!vm.backUrl || this.welcomeOn;
      var topic = lang === 'en' ? (L(f.summary, 'en') || L(f.label, 'en')) : L(f.label, lang);
      var canSay = voiceAllowed(f, vm) && speech.input.supported(lang);
      var how = f.type === 'choice' || f.type === 'consent' ? T.one : f.type === 'multi' ? T.many : f.type === 'ethdate' ? (canSay ? fill(T['date-voice'], { voice: t('dvOpen', lang) }) : T.date)
        : canSay ? T.say : T.type;
      return [fill(T.step, { n: p.n, m: p.total, topic: topic }), how, f.optional ? T.skip : '', fill(back ? T.both : T.only, names)].filter(Boolean).join(' ');
    }
    if (m === 'review') {
      var n = s.visible().filter(function (x) { return !x.reviewHide; }).length;
      return fill(T.review, { title: L(cfg.reviewTitle, lang) || t('review', lang), n: n, change: names.change, submit: L(cfg.submitLabel, lang) || t('submit', lang) });
    }
    if (m === 'done') return fill(T.done, { title: L(cfg.doneTitle, lang), text: L(cfg.doneText, lang) });
    if (m === 'saved') return T.saved;
    return '';
  };

  /* --- reading the current value out of the page into the state --- */
  SavannaOnboardingForm.prototype.readField = function (f) {
    var form = this.querySelector('.dm-form');
    if (!form) return undefined;
    if (f.type === 'multi') return Array.prototype.map.call(form.querySelectorAll('input[name=v]:checked'), function (i) { return i.value; });
    if (f.type === 'choice' || f.type === 'consent') { var c = form.querySelector('input[name=v]:checked'); return c ? c.value : ''; }
    if (f.type === 'ethdate') {
      if (!form.d) return this.state.answers[f.id]; // an approximate answer: no fields on screen
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
    if (this.dv && this.dv.part === 'check') { this.status(t('voiceCheckFirst', this.lang)); var dh = this.ref('dv-h'); if (dh) dh.focus(); return; }
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
    if (this.state.mode === 'welcome' && e.target.name === 'mode') { this.sayChoice(null, e.target); return; }
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
    if ((f.type === 'choice' || f.type === 'multi' || f.type === 'consent') && e.target.name === 'v') this.sayChoice(f, e.target);
  };
  /* Speak what the learner chooses, when reading is on: "Selected: …" (or "Not selected: …" for a box unticked),
     with the option's own clip. */
  SavannaOnboardingForm.prototype.sayChoice = function (f, input) {
    if (!readingOn()) return;
    var lang = this.lang, form = this.getAttribute('form'), o = f ? optionsOf(f).filter(function (x) { return String(x.value) === input.value; })[0] : null;
    var label = o ? L(o.label, lang) : (input.closest('label') ? input.closest('label').textContent.trim() : input.value);
    var key = f && o ? clipKey(form, f.id, 'option', o.value) : clipKey('welcome', 'option', input.value);
    if (input.type === 'radio' && !input.checked) return;
    Player.play([{ key: input.checked ? 'msg-selected' : 'msg-not-selected', text: t(input.checked ? 'selected' : 'notSelected', lang), lang: lang }, { key: key, text: label, lang: lang }], lang, { audioIssue: function () {} });
  };

  SavannaOnboardingForm.prototype.onClick = function (e) {
    var b = e.target.closest('[data-act]');
    if (!b || !this.contains(b)) return;
    this._interacted = true;
    var act = b.getAttribute('data-act'), s = this.state;
    if (this.dv && /^(heard-yes|heard-again|heard-type|dv-)/.test(act)) { this.dvAct(act, b); return; }
    if (act === 'date-voice') { this.startVoice(); return; }
    if (act === 'dv-exact') { this.state.setAnswer(s.field().id, ''); this.render(false); var di = this.ref('input'); if (di) di.focus(); return; }
    if (act === 'focus-input') { e.preventDefault(); var i = this.ref('input'); if (i) i.focus(); return; }
    if (act === 'back') {
      Player.stop(); this.error = '';
      if (!s.returnToReview) this.collect(); // Back from a "Change" discards the unsaved edit, as before
      s.back(this.welcomeOn);
      this.save(); this.render(true); return;
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
    if (act === 'listen-help') { Player.play([{ key: 'help', text: t('helpTitle', this.lang) + ' ' + (L(this.cfg.help, this.lang) || t('helpText', this.lang)), lang: this.lang }], this.lang, this); return; }
    if (act === 'readback') { this.readBack(); return; }
    if (act === 'spell') { var hv = this.voice, he = this.ref('heard-edit'); var sv = he ? he.value : (hv && hv.value) || ''; Player.play([{ key: null, text: spelled(sv), lang: scriptLang(sv, this.lang) }], this.lang, this); return; }
    if (act === 'readback-id' || act === 'readback-id-cancel') {
      var nt = this.ref('idnote'), ib = this.querySelector('[data-act=readback-id]'), show = act === 'readback-id' && nt.hidden;
      nt.hidden = !show; ib.setAttribute('aria-expanded', String(show));
      if (show) { var go = nt.querySelector('[data-act=readback-id-go]'); if (go) go.focus(); } else ib.focus();
      return;
    }
    if (act === 'readback-id-go') {
      var iv = this.ref('input') ? this.ref('input').value.trim() : '';
      Player.play(iv ? [{ key: 'msg-your-answer', text: t('yourAnswer', this.lang), lang: this.lang, local: true }].concat(localDigitItems(iv, this.lang)) : [{ key: 'msg-nothing-typed', text: t('nothingTyped', this.lang), lang: this.lang }], this.lang, this);
      return;
    }
    if (act === 'readall') {
      var hasId = this.state.visible().some(function (x) { return x.sensitive && x.type === 'text' && !isEmpty(s.answers[x.id]); });
      if (hasId) { var q = this.ref('readallq'); q.hidden = !q.hidden; b.setAttribute('aria-expanded', String(!q.hidden)); if (!q.hidden) q.querySelector('[data-act=readall-without]').focus(); return; }
      this.readAll(false); return;
    }
    if (act === 'readall-with' || act === 'readall-without') { this.readAll(act === 'readall-with'); return; }
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
      if (f.type === 'ethdate') { // the calendar choice at the top of the date question
        items.push({ key: clipKey(form, f.id, 'calendar'), text: t('calendar', lang) });
        items.push({ key: clipKey(form, f.id, 'option', 'eth'), text: t('calEth', lang) }, { key: clipKey(form, f.id, 'option', 'greg'), text: t('calGreg', lang) });
      }
    } else if (s.mode === 'welcome') {
      items.push({ key: 'welcome-question', text: t('welcomeTitle', lang) + ' ' + t('welcomeHint', lang) });
      MODES.forEach(function (m) { items.push({ key: clipKey('welcome', 'option', m), text: t('m_' + m, lang) }); });
    } else if (s.mode === 'review') {
      items.push({ key: clipKey(form, 'check-answers'), text: (L(cfg.reviewTitle, lang) || t('review', lang)) + '. ' + (L(cfg.reviewHint, lang) || t('reviewHint', lang)) });
      if (cfg.reviewNote) items.push({ key: clipKey(form, 'check-answers-note'), text: L(cfg.reviewNote, lang) });
    } else if (s.mode === 'done') {
      items.push({ key: clipKey(form, 'done'), text: L(cfg.doneTitle, lang) + ' ' + L(cfg.doneText, lang) });
      var slot = this.querySelector('.dm-done-slot'); if (slot) items = items.concat(itemsFromElement(slot, lang)); // the host's confirmation
    } else if (s.mode === 'saved') {
      items.push({ key: 'saved-for-later', text: t('savedTitle', lang) + '. ' + t('savedText', lang) });
    }
    return items;
  };
  /** "Read back my answer" (names and phone numbers): what is typed now, with the same rules as voice answers. */
  SavannaOnboardingForm.prototype.readBack = function () {
    var f = this.state.field(), inp = this.ref('input'), v = inp ? inp.value.trim() : '';
    Player.play(v ? readBackItems(f, v, this.lang, 'yourAnswer') : [{ key: 'msg-nothing-typed', text: t('nothingTyped', this.lang), lang: this.lang }], this.lang, this);
  };
  /** "Read all my answers" on Check your answers: each question and answer; the ID number only if confirmed. */
  SavannaOnboardingForm.prototype.readAll = function (withId) {
    var lang = this.lang, s = this.state, vm = this.vm(), items = [];
    s.visible().forEach(function (f) {
      if (f.reviewHide) return;
      var v = s.answers[f.id], label = L(f.reviewLabel || f.label, lang);
      if (f.sensitive && f.type === 'text') {
        if (!withId || isEmpty(v)) return;
        items.push({ key: null, text: label, lang: lang, local: true });
        items = items.concat(localDigitItems(v, lang));
        return;
      }
      items.push({ key: null, text: label, lang: lang });
      if (isEmpty(v)) items.push({ key: null, text: t('notGiven', lang), lang: lang });
      else if (f.type === 'tel') items = items.concat(phoneItems(v, lang));
      else if (f.type === 'text' || f.type === 'textarea') items.push({ key: null, text: String(v), lang: scriptLang(String(v), lang) });
      else items.push({ key: null, text: View.display(vm, f, v), lang: lang });
    });
    var q = this.ref('readallq'); if (q) { q.hidden = true; var rb = this.querySelector('[data-act=readall]'); if (rb) rb.setAttribute('aria-expanded', 'false'); }
    Player.play(items, lang, this);
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
  SavannaOnboardingForm.prototype.updatePlayer = function () {}; // the playback bar (PlayBar) follows the player itself
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
    this.voice = null;
    if (this.dv) this.dvDraw(false); else this.setHeard('');
    this.setVoiceButton(false);
  };
  SavannaOnboardingForm.prototype.startVoice = function () {
    var lang = this.lang, self = this, f = this.state.field();
    if (!voiceAllowed(f)) return; // never on sensitive questions
    if (!speech.input.supported(lang)) { this.status(t('voiceUnsupported', lang)); return; }
    if (navigator.onLine === false && (speech.input === browserInput || speech.input === autoInput)) { this.status(t('voiceNetwork', lang)); return; }
    if (store.get('voiceConsent', null) !== true) {
      this.voice = { state: 'consent', field: f }; this.dv = null;
      this.setHeard(View.voiceConsent(this.vm()));
      var h = this.ref('vc'); if (h) h.focus();
      var vt = t('voiceConsentTitle', lang) + '. ' + t('voiceConsent', lang);
      this.status(vt + ' ' + t('voiceAllow', lang) + ' / ' + t('voiceDeny', lang)); // announced in the live region too
      if (readingOn()) Player.play([{ key: 'voice-consent', text: vt, lang: lang }, { key: 'voice-allow', text: t('voiceAllow', lang), lang: lang },
        { key: 'voice-deny', text: t('voiceDeny', lang), lang: lang }], lang, this);
      return;
    }
    if (f.type === 'ethdate' && (!this.dv || this.dv.step !== this.state.step)) { this.voice = null; this.dvOpen(); return; }
    if (this.voice && this.voice.state === 'listening') { // second press: stop listening and use what was heard
      this.voice.state = 'processing'; this.voice.session.stop(); this.setVoiceButton(false); this.status(t('processing', lang)); return;
    }
    this.voiceReset();
    Player.stop();
    var v = this.voice = { state: 'listening', field: f };
    this.setVoiceButton(true);
    // Recording feedback: announced in the live region, a short beep, and focus on the Stop button
    this.status(t('recStart', lang, { stop: t('stop', lang) }));
    beep();
    var sb = this.querySelector('[data-act=speak]'); if (sb) sb.focus();
    var handlers = {
      result: function (alts) { if (self.voice === v) self.handleTranscript(f, alts); },
      error: function (code) {
        if (self.voice !== v || code === 'aborted') return;
        v.state = 'error'; self.setVoiceButton(false);
        self.status(t({ 'not-allowed': 'voiceDenied', network: 'voiceNetwork', 'no-speech': 'voiceNoSpeech', 'audio-capture': 'voiceNoMic', 'language-not-supported': 'voiceLangUnsupported', 'remote-failed': 'voiceRemoteFailed', 'remote-no-credit': 'voiceNoCredit' }[code] || 'voiceError', lang));
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
    if (f.type === 'ethdate' && this.dv) return this.dvHeard(alts);
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
    var choice = f.type === 'choice' || f.type === 'consent' || f.type === 'multi';
    this.status(t('heardSay', lang, { text: v.shown, yes: t('yes', lang), again: t('again', lang), type: t(choice ? 'tapInstead' : 'type', lang) }));
    var ed = this.ref('heard-edit') || this.ref('heard-h'); if (ed) ed.focus();
    // read back what was heard, so it can be checked by ear, then the three choices
    var back = v.hits || v.date ? [{ key: null, text: t('heard', lang) + ' ' + v.shown, lang: lang }] : readBackItems(f, v.value, lang, 'heard');
    back.push({ key: 'msg-heard-choose-' + (choice ? 'tap' : 'type'), text: t('heardChoose', lang, { yes: t('yes', lang), again: t('again', lang), type: t(choice ? 'tapInstead' : 'type', lang) }), lang: lang });
    // if nothing can read it, stay quiet: "I heard: … Choose …" is already announced and on the screen
    Player.play(back, lang, { audioIssue: function () {} });
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

  /* --- date of birth by voice: the year, then the month, then the day, each asked, heard and checked on its own.
     A whole date said in one sentence fills all three and goes straight to the read-back. Typing and the lists stay.
     Like every voice answer, nothing heard reaches the answer before the learner chooses "Use this answer". --- */
  SavannaOnboardingForm.prototype.dvOpen = function (mode) {
    var f = this.state.field(), cur = this.readField(f) || {}, num = function (x) { var n = parseInt(x, 10); return isNaN(n) ? null : n; };
    var dv = this.dv = { field: f.id, step: this.state.step, mode: mode || 'full', cal: cur.cal === 'greg' ? 'greg' : 'eth', y: null, m: null, d: null, age: null, heard: null, msg: '', say: null };
    if (dv.mode === 'full' && !cur.precision) { // what is already typed counts, as long as it can be right
      dv.y = num(cur.y); dv.m = num(cur.m); dv.d = num(cur.d);
      var bad; while ((bad = dateProblem(dv, this.lang))) dv[DV_KEY[bad.part]] = null;
    }
    this.dvNext();
  };
  /** Go to the first part still missing (or the read-back), with a message about a part that was wrong. */
  SavannaOnboardingForm.prototype.dvNext = function (problem) {
    var dv = this.dv, next = DV_PARTS[dv.mode].filter(function (p) { return dv[DV_KEY[p]] == null; })[0];
    dv.part = next || 'check'; dv.heard = null;
    dv.msg = problem ? problem.msg : ''; dv.say = problem ? problem.say : null;
    this.dvDraw(true);
    this.dvSpeak();
  };
  SavannaOnboardingForm.prototype.dvDraw = function (focus) {
    this.setHeard(View.datePanel(this.vm(), this.dv));
    if (focus) { var h = this.ref('dv-h'); if (h) h.focus(); }
  };
  /** Read the part's question (after the message, if there is one), or the read-back. onlyMsg: just the message. */
  SavannaOnboardingForm.prototype.dvSpeak = function (onlyMsg) {
    var dv = this.dv, lang = this.lang, items = [];
    if (dv.say) items.push(dv.say);
    if (!onlyMsg) {
      if (dv.part === 'check') items = items.concat(dvReadBackItems(dv, lang));
      else if (dv.part === 'unknown') items.push({ key: 'dv-unknown', text: t('dvUnknown', lang), lang: lang });
      else items.push({ key: dvPromptKey(dv), text: t(DV_Q[dv.part], lang) + ' ' + dvHint(dv, lang), lang: lang });
    }
    Player.play(items, lang, { audioIssue: function () {} });
  };
  /** The confirmed parts go into the day, month and year fields (and the calendar choice), as if typed. */
  SavannaOnboardingForm.prototype.dvSync = function () {
    var dv = this.dv, form = this.querySelector('.dm-form'), f = this.state.field(), lang = this.lang;
    if (!form || dv.mode !== 'full' || !form.d) return;
    var r = form.querySelector('input[name=cal][value="' + dv.cal + '"]');
    if (r && !r.checked) {
      r.checked = true;
      form.m.innerHTML = '<option value="">' + esc(t('chooseMonth', lang)) + '</option>' + monthsFor(dv.cal, lang).map(function (n, i) { return '<option value="' + (i + 1) + '">' + esc(n) + '</option>'; }).join('');
    }
    form.y.value = dv.y == null ? '' : dv.y; form.m.value = dv.m == null ? '' : dv.m; form.d.value = dv.d == null ? '' : dv.d;
    var nv = this.readField(f); this.state.setAnswer(f.id, nv);
    var conv = this.ref('date-conv');
    if (conv) conv.textContent = nv && nv.gregorian ? (nv.cal === 'greg' ? t('ethiopian', lang, { date: fmtEthiopian(nv.gregorian, lang) }) : t('gregorian', lang, { date: fmtGregorian(new Date(nv.gregorian), lang) })) : '';
  };
  /** What the microphone heard, for the part being asked (or the whole date in one sentence). */
  SavannaOnboardingForm.prototype.dvHeard = function (alts) {
    var dv = this.dv, lang = this.lang, v = this.voice, said = (alts[0] || '').trim(), found = null, i, vals = {}, cal = dv.cal, warn = '';
    this.setVoiceButton(false);
    if (dv.mode === 'full' && dv.part !== 'unknown') for (i = 0; i < alts.length && !found; i++) { var p = parseDateParts(alts[i], dv.cal); if (partCount(p) >= 2) found = p; }
    if (found) {
      var merged = { cal: found.cal, y: found.y != null ? found.y : dv.y, m: found.m != null ? found.m : dv.m, d: found.d != null ? found.d : dv.d };
      var bad = dateProblem(merged, lang);
      if (!bad && partCount(found) === 3) { // the whole date: straight to the read-back, which is the check
        this.voice = null; dv.cal = found.cal; dv.y = found.y; dv.m = found.m; dv.d = found.d; dv.fromSentence = true;
        this.dvNext(); return;
      }
      ['y', 'm', 'd'].forEach(function (k) { if (found[k] != null && !(bad && DV_KEY[bad.part] === k)) vals[k] = found[k]; });
      cal = found.cal; warn = bad ? bad.msg : '';
    } else {
      var val = null;
      for (i = 0; i < alts.length && val == null; i++) {
        if (dv.part === 'month') { var mm = matchMonth(alts[i], dv.cal) || monthByNumber(alts[i], dv.cal); if (mm) { val = mm.m; cal = mm.cal; } }
        else { var n = parseSpokenNumber(alts[i], lang); if (n != null) val = dv.part === 'year' ? inferYear(n, dv.cal) : n; }
      }
      var problem = null;
      if (val == null || (dv.part === 'age' && (val < AGE_MIN || val > AGE_MAX))) problem = { msg: t(DV_NO[dv.part], lang), say: { key: 'dv-no-' + dv.part, text: t(DV_NO[dv.part], lang), lang: lang }, only: true };
      else if (dv.part !== 'age') {
        var test = { cal: cal, y: dv.y, m: dv.m, d: dv.d }; test[DV_KEY[dv.part]] = val;
        var b2 = dateProblem(test, lang);
        if (b2 && b2.part === dv.part) problem = b2; // re-ask this part only
      }
      if (problem) {
        v.state = 'error'; this.voice = null; dv.heard = null; dv.msg = problem.msg; dv.say = problem.say;
        this.dvDraw(false); this.status(problem.msg); this.dvSpeak(problem.only);
        return;
      }
      vals[DV_KEY[dv.part]] = val;
    }
    if (!Object.keys(vals).length) { // two parts heard, but neither can be right
      v.state = 'error'; this.voice = null; dv.msg = warn; dv.say = null; this.dvDraw(false); this.status(warn); return;
    }
    v.state = 'review'; dv.msg = ''; dv.say = null;
    dv.heard = { transcript: said, vals: vals, cal: cal, shown: dvShown(vals, cal, lang), warn: warn, problem: warn ? bad : null };
    this.dvDraw(false);
    var hh = this.ref('heard-h'); if (hh) hh.focus();
    this.status(t('heard', lang) + ' ' + dv.heard.shown + '. ' + t('heardChoose', lang, { yes: t('yes', lang), again: t('again', lang), type: t('type', lang) }));
    Player.play([{ key: 'msg-heard', text: t('heard', lang), lang: lang, local: true }].concat(dvValuePieces(vals, cal, lang))
      .concat([{ key: 'msg-heard-choose-type', text: t('heardChoose', lang, { yes: t('yes', lang), again: t('again', lang), type: t('type', lang) }), lang: lang }]), lang, { audioIssue: function () {} });
  };
  SavannaOnboardingForm.prototype.dvAct = function (act, b) {
    var dv = this.dv, lang = this.lang, self = this;
    if (act === 'heard-yes') { // "Use this answer" for a part: into the fields, then the next part
      var h = dv.heard; if (!h) return;
      this.voice = null; dv.cal = h.cal;
      Object.keys(h.vals).forEach(function (k) { dv[k] = h.vals[k]; });
      var bad = dateProblem(dv, lang); if (bad) dv[DV_KEY[bad.part]] = null; // e.g. a new month without the old day
      bad = bad || h.problem; // a part heard in the same sentence that could not be right: asked next, with the reason
      this.dvSync(); this.dvNext(bad);
      return;
    }
    if (act === 'heard-again') { dv.heard = null; dv.msg = ''; dv.say = null; this.voice = null; this.startVoice(); return; }
    if (act === 'heard-type') { // close the voice steps; the parts already used stay in the fields
      this.dv = null; this.voiceReset(); Player.stop(); this.status(t('voiceDiscarded', lang));
      var form = this.querySelector('.dm-form'), first = form && ['d', 'm', 'y'].map(function (n) { return form[n]; }).filter(function (x) { return x && !x.value; })[0];
      var target = first || this.ref('input'); if (target) target.focus();
      return;
    }
    if (act === 'dv-use') { // the read-back was right: this is the answer (saved on Continue, like typing)
      var f = this.state.field(), val;
      if (dv.mode === 'full') { val = dateValue(dv.cal, dv.d, dv.m, dv.y); if (!val) return; this.dvSync(); }
      else if (dv.mode === 'year') val = { cal: dv.cal, precision: 'year', y: dv.y };
      else val = { cal: dv.cal, precision: 'age', age: dv.age, asOf: new Date().toISOString().slice(0, 10) };
      this.dv = null; this.voice = null; Player.stop();
      this.state.setAnswer(f.id, val);
      if (dv.mode === 'full') this.setHeard(''); else this.render(false); // an approximate answer replaces the fields
      this.status(t('voiceUsed', lang));
      var sb = this.querySelector('.dm-form button[type=submit]'); if (sb) sb.focus();
      return;
    }
    if (act === 'dv-again') { dv.y = dv.m = dv.d = dv.age = null; this.dvNext(); return; }
    if (act === 'dv-change') { var part = b.getAttribute('data-part'); dv[DV_KEY[part]] = null; if (part !== 'day') { var bd = dateProblem(dv, lang); if (bd) dv[DV_KEY[bd.part]] = null; } this.dvNext(); return; }
    if (act === 'dv-listen') { this.dvSpeak(); return; }
    if (act === 'dv-unknown') { dv.part = 'unknown'; dv.heard = null; dv.msg = ''; dv.say = null; this.dvDraw(true); this.dvSpeak(); return; }
    if (act === 'dv-mode') { dv.mode = b.getAttribute('data-mode'); dv.y = dv.m = dv.d = dv.age = null; self.dvNext(); return; }
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
        else if (n === 'easy') { patch.easy = v === 'on'; patch.autoRead = v === 'on' ? 'on' : 'off'; } // one switch for all reading
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
        group('easy', t('s_read', lang), [['on', t('on', lang)], ['off', t('off', lang)]], readingOn(p) ? 'on' : 'off', t('s_readHint', lang)) +
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
    if (o.speechProxy) setSpeechProxy(o.speechProxy); // the host's own proxy for Amharic and Afaan Oromo speech
    if (typeof o.onComplete === 'function') {
      el.addEventListener('savanna-onboarding:complete', function (e) { o.onComplete(e.detail, el.querySelector('.dm-done-slot')); });
    }
    host.appendChild(el);
    if (o.focus !== false) { var q = el.querySelector('.dm-q'); if (q) q.focus(); }
    var handle = { element: el, host: host, unmount: function () { unmount(handle); } };
    MOUNTS.push(handle);
    return handle;
  }

  /** A readable summary of finished answers, as on "Check your answers": [{ id, label, value }] for each question that
   *  was shown and answered. Hosts use it for plain confirmations ("Your application was sent to …"). */
  function describe(formId, answers, lang) {
    var cfg = FORMS[formId], vm = { lang: lang || getPrefs().lang || 'en' }; answers = answers || {};
    if (!cfg) return [];
    return cfg.fields.filter(function (f) { return !f.reviewHide && evalShowIf(f.showIf, answers) && !isEmpty(answers[f.id]); })
      .map(function (f) { return { id: f.id, label: L(f.reviewLabel || f.label, vm.lang), value: View.display(vm, f, answers[f.id]) }; });
  }

  /** Every fixed text the module reads aloud, in one language, with the name of its recorded clip. The clip
   *  generator (tools/audio-script.cjs) writes these exact words, so a clip always matches the screen. Dynamic text
   *  (names, typed answers, a list built from the learner's own Support Passport) is not in it. */
  function speechCatalog(lang) {
    var out = [], seen = {}, T = SUMMARY_T[lang] || SUMMARY_T.en, names = { next: t('next', lang), back: t('back', lang), change: t('change', lang) };
    function add(section, key, text) { if (!text || seen[key] || typeof text !== 'string') return; seen[key] = 1; out.push({ section: section, key: key, text: text }); }
    var fixed = function (v) { return typeof v === 'function' ? null : L(v, lang); };
    add('Start', 'welcome-question', t('welcomeTitle', lang) + ' ' + t('welcomeHint', lang));
    MODES.forEach(function (m) { add('Start', clipKey('welcome', 'option', m), t('m_' + m, lang)); });
    Object.keys(FORMS).forEach(function (id) {
      var cfg = FORMS[id], sec = 'Form: ' + id;
      cfg.fields.forEach(function (f) {
        if (typeof f.label !== 'function' && typeof f.body !== 'function' && typeof f.hint !== 'function')
          add(sec, clipKey(id, f.id, 'question'), [fixed(f.label), fixed(f.body), fixed(f.hint)].filter(Boolean).join(' '));
        optionsOf(f).forEach(function (o) { add(sec, clipKey(id, f.id, 'option', o.value), L(o.label, lang)); });
        if (f.type === 'ethdate') { add(sec, clipKey(id, f.id, 'calendar'), t('calendar', lang)); add(sec, clipKey(id, f.id, 'option', 'eth'), t('calEth', lang)); add(sec, clipKey(id, f.id, 'option', 'greg'), t('calGreg', lang)); }
      });
      add(sec, clipKey(id, 'check-answers'), (L(cfg.reviewTitle, lang) || t('review', lang)) + '. ' + (L(cfg.reviewHint, lang) || t('reviewHint', lang)));
      if (cfg.reviewNote) add(sec, clipKey(id, 'check-answers-note'), L(cfg.reviewNote, lang));
      add(sec, clipKey(id, 'done'), L(cfg.doneTitle, lang) + ' ' + L(cfg.doneText, lang));
      // summaries
      add('Summaries', 'sum-welcome-' + id, fill(T.welcome, { title: L(cfg.title, lang), next: names.next }));
      var most = cfg.fields.filter(function (f) { return !f.reviewHide; }).length; // never more answers than questions
      for (var n = 1; n <= most; n++) add('Summaries', 'sum-review-' + id + '-' + n, fill(T.review, { title: L(cfg.reviewTitle, lang) || t('review', lang), n: n, change: names.change, submit: L(cfg.submitLabel, lang) || t('submit', lang) }));
      add('Summaries', 'sum-done-' + id, fill(T.done, { title: L(cfg.doneTitle, lang), text: L(cfg.doneText, lang) }));
    });
    var longest = Math.max.apply(null, Object.keys(FORMS).map(function (id) { return FORMS[id].fields.length; }));
    if (lang !== 'en') for (var mm = 1; mm <= longest; mm++) for (var nn = 1; nn <= mm; nn++) add('Summaries', 'sum-step-' + nn + '-' + mm, fill(T.step, { n: nn, m: mm, topic: '' }).trim());
    ['one', 'many', 'date', 'say', 'type', 'skip', 'saved'].forEach(function (k) { add('Summaries', 'sum-' + k, T[k]); });
    add('Summaries', 'sum-date-voice', fill(T['date-voice'], { voice: t('dvOpen', lang) }));
    add('Summaries', 'sum-both', fill(T.both, names)); add('Summaries', 'sum-only', fill(T.only, names));
    // messages read aloud
    add('Messages', 'help', t('helpTitle', lang) + ' ' + t('helpText', lang));
    add('Messages', 'msg-heard', t('heard', lang)); add('Messages', 'msg-your-answer', t('yourAnswer', lang)); add('Messages', 'msg-nothing-typed', t('nothingTyped', lang));
    add('Messages', 'msg-heard-choose-type', t('heardChoose', lang, { yes: t('yes', lang), again: t('again', lang), type: t('type', lang) }));
    add('Messages', 'msg-heard-choose-tap', t('heardChoose', lang, { yes: t('yes', lang), again: t('again', lang), type: t('tapInstead', lang) }));
    add('Messages', 'msg-selected', t('selected', lang)); add('Messages', 'msg-not-selected', t('notSelected', lang));
    add('Messages', 'msg-offline', t('offline', lang)); add('Messages', 'msg-online', t('online', lang));
    Object.keys(ERROR_CLIPS).forEach(function (k) { add('Messages', ERROR_CLIPS[k], t(k, lang)); });
    add('Messages', 'saved-for-later', t('savedTitle', lang) + '. ' + t('savedText', lang));
    add('Messages', 'resumed', t('resumed', lang)); add('Messages', 'prefilled', t('prefilled', lang));
    add('Messages', 'voice-consent', t('voiceConsentTitle', lang) + '. ' + t('voiceConsent', lang));
    add('Messages', 'voice-allow', t('voiceAllow', lang)); add('Messages', 'voice-deny', t('voiceDeny', lang));
    add('Messages', 'voice-check', t('heardCheck', lang)); add('Messages', 'voice-used', t('voiceUsed', lang));
    for (var x = 0; x < 100; x++) add('Numbers 0-99 (read on the phone only)', 'num-' + x, numberWords(x, lang));
    // date of birth by voice: each part's question, the messages, the read-back sentences, month names and year words
    var D = 'Date of birth by voice (read on the phone only)', S = SCALE_WORDS[lang] || SCALE_WORDS.en;
    add(D, 'dv-year', t('dvYearQ', lang) + ' ' + t('dvYearHint', lang)); add(D, 'dv-year-only', t('dvYearQ', lang) + ' ' + t('dvYearOnlyHint', lang));
    add(D, 'dv-month', t('dvMonthQ', lang) + ' ' + t('dvMonthHint', lang));
    DV_DAY_COUNTS.forEach(function (n) { add(D, 'dv-day-' + n, t('dvDayQ', lang) + ' ' + t('dvDayHint', lang, { n: n })); });
    add(D, 'dv-age', t('dvAgeQ', lang) + ' ' + t('dvAgeHint', lang)); add(D, 'dv-unknown', t('dvUnknown', lang));
    ['year', 'month', 'day', 'age'].forEach(function (p) { add(D, 'dv-no-' + p, t(DV_NO[p], lang)); });
    add(D, 'dv-bad-year', t('dvBadYearSay', lang)); add(D, 'dv-bad-day', t('dvBadDaySay', lang));
    [['dv-readback', 'dvReadBack'], ['dv-about', 'dvReadBackYear'], ['dv-age-said', 'dvReadBackAge']].forEach(function (r) {
      templatePieces(r[0], t(r[1], lang), {}, lang).forEach(function (p) { add(D, p.key, p.text); });
    });
    ETH_MONTHS.en.forEach(function (x, i) { add(D, 'month-eth-' + (i + 1), monthsFor('eth', lang)[i]); });
    GREG_MONTHS.en.forEach(function (x, i) { add(D, 'month-greg-' + (i + 1), monthsFor('greg', lang)[i]); });
    add(D, 'num-100', S.h); add(D, 'num-1000', S.k); if (lang === 'om') add(D, 'num-and', S.and);
    return out;
  }

  var API = window.SavannaOnboarding = {
    mount: mount, unmount: unmount,
    version: '0.12.0', register: register, forms: FORMS, NEEDS: NEEDS, store: store, setStorage: setStorage, setSpeech: setSpeech,
    FormState: FormState, validate: validateAnswer, TRUST: TRUST, trustLevel: trustLevel, supportForEmployer: supportForEmployer,
    eth: { toGregorian: ethToGregorian, valid: ethValid, months: ETH_MONTHS, daysInMonth: ethDaysInMonth, fromGregorian: gregToEth, gregorianMonths: GREG_MONTHS, parseSpoken: parseSpokenDate, parseParts: parseDateParts, matchMonth: matchMonth, inferYear: inferYear },
    parseSpokenNumber: parseSpokenNumber,
    describe: describe, speak: speak, stopSpeaking: function () { Player.stop(); stopSpeaking(); }, label: L,
    player: Player, offlineAudio: OfflineAudio, _matchOptions: matchOptions, audioManifest: function () { return loadAudioManifest().then(function () { return AUDIO.manifest; }); },
    prefs: getPrefs, setPrefs: setPrefs, readingOn: readingOn, speechCatalog: speechCatalog,
    /** Pieces to read an element's content (headings, paragraphs, lists), each in its own language: for Player.play. */
    itemsFromElement: itemsFromElement,
    /** The host's speech proxy (for example '/api'): Amharic and Afaan Oromo speech through it; null turns it off. */
    setSpeechProxy: setSpeechProxy, speechProxy: function () { return { url: REMOTE.url, down: remoteIsDown(), languages: REMOTE.langs.slice() }; }, languages: LANGS, languageNames: LANG_NAMES, prefsForMode: prefsForMode,
    /** Adds the module's styles and fonts to the page (done automatically when a form or settings element appears). */
    styles: function () { injectCss(); applyPrefs(); }
  };
  window.Dimts = API; // deprecated alias
  emit(document, 'ready', null);
})();
