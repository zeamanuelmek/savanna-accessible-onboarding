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
    '#/identity': 'profile.html?add=id', '#/passport': 'passport.html', '#/jobs': 'jobs.html', '#/employer': 'employer.html', '#/settings': 'settings.html' };
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
      foot: 'Demo of the Savanna Accessible Onboarding Module inside Savanna\'s own page design (ALX starter kit). The log-in is simulated, all data stays in this browser, sample jobs are fictional, and the Amharic and Afaan Oromo are drafts for native-speaker review.',
      showroom: 'Developer and test page', testHost: 'Test host page',
      heroNoId: 'No ID? You can still start learning: a partner organisation can confirm who you are.',
      backIn: 'Welcome back, {name}.', toDashboard: 'Go to my dashboard',
      needLogin: 'Please log in', needLoginText: 'You need to log in to see this page.', noAccount: 'No account yet?',
      welcome: 'Welcome, {name}', idCard: 'Your ID status',
      ppNone: 'Not created yet. Tell us what helps you learn and work. It stays private.', ppCreate: 'Create my Support Passport',
      addId: 'Add your ID (optional)', idNone: 'You can start learning without an ID. Add one only if you want to.',
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
      delTitle: 'Delete my data from this phone',
      delText: 'This deletes your profile, Support Passport, applications and saved answers from this phone. Your settings stay. This cannot be undone.',
      delBtn: 'Delete my data', delYes: 'Yes, delete everything', delNo: 'No, keep my data', delSure: 'Are you sure?',
      deleted: 'Your data was deleted from this phone.',
      offline: 'You are offline. Pages you have opened before still work, and your answers stay on this phone.', online: 'You are back online.',
      barText: 'Accessibility options', larger: 'Larger text', contrast: 'High contrast', motion: 'Stop motion',
      artTitle: 'Welcome to your onboarding page', artText: 'Register in a few minutes, at your own pace, in the way that works best for you.',
      modeTitle: 'How do you like to register?',
      modeHint: 'This is only about how you like to fill in the form. We never ask why. You can change it at any time in Settings.',
      m_read_type: 'Read and type', m_listen: 'Listen and respond', m_speak: 'Speak my answers', m_simple: 'Simple steps with pictures and big text',
      pauseAudio: 'Pause', resumeAudio: 'Resume', autoOff: 'Turn off automatic reading', autoOn: 'Turn on automatic reading',
      hearPage: 'Tap anywhere or press any key to hear this page',
      listenQ: 'Listen to the question', stopAudio: 'Stop', cont: 'Continue', errMode: 'Choose one way to continue.',
      acctTitle: 'Sign up or log in', acctChosen: 'You chose: {mode}.', acctChange: 'Change how I register',
      acctNew: 'New to Savanna? Sign up one question at a time. There is no time limit.', acctHave: 'Already have an account? Log in with your phone number.',
      account: 'your account', learning: 'Access my learning', resources: 'My resources', courses: 'My courses', rooms: 'Conference rooms',
      servers: 'Servers', sandboxes: 'Sandboxes', video: 'Video on demand', campus: 'My Campus', peers: 'Peers', myProfile: 'My Profile',
      inert: '"{name}" is part of Savanna, but not of this demo.',
      srTipTitle: 'Tip for screen reader users', language: 'Language',
      ex1: 'One question at a time, in Amharic, English or Afaan Oromo', ex2: 'No time limit: your answers are saved as you go', ex3: 'We never ask about a disability or for medical papers',
      backTo: 'Back to {page}', doneBack: 'Done: back to {page}', p_home: 'the home page', p_dashboard: 'my homepage',
      p_signup: 'sign-up', p_login: 'log in', p_jobs: 'jobs', p_apply: 'the job application', p_employer: 'the employer form',
      p_profile: 'my profile', p_passport: 'my Support Passport', p_takeover: 'taking over my account', p_settings: 'settings',
      setSavedNote: 'Every change is saved at once, on this phone, and applies to every page.'
    },
    am: {
      skip: 'ወደ ዋናው ይዘት ይዝለሉ', menu: 'ምናሌ', logoAlt: 'የሳቫና መነሻ', navLabel: 'ሳቫና',
      home: 'መነሻ', dashboard: 'ዳሽቦርዴ', profile: 'የእኔ መገለጫ', passport: 'የድጋፍ ፓስፖርት', jobs: 'ሥራዎች',
      employer: 'ለቀጣሪዎች፦ ሥራ ያስተዋውቁ', settings: 'የተደራሽነት ቅንብሮች', signup: 'ይመዝገቡ', login: 'ግባ', logout: 'ውጣ',
      takeover: 'መለያዎን ይረከቡ', apply: 'አመልክት',
      foot: 'የ<span lang="en">Savanna Accessible Onboarding Module</span> ማሳያ፣ በሳቫና የራሱ የገጽ ንድፍ ውስጥ (የALX ማስጀመሪያ ኪት)። መግባቱ የተመሰለ ነው፤ ሁሉም መረጃ በዚህ ብራውዘር ውስጥ ይቆያል፤ የናሙና ሥራዎቹ ልብ ወለድ ናቸው፤ አማርኛውና አፋን ኦሮሞው በአፍ መፍቻ ተናጋሪዎች የሚገመገሙ ረቂቆች ናቸው።',
      showroom: 'የገንቢዎችና የሙከራ ገጽ', testHost: 'የሙከራ አስተናጋጅ ገጽ',
      heroNoId: 'መታወቂያ የለዎትም? አሁንም መማር መጀመር ይችላሉ፤ አጋር ድርጅት ማንነትዎን ሊያረጋግጥ ይችላል።',
      backIn: 'እንኳን ደህና መጡ፣ {name}።', toDashboard: 'ወደ ዳሽቦርዴ ሂድ',
      needLogin: 'እባክዎ ይግቡ', needLoginText: 'ይህን ገጽ ለማየት መግባት ያስፈልግዎታል።', noAccount: 'እስካሁን መለያ የለዎትም?',
      welcome: 'እንኳን ደህና መጡ፣ {name}', idCard: 'የመታወቂያዎ ሁኔታ',
      addId: 'መታወቂያዎን ይጨምሩ (አማራጭ)', idNone: 'ያለ መታወቂያ መማር መጀመር ይችላሉ። ከፈለጉ ብቻ ይጨምሩ።',
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
      delTitle: 'መረጃዬን ከዚህ ስልክ ሰርዝ',
      delText: 'ይህ መገለጫዎን፣ የድጋፍ ፓስፖርትዎን፣ ማመልከቻዎችዎንና የተቀመጡ መልሶችዎን ከዚህ ስልክ ይሰርዛል። ቅንብሮችዎ ይቆያሉ። ይህ ሊቀለበስ አይችልም።',
      delBtn: 'መረጃዬን ሰርዝ', delYes: 'አዎ፣ ሁሉንም ሰርዝ', delNo: 'አይ፣ መረጃዬ ይቆይ', delSure: 'እርግጠኛ ነዎት?',
      deleted: 'መረጃዎ ከዚህ ስልክ ተሰርዟል።',
      offline: 'ከኢንተርኔት ውጪ ነዎት። ከዚህ በፊት የከፈቷቸው ገጾች አሁንም ይሠራሉ፤ መልሶችዎም በዚህ ስልክ ላይ ይቆያሉ።', online: 'እንደገና ከኢንተርኔት ጋር ተገናኝተዋል።',
      barText: 'የተደራሽነት አማራጮች', larger: 'ትልቅ ጽሑፍ', contrast: 'ከፍተኛ ንፅፅር', motion: 'እንቅስቃሴ አቁም',
      artTitle: 'ወደ ምዝገባ ገጽዎ እንኳን ደህና መጡ', artText: 'በጥቂት ደቂቃዎች፣ በራስዎ ፍጥነት፣ ለእርስዎ በሚመች መንገድ ይመዝገቡ።',
      modeTitle: 'እንዴት መመዝገብ ይፈልጋሉ?',
      modeHint: 'ይህ ቅጹን መሙላት የሚመርጡበትን መንገድ ብቻ ነው። ምክንያቱን በፍጹም አንጠይቅም። በማንኛውም ጊዜ በቅንብሮች ውስጥ መቀየር ይችላሉ።',
      m_read_type: 'አንብቤ እጽፋለሁ', m_listen: 'አዳምጬ እመልሳለሁ', m_speak: 'በድምፅ እመልሳለሁ', m_simple: 'ቀላል ደረጃዎች ከሥዕልና ከትልቅ ጽሑፍ ጋር',
      pauseAudio: 'ለአፍታ አቁም', resumeAudio: 'ቀጥል', autoOff: 'በራስ-ሰር ማንበብን አጥፋ', autoOn: 'በራስ-ሰር ማንበብን አብራ',
      listenQ: 'ጥያቄውን አዳምጥ', stopAudio: 'አቁም', cont: 'ቀጥል', errMode: 'ለመቀጠል አንድ መንገድ ይምረጡ።',
      acctTitle: 'ይመዝገቡ ወይም ይግቡ', acctChosen: 'የመረጡት፦ {mode}።', acctChange: 'የምመዘገብበትን መንገድ ቀይር',
      acctNew: 'ለሳቫና አዲስ ነዎት? በአንድ ጊዜ አንድ ጥያቄ እየመለሱ ይመዝገቡ። የጊዜ ገደብ የለም።', acctHave: 'መለያ አለዎት? በስልክ ቁጥርዎ ይግቡ።',
      account: 'የእርስዎ መለያ', learning: 'ትምህርቴን ክፈት', resources: 'የእኔ ግብዓቶች', courses: 'ኮርሶቼ', rooms: 'የስብሰባ ክፍሎች',
      servers: 'ሰርቨሮች', sandboxes: 'የሙከራ ቦታዎች', video: 'በፍላጎት የሚታዩ ቪዲዮዎች', campus: 'የእኔ ካምፓስ', peers: 'አብረውኝ የሚማሩ', myProfile: 'የእኔ መገለጫ',
      inert: '«{name}» የሳቫና አካል ነው፤ በዚህ ማሳያ ውስጥ ግን የለም።',
      srTipTitle: 'ለስክሪን አንባቢ ተጠቃሚዎች ምክር', language: 'ቋንቋ',
      ex1: 'በአንድ ጊዜ አንድ ጥያቄ፣ በአማርኛ፣ በእንግሊዝኛ ወይም በአፋን ኦሮሞ', ex2: 'የጊዜ ገደብ የለም፤ መልሶችዎ እየሄዱ ይቀመጣሉ', ex3: 'ስለ አካል ጉዳት ወይም የሕክምና ወረቀት በፍጹም አንጠይቅም',
      backTo: 'ወደ {page} ተመለስ', doneBack: 'ጨርሻለሁ፦ ወደ {page} ተመለስ', p_home: 'መነሻ ገጽ', p_dashboard: 'መነሻ ገጼ',
      p_signup: 'ምዝገባ', p_login: 'መግቢያ', p_jobs: 'ሥራዎች', p_apply: 'የሥራ ማመልከቻ', p_employer: 'የቀጣሪ ቅጽ',
      p_profile: 'መገለጫዬ', p_passport: 'የድጋፍ ፓስፖርቴ', p_takeover: 'መለያዬን መረከብ', p_settings: 'ቅንብሮች',
      setSavedNote: 'እያንዳንዱ ለውጥ ወዲያውኑ በዚህ ስልክ ይቀመጣል፤ በሁሉም ገጾች ላይ ይሠራል።'
    },
    // Afaan Oromo: DRAFT for review by a native speaker (team review planned)
    om: {
      skip: 'Gara qabiyyee ijootti darbi',
      menu: 'Baafata',
      logoAlt: 'Fuula jalqabaa Savanna',
      navLabel: 'Savanna',
      home: 'Fuula jalqabaa',
      dashboard: 'Daashboordii koo',
      profile: 'Piroofaayilii koo',
      passport: 'Paaspoortii Deeggarsaa',
      jobs: 'Hojiiwwan',
      employer: 'Qacartootaaf: hojii beeksisi',
      settings: 'Qindaa\'ina dhaqqabummaa',
      signup: 'Galmaa\'i',
      login: 'Seeni',
      logout: 'Ba\'i',
      takeover: 'Herrega kee fudhadhu',
      apply: 'Iyyadhu',
      foot: 'Agarsiisa <span lang="en">Savanna Accessible Onboarding Module</span>, dizaayinii fuula Savanna mataa isaa keessatti (meeshaa jalqabaa ALX). Seensi fakkeessa dha, odeeffannoon hundi biraawuzara kana keessa hafa, hojiiwwan fakkeenyaa dhugaa miti, Afaan Amaaraa fi Afaan Oromoon immoo dubbattoota afaanichaatiin kan ilaalamu dha.',
      showroom: 'Fuula misoomsitootaa fi qorannoo',
      testHost: 'Fuula keessummeessaa qorannoo',
      heroNoId: 'Eenyummaa hin qabduu? Ammas barachuu jalqabuu dandeessa: dhaabbanni michuu eenyummaa kee mirkaneessuu danda\'a.',
      backIn: 'Baga nagaan deebite, {name}.',
      toDashboard: 'Gara daashboordii kootti deemi',
      needLogin: 'Maaloo seeni',
      needLoginText: 'Fuula kana ilaaluuf seenuu qabda.',
      noAccount: 'Ammaaf herrega hin qabduu?',
      welcome: 'Baga nagaan dhufte, {name}',
      idCard: 'Haala eenyummaa keetii',
      ppNone: 'Ammaaf hin uumamne. Waan barachuu fi hojjechuuf si gargaaru nutti himi. Dhuunfaan tura.',
      ppCreate: 'Paaspoortii Deeggarsaa koo uumi',
      addId: 'Eenyummaa kee dabali (dirqama miti)', idNone: 'Eenyummaa malee barachuu jalqabuu dandeessa. Yoo barbaadde qofa dabali.',
      ppSaved: 'Kuufameera. Eenyutu arga: {who}.',
      ppOnlyMe: 'ati qofa',
      ppTrainers: 'atii fi leenjistoota kee ALX',
      ppEmpty: 'Ammaaf homaa qooduu dhiisuu filatteetta.',
      ppOpen: 'Paaspoortii Deeggarsaa koo bani',
      profText: 'Maqaa, lakkoofsa bilbilaa fi eenyummaa kee ilaali ykn jijjiiri.',
      profOpen: 'Piroofaayilii koo bani',
      jobsText: 'Hojiiwwan deeggarsa barbaaddu kennan argadhu. Calaltichi bilbila kee irratti hojjeta.',
      jobsOpen: 'Hojii barbaadi',
      setText: 'Hamma barreeffamaa, garaagarummaa halluu, afaan, sagaleen dubbisuu fi deebii sagaleen.',
      setOpen: 'Qindaa\'ina bani',
      takeText: 'Dhaabbanni michuu si galmeesseera. Bal\'ina isaa ilaaliitii herrega kee fudhadhu.',
      loginTitle: 'Seeni',
      simLabel: 'Seensa fakkeessaa',
      simText: 'Agarsiisni kun sarvarii hin qabu. Ergaan gabaabaan (SMS) hin ergamu. Kan mirkanaa\'u lakkoofsi bilbilaa herrega bilbila kana irratti kuufame wajjin wal simuu isaa qofa.',
      phone: 'Lakkoofsa bilbilaa',
      phoneHint: 'Lakkoofsa ittiin galmoofte, fakkeenyaaf 0911 234 567.',
      sendCode: 'Koodii naaf ergi',
      smsTitle: 'Ergaa gabaabaa fakkeessaa',
      smsText: 'Koodiin seensa Savanna kee {code} dha',
      code: 'Koodii ergaa gabaabaa irraa',
      codeHint: 'Garagalchitee maxxansuu, ykn bilbilli kee akka guutu hayyamuu dandeessa. Daangaan yeroo hin jiru.',
      doLogin: 'Seeni',
      problem: 'Rakkoon jira',
      errPhone: 'Lakkoofsa bilbilaa dijiitii 10 qabu galchi, fakkeenyaaf 0911 234 567.',
      errNoAccount: 'Bilbila kana irratti herregni Savanna lakkoofsa bilbilaa kanaan hin jiru. Lakkoofsa ilaali, ykn galmaa\'i.',
      errCode: 'Koodiin sun ergaa gabaabaa wajjin wal hin simu. Ilaaliitii irra deebi\'ii yaali. Maxxansuu dandeessa.',
      codeSent: 'Koodiin ergameera (fakkeessa). Armaan gaditti mul\'ata.',
      loggedOut: 'Baateetta. Deebiin kee bilbila kana irra tura.',
      employerIntro: 'Qacartootaaf',
      settingsIntro: '',
      delTitle: 'Odeeffannoo koo bilbila kana irraa haqi',
      delText: 'Kun piroofaayilii, Paaspoortii Deeggarsaa, iyyannoowwan fi deebii kuufame kee bilbila kana irraa haqa. Qindaa\'inni kee ni hafa. Kun deebi\'uu hin danda\'u.',
      delBtn: 'Odeeffannoo koo haqi',
      delYes: 'Eeyyee, hunda haqi',
      delNo: 'Lakki, odeeffannoon koo haa hafu',
      delSure: 'Mirkaneeffattaa?',
      deleted: 'Odeeffannoon kee bilbila kana irraa haqameera.',
      offline: 'Interneetii irraa ala jirta. Fuulli kanaan dura banatte amma iyyuu ni hojjeta, deebiin kee immoo bilbila kana irra tura.',
      online: 'Interneetiitti deebi\'teetta.',
      barText: 'Filannoowwan dhaqqabummaa',
      larger: 'Barreeffama guddaa',
      contrast: 'Garaagarummaa halluu ol\'aanaa',
      motion: 'Sochii dhaabi',
      artTitle: 'Gara fuula galmee keetiitti baga nagaan dhufte',
      artText: 'Daqiiqaa muraasa keessatti, saffisa keetiin, karaa siif mijatuun galmaa\'i.',
      modeTitle: 'Akkamitti galmaa\'uu barbaadda?',
      modeHint: 'Kun akkaataa unka kana guutuu barbaaddu qofa ilaala. Sababa gonkumaa hin gaafannu. Yeroo kamiyyuu Qindaa\'ina keessatti jijjiiruu dandeessa.',
      m_read_type: 'Dubbisuu fi barreessuu',
      m_listen: 'Dhaggeeffachuu fi deebisuu',
      m_speak: 'Deebii koo sagaleen kennuu',
      m_simple: 'Tarkaanfii salphaa fakkii fi barreeffama gurguddaa wajjin',
      listenQ: 'Gaaffii dhaggeeffadhu',
      stopAudio: 'Dhaabi',
      pauseAudio: 'Dhaabi xiqqoo', resumeAudio: 'Itti fufi', autoOff: 'Dubbisa ofumaan dhaabi', autoOn: 'Dubbisa ofumaan jalqabi',
      cont: 'Itti fufi',
      errMode: 'Itti fufuuf karaa tokko filadhu.',
      acctTitle: 'Galmaa\'i ykn seeni',
      acctChosen: 'Kan filatte: {mode}.',
      acctChange: 'Akkaataa itti galmaa\'u jijjiiri',
      acctNew: 'Savanna\'tti haaraa dhaa? Gaaffii tokko tokkoon galmaa\'i. Daangaan yeroo hin jiru.',
      acctHave: 'Duraanuu herrega qabdaa? Lakkoofsa bilbila keetiin seeni.',
      account: 'herrega kee',
      learning: 'Barnoota koo seeni',
      resources: 'Qabeenya koo',
      courses: 'Koorsiiwwan koo',
      rooms: 'Kutaalee walgahii',
      servers: 'Sarvariiwwan',
      sandboxes: 'Bakka shaakalaa',
      video: 'Viidiyoo yeroo barbaadanitti',
      campus: 'Kaampasii koo',
      peers: 'Hiriyoota barumsaa',
      myProfile: 'Piroofaayilii koo',
      inert: '"{name}" kutaa Savanna ti, garuu agarsiisa kana keessa hin jiru.',
      srTipTitle: 'Gorsa fayyadamtoota dubbisaa iskiriiniitiif', language: 'Afaan',
      ex1: 'Yeroo tokkotti gaaffii tokko, Afaan Amaaraa, Ingiliffaa ykn Afaan Oromootiin', ex2: 'Daangaan yeroo hin jiru: deebiin kee yeroo deemtu kuufama', ex3: 'Waa\'ee qaama miidhamuu ykn waraqaa yaalaa gonkumaa hin gaafannu',
      backTo: 'Gara {page} deebi\'i', doneBack: 'Xumureera: gara {page} deebi\'i', p_home: 'fuula jalqabaa', p_dashboard: 'fuula koo',
      p_signup: 'galmee', p_login: 'seensa', p_jobs: 'hojiiwwan', p_apply: 'iyyannoo hojii', p_employer: 'unka qacaraa',
      p_profile: 'piroofaayilii koo', p_passport: 'Paaspoortii Deeggarsaa koo', p_takeover: 'herrega koo fudhachuu', p_settings: 'qindaa\'ina',
      setSavedNote: 'Jijjiiramni hundi battalumatti bilbila kana irratti kuufama, fuula hundattis ni hojjeta.'
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

  /* ---------- Savanna frame: header + sidebar + main, with accessibility fixes ----------
     Signed in: Savanna's own sidebar, with the same items, groups and order as ALX's learner homepage
     (homepage-v1-self-paced), plus "Jobs" in "My Campus". Our other links sit where sites usually put them:
     the learner's account menu (top right), the accessibility bar (top), and the footer (for employers).
     Signed out (home, sign-up, log-in...): no sidebar, as on ALX's own sign-up page; "Log in" or "Sign up" top right. */
  var narrow = window.matchMedia('(max-width: 767.98px)');
  function hasSidebar() { return signedIn() && page !== 'home'; }
  var NAV = [
    { items: [['dashboard.html', 'home', 'fa-home'], ['#', 'learning', 'fa-chalkboard-teacher']] },
    { label: 'resources', items: [['#', 'courses', 'fa-graduation-cap'], ['#', 'rooms', 'fa-comments'], ['#', 'servers', 'fa-server'], ['#', 'sandboxes', 'fa-terminal'], ['#', 'video', 'fa-film']] },
    { label: 'campus', items: [['#', 'peers', 'fa-users'], ['jobs.html', 'jobs', 'fa-briefcase']] },
    { bottom: true, items: [['profile.html', 'myProfile', 'fa-user']] }
  ];
  function navItems() {
    var current = { dashboard: 'home', apply: 'jobs', jobs: 'jobs', profile: 'myProfile', takeover: 'myProfile', passport: 'myProfile' }[page];
    return NAV.map(function (g) {
      return '<ul class="px-2' + (g.bottom ? ' sj-nav-bottom' : '') + (g.label ? ' sj-nav-group' : '') + '"' + (g.label ? ' aria-label="' + esc(T(g.label)) + '"' : '') + '>' +
        g.items.map(function (i) {
          var cur = i[1] === current;
          return '<li><a href="' + i[0] + '"' + (i[0] === '#' ? ' data-sj-inert' : '') + (cur ? ' aria-current="page"' : '') + '><span class="icon' + (cur ? ' active' : '') + '"><i aria-hidden="true" class="fa-solid ' + i[2] + '"></i></span>' +
            '<span class="ps-3 sj-label">' + T(i[1]) + '</span></a></li>';
        }).join('') + '</ul>';
    }).join('');
  }
  function headerRight() {
    if (signedIn()) {
      var p = profile();
      return '<div class="sj-acct-wrap"><button type="button" class="sj-acct" aria-expanded="false" aria-controls="sj-acct-menu">' +
        '<i class="fa-solid fa-circle-user" aria-hidden="true"></i><span class="sj-acct-name">' + esc((p.name || '').split(' ')[0]) + '</span><span class="vh sj-vh"> — ' + T('account') + '</span><i class="fa-solid fa-angle-down" aria-hidden="true"></i></button>' +
        '<ul id="sj-acct-menu" class="sj-acct-menu" hidden>' +
        '<li><a href="passport.html"' + (page === 'passport' ? ' aria-current="page"' : '') + '>' + T('passport') + '</a></li>' +
        '<li><a href="profile.html"' + (page === 'profile' ? ' aria-current="page"' : '') + '>' + T('profile') + '</a></li>' +
        '<li><a href="settings.html"' + (page === 'settings' ? ' aria-current="page"' : '') + '>' + T('settings') + '</a></li>' +
        '<li><a href="index.html" data-logout>' + T('logout') + '</a></li></ul></div>';
    }
    if (page === 'login') return '<a class="sj-head-link" href="signup.html">' + T('signup') + '</a>';
    return '<a class="sj-head-link" href="login.html">' + T('login') + '</a>';
  }
  function frame() {
    document.documentElement.lang = lang();
    var side = hasSidebar(), open = side && !document.body.classList.contains('sidebar-collapsed');
    document.body.classList.toggle('sj-noside', !side);
    var html =
      '<a class="sj-skip" href="#content">' + T('skip') + '</a>' +
      (needPrompt && lang() === 'en' ? '<button type="button" class="sj-hear" id="sj-hear" lang="en">' + T('hearPage') + '</button>' : '') +
      toolbar() +
      '<header class="header d-flex align-items-center w-100 sj-header">' +
        '<div class="header-left align-items-center d-flex px-2">' +
          (side ? '<button type="button" class="hamburger sj-menu" aria-expanded="' + open + '" aria-controls="sidebar"><i class="fa-solid fa-bars" aria-hidden="true"></i><span class="sj-menu-label">' + T('menu') + '</span></button>' : '') +
          // no logo (the module is for any organisation); visitors who are not logged in get a plain "Home" link
          (!side && page !== 'home' ? '<a class="sj-home-link" href="index.html"><i class="fa-solid fa-house" aria-hidden="true"></i><span>' + T('home') + '</span></a>' : '') +
        '</div>' +
        '<div class="header-right d-flex align-items-center flex-grow-1 justify-content-end pe-3">' + headerRight() + '</div>' +
      '</header>' +
      (side ? '<nav class="sidebar navigation bg-white border-end position-fixed overflow-scroll bottom-0 start-0' + (open ? ' expanded' : '') + '" id="sidebar" aria-label="' + esc(T('navLabel')) + '">' + navItems() + '</nav>' : '');
    var shell = document.getElementById('sj-frame');
    if (!shell) { shell = document.createElement('div'); shell.id = 'sj-frame'; document.body.insertBefore(shell, document.body.firstChild); }
    shell.innerHTML = html;
    var main = document.getElementById('content');
    if (!main) {
      main = document.createElement('main'); main.className = 'content'; main.id = 'content'; main.tabIndex = -1;
      main.innerHTML = '<div class="sj"><p id="sj-offline" class="notice" role="status" hidden></p><div id="sj-view"></div><footer class="sj-foot"><p class="sj-foot-links"></p></footer></div>';
      document.body.appendChild(main);
    }
    main.querySelector('.sj-foot-links').innerHTML = (signedIn() ? '' : '<a href="jobs.html">' + T('jobs') + '</a> · ') + '<a href="employer.html">' + T('employer') + '</a> · ' +
      '<a href="showroom.html">' + T('showroom') + '</a> · <a href="test-host/">' + T('testHost') + '</a>';
    wireFrame();
  }
  /* The bar from ALX's own accessible hackathon site, as a landmark named "Accessibility options". Toggle buttons with a pressed
     state (aria-pressed, plus a tick and dark fill that do not rely on colour alone). They change the module's
     saved preferences, so the choice follows the learner to every page and every form. */
  function toolbar() {
    var p = D.prefs();
    function tog(key, on, label, extra) {
      return '<li><button type="button" class="sj-tog" data-tog="' + key + '" aria-pressed="' + on + '"' + (extra || '') + '>' +
        '<span class="sj-tick" aria-hidden="true">✓ </span>' + label + '</button></li>';
    }
    // No visible sentence: the bar is a landmark named "Accessibility options" (screen readers list it with D / regions)
    return '<section class="sj-a11y sj-a11y-bare" aria-label="' + esc(T('barText')) + '"><div class="sj-a11y-in"><ul class="sj-a11y-list">' +
      // sound first: the one-key "off" switch, then Pause and Stop (always visible)
      '<li><button type="button" class="sj-tog sj-snd" data-tog="autoRead">' + T(p.autoRead === 'off' ? 'autoOn' : 'autoOff') + '</button></li>' +
      '<li><button type="button" class="sj-tog sj-snd" data-audio="pause">' + T(D.player.state === 'paused' ? 'resumeAudio' : 'pauseAudio') + '</button></li>' +
      '<li><button type="button" class="sj-tog sj-snd" data-audio="stop">' + T('stopAudio') + '</button></li>' +
      tog('size', p.size !== 'normal', T('larger')) +
      tog('contrast', p.contrast === 'high', T('contrast')) +
      tog('motion', p.motion === 'reduce', T('motion')) +
      // one "Language" dropdown instead of a button per language; each language is named in its own language
      '<li class="sj-lang-wrap"><button type="button" class="sj-tog sj-lang-btn" aria-expanded="false" aria-controls="sj-lang-menu">' +
        '<i class="fa-solid fa-globe" aria-hidden="true"></i><span class="sj-vh">' + T('language') + ': </span><span lang="' + lang() + '">' + D.languageNames[lang()] + '</span>' +
        '<i class="fa-solid fa-angle-down" aria-hidden="true"></i></button>' +
        '<ul id="sj-lang-menu" class="sj-lang-menu" hidden>' + D.languages.map(function (l) {
          return '<li><button type="button" data-lang="' + l + '" lang="' + l + '"' + (l === lang() ? ' aria-current="true"' : '') + '>' +
            '<span class="sj-tick" aria-hidden="true">' + (l === lang() ? '✓' : '') + '</span>' + D.languageNames[l] + '</button></li>';
        }).join('') + '</ul></li>' +
      '<li><a class="sj-tog sj-tog-link" href="settings.html"' + (page === 'settings' ? ' aria-current="page"' : '') + '><i class="fa-solid fa-universal-access" aria-hidden="true"></i> ' + T('settings') + '</a></li>' +
      '</ul></div></section>';
  }
  function toggle(key) {
    var p = D.prefs();
    if (key === 'size') D.setPrefs({ size: p.size === 'normal' ? 'large' : 'normal' });
    else if (key === 'contrast') D.setPrefs({ contrast: p.contrast === 'high' ? 'normal' : 'high' });
    else if (key === 'motion') D.setPrefs({ motion: p.motion === 'reduce' ? 'normal' : 'reduce' });
    else if (key === 'autoRead') { if (p.autoRead !== 'off') D.stopSpeaking(); needPrompt = false; D.setPrefs({ autoRead: p.autoRead === 'off' ? 'on' : 'off' }); }
    else if (D.languages.indexOf(key) !== -1 && key !== lang()) D.setPrefs({ lang: key });
  }
  /* The header scrolls with the page until it reaches the top, then stays (sticky); the toolbar above it scrolls
     away, so on a small screen or at 400% zoom the fixed part is never more than the 72px header. The sidebar
     starts just under the header wherever it is. */
  function placeSidebar() {
    var hd = document.querySelector('.sj-header'), nav = document.getElementById('sidebar');
    if (hd && nav) nav.style.top = Math.max(0, Math.round(hd.getBoundingClientRect().bottom)) + 'px';
  }
  window.addEventListener('scroll', placeSidebar, { passive: true });
  window.addEventListener('resize', placeSidebar);
  function setMenu(open, focusBtn) {
    var btn = document.querySelector('.sj-menu'), nav = document.getElementById('sidebar');
    if (!btn || !nav) return;
    document.body.classList.toggle('sidebar-collapsed', !open);
    nav.classList.toggle('expanded', open);
    btn.setAttribute('aria-expanded', String(open));
    try { if (!narrow.matches) localStorage.setItem('sidebar-collapsed', open ? '0' : '1'); } catch (e) {}
    if (open && narrow.matches) { var a = nav.querySelector('a[aria-current]') || nav.querySelector('a'); if (a) a.focus(); }
    if (!open && focusBtn) btn.focus();
  }
  function wireFrame() {
    var menu = document.querySelector('.sj-menu');
    if (menu) menu.onclick = function () { setMenu(this.getAttribute('aria-expanded') !== 'true'); };
    var lb = document.querySelector('.sj-lang-btn');
    if (lb) lb.onclick = function () { setLangMenu(lb.getAttribute('aria-expanded') !== 'true'); };
    Array.prototype.forEach.call(document.querySelectorAll('#sj-lang-menu button[data-lang]'), function (b) {
      b.onclick = function () {
        var to = b.getAttribute('data-lang');
        langFocus = true; // after the page is redrawn in the new language, focus returns to the Language button
        if (to === lang()) { setLangMenu(false, true); return; }
        D.setPrefs({ lang: to });
      };
    });
    var acct = document.querySelector('.sj-acct');
    if (acct) acct.onclick = function () { setAcct(acct.getAttribute('aria-expanded') !== 'true'); };
    // Savanna sections that are not part of this demo (as in ALX's frozen starter, where these links go nowhere)
    Array.prototype.forEach.call(document.querySelectorAll('[data-sj-inert]'), function (a) {
      a.onclick = function (e) { e.preventDefault(); notice(T('inert', { name: a.textContent })); };
    });
    // only the toggle buttons: the "Accessibility settings" link shares their look but is a plain link (it used to
    // run toggle(null) too, which wiped the learner's language choice)
    Array.prototype.forEach.call(document.querySelectorAll('button.sj-tog[data-tog]'), function (b) { b.onclick = function () { toggle(b.getAttribute('data-tog')); }; });
    Array.prototype.forEach.call(document.querySelectorAll('button[data-audio]'), function (b) {
      b.onclick = function () {
        var pl = D.player;
        if (b.getAttribute('data-audio') === 'stop') D.stopSpeaking();
        else if (pl.state === 'playing') pl.pause(); else if (pl.state === 'paused') pl.resume();
      };
    });
    placeSidebar();
    var lo = document.querySelector('[data-logout]');
    if (lo) lo.onclick = function () { setSession(null); try { sessionStorage.setItem('sj-flash', 'loggedOut'); } catch (e) {} };
  }
  /* Account menu: a disclosure button with a list of links (not an ARIA menu, so every screen reader reads it as
     links). Escape or a click elsewhere closes it. */
  var langFocus = false;
  function setLangMenu(open, focusBtn) {
    var b = document.querySelector('.sj-lang-btn'), m = document.getElementById('sj-lang-menu');
    if (!b || !m) return;
    b.setAttribute('aria-expanded', String(open)); m.hidden = !open;
    if (open) (m.querySelector('[aria-current]') || m.querySelector('button')).focus(); else if (focusBtn) b.focus();
  }
  function setAcct(open, focusBtn) {
    var b = document.querySelector('.sj-acct'), m = document.getElementById('sj-acct-menu');
    if (!b || !m) return;
    b.setAttribute('aria-expanded', String(open)); m.hidden = !open;
    if (open) m.querySelector('a').focus(); else if (focusBtn) b.focus();
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.sj-acct-wrap')) setAcct(false);
    if (!e.target.closest || !e.target.closest('.sj-lang-wrap')) setLangMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    var ab = document.querySelector('.sj-acct');
    if (e.key === 'Escape' && ab && ab.getAttribute('aria-expanded') === 'true') { setAcct(false, true); return; }
    var lbt = document.querySelector('.sj-lang-btn');
    if (e.key === 'Escape' && lbt && lbt.getAttribute('aria-expanded') === 'true') { setLangMenu(false, true); return; }
    var btn = document.querySelector('.sj-menu');
    if (e.key === 'Escape' && narrow.matches && btn && btn.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  // Phones start with the menu closed (Savanna's sidebar covers the page there); larger screens remember the choice.
  var collapsed = narrow.matches; try { if (!narrow.matches) collapsed = localStorage.getItem('sidebar-collapsed') === '1'; } catch (e) {}
  if (page === 'home') document.body.classList.add('sj-home'); // the home page is a full-width welcome, with no sidebar
  document.body.classList.add('signed_in');
  document.body.classList.toggle('sidebar-collapsed', collapsed);

  /* ---------- page summaries and automatic reading (English only for now) ----------
     Every page and every form step has a short, hand-written summary. It is the first text inside <main> (visually
     hidden), so a screen reader reaches it first. After the learner's first tap or key press it is also read aloud
     when each page or step opens, remembered across pages and visits (preference autoRead). Pause and Stop are always
     in the bar, Escape stops the sound at once, and "Turn off automatic reading" is the first control in the bar
     (also in Settings), so screen reader users can switch our audio off with one key (WCAG 1.4.2 Audio Control).
     On a new page the summary is tried at once when automatic reading is on and the learner has already interacted
     with the site in this session. Only if the browser blocks it (the play promise is rejected, or speech says
     "not-allowed") is "Tap anywhere or press any key to hear this page" shown. Nothing throws when sound is blocked. */
  // "Has interacted": with this page, or with the site earlier in this browser session (sessionStorage)
  var INTERACTED = 'sj-interacted';
  function sessionInteracted() { try { return sessionStorage.getItem(INTERACTED) === '1'; } catch (e) { return false; } }
  var needPrompt = false, summaryText = '', lastRead = '', interacted = !!(navigator.userActivation && navigator.userActivation.hasBeenActive) || sessionInteracted();
  var summaryOwner = { audioIssue: function () {} }; // no voice: the summary stays written in the page
  var PAGE_SUMMARY = {
    login: 'Log in. This log-in is simulated: no SMS is sent. Type the phone number you signed up with, then choose Send me a code. The code appears on the screen, and you can paste it. There is no time limit.',
    dashboard: 'Your Savanna homepage. First come the things waiting for you, such as adding your ID or creating your Support Passport, then your course, your progress and your activities. The Menu button opens the sidebar.',
    jobs: 'Jobs. First a checkbox shows only jobs that offer the support in your Support Passport; this is worked out on this phone only. Then the list of jobs: each job title is a heading, with its own Apply link.',
    passport: 'Your Support Passport: what helps you, and who can see it. Below are buttons to change it and to manage sharing.',
    settings: 'Accessibility settings: language, text size, contrast, motion, how you answer, reading aloud, automatic reading, pictures and voice. Every change is saved at once. At the bottom is Done.',
    takeover: 'Take over your account. There is nothing to take over on this phone.',
    needLogin: 'You need to log in to see this page. Below are Log in and Sign up.'
  };
  // Said before and after a form step's own summary, so the learner knows which page they are on
  var FORM_PRE = { signup: 'Sign up for Savanna.', identity: 'Add your ID. This is optional.', takeover: 'Take over your account.', passport: 'Support Passport. It is private.',
    apply: 'Job application.', employer: 'For employers: post a job.', profile: 'My profile.' };
  var FORM_POST = { profile: 'Below the form are your ID status with Add your ID, your Support Passport, and Delete my data from this phone.' };
  function homeSummary() {
    if (signedIn()) return 'Welcome back. Below is a button to go to your dashboard.';
    if (home.step === 'account') return 'Step 2 of 2: sign up or log in. Choose Sign up if you are new to Savanna, or Log in if you already have an account. Above them is a button to change how you register.';
    return 'Welcome to Savanna. Step 1 of 2: choose how you like to register: read and type, listen and respond, speak my answers, or simple steps with pictures and big text. Then choose Continue. The accessibility options and the language are at the top of the page.';
  }
  function pageSummary() {
    if (PROTECTED.indexOf(page) !== -1 && !signedIn()) return PAGE_SUMMARY.needLogin;
    return page === 'home' ? homeSummary() : PAGE_SUMMARY[page] || '';
  }
  // force: a new page or step (read even if the words are the same); otherwise only read when the words changed
  function setSummary(text, force) {
    var main = document.getElementById('content');
    if (!main) return;
    var el = document.getElementById('sj-summary');
    if (!el) { el = document.createElement('p'); el.id = 'sj-summary'; el.className = 'sj-vh'; el.setAttribute('lang', 'en'); }
    if (main.firstChild !== el) main.insertBefore(el, main.firstChild); // the first text inside main
    summaryText = lang() === 'en' ? text || '' : '';
    el.textContent = summaryText;
    el.hidden = !summaryText;
    if (force || summaryText !== lastRead) autoRead();
  }
  function readSummary() { if (summaryText && lang() === 'en') { lastRead = summaryText; try { D.player.play([{ key: null, text: summaryText }], 'en', summaryOwner); } catch (e) {} } }
  function showPrompt(on) {
    needPrompt = on;
    var b = document.getElementById('sj-hear');
    if (on && !b && lang() === 'en') {
      var skip = document.querySelector('.sj-skip');
      if (skip) skip.insertAdjacentHTML('afterend', '<button type="button" class="sj-hear" id="sj-hear" lang="en">' + T('hearPage') + '</button>');
    } else if (!on && b) {
      var had = document.activeElement === b;
      b.parentNode.removeChild(b);
      if (had) { var tg = document.querySelector('[data-tog="autoRead"]'); if (tg) tg.focus(); } // the off switch is next
    }
  }
  function autoRead() {
    var pr = D.prefs();
    if (!summaryText || pr.autoRead === 'off') { showPrompt(false); return; }
    // a form in "read aloud" mode reads each question itself; the summary is then not read on top of it
    if (pr.easy && view && view.querySelector('savanna-onboarding-form')) return;
    if (pr.autoRead === 'on' && interacted) readSummary(); else showPrompt(true);
  }
  // the browser refused to play: ask for a tap or key press, then read
  document.addEventListener('savanna-onboarding:audioblocked', function () {
    if (summaryText && D.prefs().autoRead !== 'off' && lang() === 'en') { lastRead = ''; showPrompt(true); }
  });
  // The first tap or key press (not Shift, Control, Escape...) turns automatic reading on and reads this page.
  // Done after the browser has handled the press, so the page never moves under the learner's finger.
  // Tab is not "a key" here: keyboard and screen reader users move with it, and must be able to reach the prompt
  var IGNORE_KEYS = ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Insert', 'NumLock', 'Escape'];
  function firstInteraction(e) {
    if (e.type === 'keydown' && IGNORE_KEYS.indexOf(e.key) !== -1) return;
    if (e.type === 'click' && e.target && e.target.closest && e.target.closest('[data-tog="autoRead"]')) { interacted = true; try { sessionStorage.setItem(INTERACTED, '1'); } catch (x) {} return; } // the off switch itself
    interacted = true;
    try { sessionStorage.setItem(INTERACTED, '1'); } catch (x) {}
    if (!needPrompt) return;
    var pr = D.prefs();
    if (pr.autoRead === 'off' || lang() !== 'en') return;
    if (pr.autoRead === 'ask') { try { var raw = D.store.get('prefs', {}) || {}; raw.autoRead = 'on'; D.store.set('prefs', raw); } catch (x) {} }
    var tg = document.querySelector('[data-tog="autoRead"]'); if (tg) tg.textContent = T('autoOff');
    setTimeout(function () { showPrompt(false); readSummary(); }, 0);
  }
  document.addEventListener('click', firstInteraction, true);
  document.addEventListener('keydown', firstInteraction, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && D.player.state !== 'idle') D.stopSpeaking(); }); // Escape stops at once
  // each new form step brings its own summary
  document.addEventListener('savanna-onboarding:step', function (e) {
    var d = e.detail || {};
    if (!d.summary) { setSummary(''); return; }
    setSummary([FORM_PRE[d.form] || '', d.summary, (d.mode === 'review' && FORM_POST[d.form]) || ''].join(' ').trim(), true);
  });
  D.player.on(function (pl) {
    var b = document.querySelector('button[data-audio="pause"]'); if (b) b.textContent = T(pl.state === 'paused' ? 'resumeAudio' : 'pauseAudio');
  });

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
    home: function () { title('home'); homePage(); },
    signup: function () {
      title('signup');
      H.signupWelcome = !D.prefs().mode;
      H.render('signup', view);
    },
    login: function () { title('login'); loginPage(); },
    /* ALX's self-paced learner homepage (dashboard.html, built by tools/dashboard-page.cjs). We only add the
       learner's name and greeting, and a short note above it when something is waiting for them. */
    dashboard: function () {
      title('dashboard');
      var p = profile(), pp = store.get('passport', null), h = new Date().getHours();
      Array.prototype.forEach.call(document.querySelectorAll('[data-sj-name]'), function (n) { n.textContent = (p.name || '').split(' ')[0]; });
      var g = document.querySelector('[data-sj-greeting]'); if (g) g.textContent = h < 12 ? 'Good morning,' : h < 18 ? 'Good afternoon,' : 'Good evening,';
      view.innerHTML = p.takeover_pending ? '<div class="notice"><p><strong>' + T('takeover') + '.</strong> ' + T('takeText') + '</p><p class="mb-0"><a class="btn primary" href="takeover.html">' + T('takeover') + '</a></p></div>'
        : (!p.id_route ? '<div class="notice sj-add-id"><p>' + T('idNone') + '</p><p class="mb-0"><a class="btn" href="profile.html?add=id">' + T('addId') + '</a></p></div>' : '') +
          (!pp ? '<div class="notice"><p><strong>' + T('passport') + '.</strong> ' + T('ppNone') + '</p><p class="mb-0"><a class="btn primary" href="passport.html">' + T('ppCreate') + '</a></p></div>' : '');
    },
    profile: function () {
      // "Add your ID (optional)" opens here, on My profile (profile.html?add=id)
      if (new URLSearchParams(location.search).get('add') === 'id') { title('addId'); H.render('identity', view); return; }
      title('profile');
      H.render('profile', view);
      // moved here from the old dashboard: ID status, Support Passport status and "Delete my data from this phone"
      var p = profile(), pp = store.get('passport', null), extra = document.createElement('ul');
      extra.className = 'sj-cards sj-profile-cards';
      var ppBody = !pp ? '<p>' + T('ppNone') + '</p>'
        : '<p>' + (D.prefs().pictures ? '<span aria-hidden="true">🔒 </span>' : '') + T('ppSaved', { who: T(pp.sharing === 'trainers' ? 'ppTrainers' : 'ppOnlyMe') }) + '</p>' + ((pp.needs || []).length ? '' : '<p>' + T('ppEmpty') + '</p>');
      extra.innerHTML = card(T('idCard'), H.statusPanel(p, true), null) + card(T('passport'), ppBody, 'passport.html', T(pp ? 'ppOpen' : 'ppCreate')) +
        // The consent promises "you can change or delete your answers at any time": this is the delete path.
        '<li class="card homepage-card rounded-3 sj-card"><h2 class="h5">' + T('delTitle') + '</h2><p>' + T('delText') + '</p>' +
        '<p class="mb-0"><button type="button" class="btn danger" id="sj-del" aria-expanded="false" aria-controls="sj-del-confirm">' + T('delBtn') + '</button></p>' +
        '<div id="sj-del-confirm" hidden><p><strong>' + T('delSure') + '</strong></p><p class="actions">' +
        '<button type="button" class="btn danger" id="sj-del-yes">' + T('delYes') + '</button> <button type="button" class="btn" id="sj-del-no">' + T('delNo') + '</button></p></div></li>';
      view.appendChild(extra);
      var del = document.getElementById('sj-del'), box = document.getElementById('sj-del-confirm');
      del.onclick = function () { var open = box.hidden; box.hidden = !open; del.setAttribute('aria-expanded', String(open)); if (open) document.getElementById('sj-del-no').focus(); };
      document.getElementById('sj-del-no').onclick = function () { box.hidden = true; del.setAttribute('aria-expanded', 'false'); del.focus(); };
      document.getElementById('sj-del-yes').onclick = function () {
        store.keys().forEach(function (k) { if (k !== 'prefs' && k !== 'voiceConsent') store.del(k); });
        setSession(null);
        try { sessionStorage.setItem('sj-flash', 'deleted'); } catch (e) {}
        location.href = 'index.html';
      };
    },
    takeover: function () { title('takeover'); H.render('takeover', view); },
    passport: function () { title('passport'); H.render('passport', view); },
    jobs: function () { title('jobs'); H.render('jobs', view); },
    apply: function () {
      title('apply');
      var id = new URLSearchParams(location.search).get('job') || '';
      H.render('apply', view, id);
    },
    employer: function () { title('employer'); H.render('employer', view); },
    settings: function () {
      title('settings');
      H.render('settings', view);
      view.insertAdjacentHTML('afterbegin', '<div id="sj-set-back"></div>');
      view.insertAdjacentHTML('beforeend', '<div id="sj-set-done" class="sj-done"></div>');
      settingsExtras();
      var h = view.querySelector('.dm-q'); if (h) h.focus();
    }
  };

  /* Home, in the layout of ALX's own sign-up page: a welcome panel on the left, and on the right first
     "How would you like to use Savanna?" (read and type, listen, speak, simple), then "Sign up or log in".
     The choice is saved as the learner's preference, so the sign-up form starts straight at its first question. */
  var MODES = ['read_type', 'listen', 'speak', 'simple'], MODE_ICONS = { read_type: '⌨️', listen: '🎧', speak: '🎤', simple: '🖼️' };
  var home = { step: new URLSearchParams(location.search).get('step') === 'account' ? 'account' : 'mode', mode: D.prefs().mode || '', error: '' };
  var homeAudio = { audioIssue: function (code) { var st = document.getElementById('sj-mode-status'); if (st && code === 'noAudio') st.textContent = D.label({ en: 'There is no recording for this yet, and this phone has no voice for this language. Everything is written on the screen.', am: 'ለዚህ ገና ቅጂ የለም፤ ይህ ስልክም ለዚህ ቋንቋ ድምፅ የለውም። ሁሉም ነገር በማያ ገጹ ላይ ተጽፏል።', om: 'Kanaaf ammaaf waraabbiin hin jiru, bilbilli kun immoo afaan kanaaf sagalee hin qabu. Wanti hundi iskiriinii irratti barreeffameera.' }, lang()); } };
  function homePage() {
    D.styles(); // the module's option, button and error styles
    var right;
    if (signedIn()) {
      right = '<h2 class="dm-q">' + T('backIn', { name: esc(profile().name) }) + '</h2>' +
        '<p class="actions"><a class="btn primary big" href="dashboard.html">' + T('toDashboard') + '</a></p>';
    } else if (home.step === 'account') {
      right = '<h2 class="dm-q" id="sj-step-h">' + T('acctTitle') + '</h2>' +
        (home.mode ? '<p>' + T('acctChosen', { mode: T('m_' + home.mode) }) + ' <button type="button" class="sj-linkbtn" id="sj-change">' + T('acctChange') + '</button></p>' : '') +
        '<ul class="sj-choice">' +
        '<li><p>' + T('acctNew') + '</p><a class="btn primary big" href="signup.html">' + T('signup') + '</a></li>' +
        '<li><p>' + T('acctHave') + '</p><a class="btn big" href="login.html">' + T('login') + '</a></li></ul>' +
        '<p class="muted">' + T('heroNoId') + '</p>';
    } else {
      var err = home.error;
      right = (err ? '<div class="dm-errors" role="alert" tabindex="-1" id="sj-mode-errors"><h3>' + T('problem') + '</h3><ul><li><a href="#sj-mode-0">' + esc(err) + '</a></li></ul></div>' : '') +
        '<form class="dm-form" id="sj-mode" novalidate><fieldset aria-describedby="sj-mode-hint' + (err ? ' sj-mode-err' : '') + '"><legend><h2 class="dm-q" id="sj-step-h">' + T('modeTitle') + '</h2></legend>' +
        '<p id="sj-mode-hint" class="dm-hint">' + T('modeHint') + '</p>' +
        '<details class="dm-note dm-sr-tip sj-tip"><summary>' + T('srTipTitle') + '</summary><p lang="en">If your screen reader spells Amharic letters one by one, turn on Read aloud to hear recorded Amharic, or switch to English.</p>' +
        '<p lang="am">የስክሪን አንባቢዎ የአማርኛ ፊደላትን አንድ በአንድ የሚያነብ ከሆነ፣ የተቀዳውን የአማርኛ ድምፅ ለመስማት «ጮክ ብሎ ማንበብ»ን ያብሩ፣ ወይም ወደ እንግሊዝኛ ይቀይሩ።</p>' +
        '<p lang="om">Yoo dubbisaan iskiriinii kee qubee Afaan Amaaraa tokko tokkoon dubbise, sagalee Afaan Amaaraa waraabame dhaggeeffachuuf «Sagaleen dubbisi» bani, ykn gara Ingiliffaatti jijjiiri.</p></details>' +
        (err ? '<span id="sj-mode-err" class="dm-err"><span class="dm-vh">Error: </span>' + esc(err) + '</span>' : '') +
        '<div class="dm-opts">' + MODES.map(function (m, i) {
          return '<label class="dm-opt"><input type="radio" name="mode" value="' + m + '"' + (i === 0 ? ' id="sj-mode-0"' : '') + (home.mode === m ? ' checked' : '') + '>' +
            (m === 'simple' ? '<span class="dm-ico" aria-hidden="true">' + MODE_ICONS[m] + '</span>' : '') + '<span>' + T('m_' + m) + '</span></label>';
        }).join('') + '</div></fieldset>' +
        '<div class="dm-tools"><button type="button" class="dm-btn" id="sj-listen"><span id="sj-listen-t">' + T('listenQ') + '</span></button></div>' +
        '<p class="dm-status" id="sj-mode-status" role="status" aria-live="polite"></p>' +
        '<div class="dm-actions"><button type="submit" class="dm-btn dm-primary">' + T('cont') + '</button></div></form>';
    }
    view.innerHTML = '<div class="sj-split">' +
      // Generic on purpose: the module can be installed by any organisation, not only ALX
      '<section class="sj-split-art" aria-labelledby="sj-art-h">' +
        '<h1 id="sj-art-h">' + T('artTitle') + '</h1><p>' + T('artText') + '</p>' +
        '<ul class="sj-expect"><li>' + T('ex1') + '</li><li>' + T('ex2') + '</li><li>' + T('ex3') + '</li></ul></section>' +
      '<section class="sj-split-form dm" aria-labelledby="sj-step-h">' + right + '</section></div>';
    if (signedIn()) view.querySelector('.sj-split-form').removeAttribute('aria-labelledby');
    var form = document.getElementById('sj-mode');
    if (form) {
      form.onchange = function (e) { if (e.target.name === 'mode') home.mode = e.target.value; };
      form.onsubmit = function (e) {
        e.preventDefault();
        var c = form.querySelector('input[name=mode]:checked');
        if (!c) { home.error = T('errMode'); homePage(); document.getElementById('sj-mode-errors').focus(); return; }
        D.stopSpeaking();
        home.error = ''; home.mode = c.value; home.step = 'account';
        try { history.pushState({ step: 'account' }, '', 'index.html?step=account'); } catch (x) {}
        remember(); // so "Back" from sign-up or log in returns to this step
        D.setPrefs(D.prefsForMode(c.value)); // re-draws this page (now step 2) through the prefs listener
        focusStep();
      };
      var errLink = view.querySelector('#sj-mode-errors a');
      if (errLink) errLink.onclick = function (e) { e.preventDefault(); document.getElementById('sj-mode-0').focus(); };
      document.getElementById('sj-listen').onclick = function () {
        if (D.player.state !== 'idle' && D.player.owner === homeAudio) { D.stopSpeaking(); return; }
        var items = [{ key: 'home-question', text: T('modeTitle') + ' ' + T('modeHint') }].concat(MODES.map(function (m) { return { key: 'welcome-option-' + m.replace('_', '-'), text: T('m_' + m) }; }));
        D.player.play(items, lang(), homeAudio);
      };
      listenLabel();
    }
    var ch = document.getElementById('sj-change');
    if (ch) ch.onclick = function () { home.step = 'mode'; try { history.pushState({ step: 'mode' }, '', 'index.html'); } catch (x) {} homePage(); focusStep(); setSummary(homeSummary(), true); };
  }
  function focusStep() { var h = document.getElementById('sj-step-h'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }
  function listenLabel() {
    var t = document.getElementById('sj-listen-t');
    if (t) t.textContent = T(D.player.state !== 'idle' && D.player.owner === homeAudio ? 'stopAudio' : 'listenQ');
  }
  D.player.on(listenLabel);
  window.addEventListener('popstate', function () {
    if (page !== 'home') return;
    home.step = new URLSearchParams(location.search).get('step') === 'account' ? 'account' : 'mode';
    homePage(); focusStep();
  });

  /* Simulated log-in (WCAG 3.3.8): no password to remember, no puzzle, no time limit; the code can be pasted or
     filled in by the phone (autocomplete="one-time-code"). Clearly labelled as simulated. */
  var login = { step: 'phone', phone: '', code: '', error: '' };
  function digits(s) { var d = String(s || '').replace(/\D/g, ''); return d.indexOf('251') === 0 ? '0' + d.slice(3) : d; }
  function loginPage() {
    var err = login.error, field = login.step === 'phone' ? 'sj-phone' : 'sj-code';
    var h = backLink() + '<div class="form-wrap"><h1>' + T('loginTitle') + '</h1>' +
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

  /* Where the learner came from, in this tab, so Settings and Log in can offer "Back to …". (The browser's referrer is
     not available: our security headers send none.) */
  var TRAIL = 'sj-trail';
  function trail() { try { return JSON.parse(sessionStorage.getItem(TRAIL) || '[]'); } catch (e) { return []; } }
  function remember() {
    var here = { href: location.pathname.split('/').pop() + location.search, page: page }, t = trail();
    if (!here.href) here.href = 'index.html';
    if (!t.length || t[t.length - 1].href !== here.href) t.push(here);
    try { sessionStorage.setItem(TRAIL, JSON.stringify(t.slice(-8))); } catch (e) {}
  }
  function backTarget() {
    var t = trail();
    // Settings never sends the learner "back" to Log in (that would loop: settings -> log in -> settings -> ...)
    var skip = page === 'settings' ? ['settings', 'login'] : [page];
    for (var i = t.length - 1; i >= 0; i--) if (skip.indexOf(t[i].page) === -1) return t[i];
    return signedIn() ? { href: 'dashboard.html', page: 'dashboard' } : { href: 'index.html', page: 'home' };
  }
  function backLink() {
    var b = backTarget();
    return '<p class="sj-back"><a href="' + esc(b.href) + '"><span aria-hidden="true">← </span>' + T('backTo', { page: T('p_' + b.page) }) + '</a></p>';
  }
  function settingsExtras() { // "Back to …" above, "Done: back to …" below; redrawn when the language changes
    var top = document.getElementById('sj-set-back'), bottom = document.getElementById('sj-set-done'), b = backTarget();
    if (top) top.innerHTML = backLink();
    if (bottom) bottom.innerHTML = '<p class="muted">' + T('setSavedNote') + '</p><p class="actions"><a class="btn primary big" href="' + esc(b.href) + '">' + T('doneBack', { page: T('p_' + b.page) }) + '</a></p>';
  }
  function notice(msg) {
    var n = document.getElementById('sj-note');
    if (!n) { n = document.createElement('p'); n.id = 'sj-note'; n.className = 'notice'; n.setAttribute('role', 'status'); view.parentNode.insertBefore(n, view); }
    n.textContent = ''; setTimeout(function () { n.textContent = msg; }, 80);
  }
  function renderPage(first) {
    view = document.getElementById('sj-view');
    // ALX's own dashboard content is only for a logged-in learner
    Array.prototype.forEach.call(document.querySelectorAll('.sj-alx, .sj-alx-dialogs'), function (el) { el.hidden = !signedIn(); });
    H.backUrl = backTarget().href; // "Back" on a form's first question returns to where the learner came from
    if (PROTECTED.indexOf(page) !== -1 && !signedIn()) { title('needLogin'); needLogin(); }
    else (PAGES_RENDER[page] || PAGES_RENDER.home)();
    if (!view.querySelector('savanna-onboarding-form')) setSummary(pageSummary(), first);
    if (first) {
      remember();
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
  // After the Support Passport is saved, the next step is the learner's Savanna homepage.
  document.addEventListener('savanna-onboarding:complete', function (e) {
    if (e.detail.form !== 'passport' || page !== 'passport') return;
    setTimeout(function () {
      var slot = document.querySelector('.dm-done-slot');
      if (slot && !slot.querySelector('a[href="dashboard.html"]')) slot.insertAdjacentHTML('beforeend', '<p class="actions"><a class="btn primary" href="dashboard.html">' + T('toDashboard') + '</a></p>');
    }, 0);
  });
  // Language changes come from the header button, any form's language switch, or Settings.
  document.addEventListener('savanna-onboarding:prefs', function () {
    var a = document.activeElement, tog = a && a.getAttribute && a.getAttribute('data-tog');
    var keepMode = page === 'home' && document.getElementById('sj-mode') && a && a.name === 'mode' ? a.value : null;
    frame();
    if (!view.querySelector('savanna-onboarding-form, savanna-onboarding-settings')) renderPage(false);
    else if (page === 'settings') { settingsExtras(); title('settings'); }
    if (langFocus) { langFocus = false; var lbn = document.querySelector('.sj-lang-btn'); if (lbn) lbn.focus(); }
    else if (tog) { var b = document.querySelector('.sj-tog[data-tog="' + tog + '"]'); if (b) b.focus(); }
    else if (keepMode) { var r = view.querySelector('input[name=mode][value="' + keepMode + '"]'); if (r) r.focus(); }
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
