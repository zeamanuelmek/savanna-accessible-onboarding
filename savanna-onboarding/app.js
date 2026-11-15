/* Demo host views: play the role of Savanna / a job platform around the <savanna-onboarding-form> component.
   Used by two hosts:
   - the showroom (showroom.html): developer and test page, with its own hash router (#/signup, #/jobs...);
   - the Savanna journey pages (index.html, signup.html, ...): Savanna's own page frame, one page per step,
     calling window.SavannaDemoHost.render(name, container, arg) with page links instead of hash routes. */
(function () {
  var D = window.SavannaOnboarding, store = D.store, L = D.label;
  // Demo host: Amharic and Afaan Oromo speech through our optional Addis AI reference proxy (api/). Without a key, or
  // without the proxy (static servers, docker compose without --profile addis), the module falls back by itself.
  D.setSpeechProxy('/api');
  var view = document.getElementById('view');
  // Route names stay '#/…' inside the views; a host can map them to its own URLs.
  var linkFor = function (r) { return r; };
  function R(r) { return linkFor(r); }
  function hideHostLang() { var b = document.getElementById('host-lang'); if (b) b.hidden = true; }

  // Pictures (emoji) only with "Simple steps with pictures and big text" (the "Pictures and bigger buttons" setting)
  function pic(e) { return D.prefs().pictures ? '<span aria-hidden="true">' + e + ' </span>' : ''; }
  function lang() { return (store.get('prefs', {}).lang) || 'am'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var TX = {
    en: {
      home: 'Home', join: 'Join', profile: 'My profile', passport: 'Support Passport', jobs: 'Jobs', post: 'Post a job', settings: 'Settings', menu: 'Menu',
      product: 'Savanna Accessible Onboarding Module', brandSub: 'Accessible onboarding',
      foot: 'Demo for the Accessibility Hackathon 2026 (Track 1: accessible onboarding). All data stays in this browser. Sample jobs are fictional. Amharic and Afaan Oromo wording is a draft for native-speaker review.',
      jobsShown: '{n} jobs shown', jobShown: '1 job shown',
      heroTitle: 'Sign up, say what helps you, find work that fits',
      heroText: 'The Savanna Accessible Onboarding Module is one accessible form engine. It asks one question per screen, can read every question aloud, accepts voice answers you can check and fix, and has no time limit. The same engine runs sign-up, the Support Passport, job applications and the employer form.',
      start: 'Start: join Savanna', cards: 'What you can try',
      c1: 'Join, with any ID or none', c1t: 'Fayda, kebele ID, passport, refugee ID, another document, or "refer me" through a partner. Partner staff can also register a learner with their consent.',
      c2: 'Support Passport', c2t: 'Tell us what helps you learn and work. It stays on your phone, and you choose who sees it.',
      c3: 'Find jobs privately', c3t: 'Filter jobs by the support you need. The filter runs on your phone.',
      c4: 'Post a job', c4t: 'Employers tick the support a job offers, using the same list. The job is published in the schema.org JobPosting standard.',
      reset: 'Clear all demo data on this phone', resetDone: 'All demo data on this phone was cleared.',
      jobsTitle: 'Jobs', filterAll: 'Only show jobs that offer all the support I need',
      filterNote: 'This uses your Support Passport on this phone only. Employers see it only if you choose to share it when you apply.',
      noPassport: 'Create your Support Passport to see which jobs offer the support you need.',
      makePassport: 'Create my Support Passport', offers: 'Support this job offers', match: 'Offers {k} of the {n} kinds of support you chose',
      listen: 'Listen to this job', stopListening: 'Stop listening', readAll: 'Read all my answers', apply: 'Apply', sample: 'Sample job (demo data)', none: 'No jobs match all of your support needs yet. Turn the filter off to see all jobs.',
      myPassport: 'My Support Passport', edit: 'Change my Support Passport', del: 'Delete my Support Passport', deleted: 'Your Support Passport was deleted.',
      onlyYou: 'Only you can see this. It is stored on this phone.', nothing: 'You chose not to share anything for now.',
      nextPassport: 'Next: tell us what helps you (optional)', nextJobs: 'Find jobs', level: 'Your ID status:',
      lv_no_id_yet: 'You do not need an ID to start learning. You can add one later in My profile, if you want to.', addId: 'Add your ID (optional)', changeId: 'Change my ID details',
      lv_partner_referral_pending: 'A partner organisation will contact you to confirm who you are. You can start learning now.',
      lv_document_number_recorded: 'We keep the number you gave. You can start learning now.',
      lv_self_declared: 'Your ID is self-declared. You can add the number at any time. You can start learning now.',
      assisted: 'Signed up with help from {org}.',
      handTitle: 'Please hand the phone to the learner now',
      handText: 'The learner checks what was entered and takes over the account. The Support Passport is private: the learner fills it in alone, later.',
      handBtn: 'I am the learner: take over my account',
      takeTitle: 'Take over your account', nothingToTake: 'There is nothing to take over. This account is already yours.',
      takeFirst: 'First, take over your account from the person who helped you. Your Support Passport is private, so only you should fill it in.',
      whoSees: 'Who can see this',
      who_ask: 'Only you. When you apply for a job, we ask you each time. An employer sees your support list only if you say yes for that job.',
      who_trainers: 'You and your trainers at ALX. Employers still see it only if you say yes for a job.',
      allowTrainers: 'Let my ALX trainers see it', stopTrainers: 'Stop sharing with my trainers',
      sharingSaved: 'Saved. Who can see this: {who}',
      trainersDemo: 'Demo: there is no trainer system yet, so nothing is sent to anyone.',
      sharedWith: 'Shared with employers', sharedNone: 'You have not shared it with any employer.',
      sharedOn: 'shared on {date}', withdraw: 'Withdraw', withdrawnOn: 'withdrawn on {date}',
      withdrawDone: 'Withdrawn. This demo has no employer system, so only the copy on this phone changed. A live system must tell the employer to delete it.',
      neverShared: 'What you wrote in your own words stays on this phone and is not shared.',
      ownWords: 'In your own words (only you see this):',
      jsonTitle: 'What other job platforms receive (schema.org JobPosting)', receives: 'What the employer receives',
      notShared: 'Support Passport: not shared', seeJobs: 'See it on the job board', applyFor: 'Applying for:',
      sentTo: 'Your application was sent to {org}', sentJob: 'Job', sharedYes: 'Support Passport: shared', sharedList: 'The employer sees only this list: {list}.',
      sentDemo: 'This is a demo: nothing was actually sent. Your application is kept only on this phone.',
      postedTitle: 'Your job "{title}" is on the job board', postedDemo: 'This is a demo: the job is kept only on this phone. Nothing was sent or published anywhere else.',
      notFound: 'This job was not found.', back: 'Back to jobs',
      noProfile: 'You have not joined yet, so there is no profile on this phone.', joinFirst: 'Join Savanna', backProfile: 'Back to my profile'
    },
    am: {
      home: 'መነሻ', join: 'ይመዝገቡ', profile: 'የእኔ መገለጫ', passport: 'የድጋፍ ፓስፖርት', jobs: 'ሥራዎች', post: 'ሥራ ያስተዋውቁ', settings: 'ቅንብሮች', menu: 'ምናሌ',
      product: 'Savanna Accessible Onboarding Module', brandSub: 'ተደራሽ ምዝገባ',
      foot: 'ለተደራሽነት ሃካቶን 2026 (ትራክ 1፦ ተደራሽ ምዝገባ) የተዘጋጀ ማሳያ። ሁሉም መረጃ በዚህ ብራውዘር ውስጥ ይቆያል። የናሙና ሥራዎቹ ልብ ወለድ ናቸው። የአማርኛው ጽሑፍ በአፍ መፍቻ ተናጋሪ የሚገመገም ረቂቅ ነው።',
      jobsShown: '{n} ሥራዎች ይታያሉ', jobShown: '1 ሥራ ይታያል',
      heroTitle: 'ይመዝገቡ፣ የሚረዳዎትን ይንገሩን፣ የሚስማማዎትን ሥራ ያግኙ',
      heroText: '<span lang="en">Savanna Accessible Onboarding Module</span> አንድ ተደራሽ የቅጽ ሞተር ነው። በአንድ ገጽ አንድ ጥያቄ ይጠይቃል፣ እያንዳንዱን ጥያቄ ጮክ ብሎ ያነባል፣ በድምፅ የሰጡትን መልስ አረጋግጠው እንዲያስተካክሉ ያስችላል፣ የጊዜ ገደብም የለውም። ይኸው ሞተር ምዝገባን፣ የድጋፍ ፓስፖርትን፣ የሥራ ማመልከቻንና የቀጣሪ ቅጽን ያስኬዳል።',
      start: 'ይጀምሩ፦ ሳቫናን ይቀላቀሉ', cards: 'ሊሞክሯቸው የሚችሉ',
      c1: 'በማንኛውም መታወቂያ ወይም ያለ መታወቂያ ይመዝገቡ', c1t: 'ፋይዳ፣ የቀበሌ መታወቂያ፣ ፓስፖርት፣ የስደተኛ መታወቂያ፣ ሌላ ሰነድ ወይም በአጋር ድርጅት በኩል። የአጋር ሠራተኞችም በተማሪው ፈቃድ መመዝገብ ይችላሉ።',
      c2: 'የድጋፍ ፓስፖርት', c2t: 'ለመማርና ለመሥራት የሚረዳዎትን ይንገሩን። በስልክዎ ላይ ይቆያል፤ ማን እንደሚያየው እርስዎ ይወስናሉ።',
      c3: 'ሥራ በምስጢር ይፈልጉ', c3t: 'በሚፈልጉት ድጋፍ ሥራዎችን ያጣሩ። ማጣሪያው በስልክዎ ላይ ይሠራል።',
      c4: 'ሥራ ያስተዋውቁ', c4t: 'ቀጣሪዎች ሥራው የሚሰጠውን ድጋፍ ከተመሳሳይ ዝርዝር ይመርጣሉ።',
      reset: 'በዚህ ስልክ ያለውን የሙከራ መረጃ ሁሉ አጥፋ', resetDone: 'በዚህ ስልክ ያለው የሙከራ መረጃ ሁሉ ተሰርዟል።',
      jobsTitle: 'ሥራዎች', filterAll: 'የሚያስፈልገኝን ድጋፍ ሁሉ የሚሰጡ ሥራዎችን ብቻ አሳይ',
      filterNote: 'ይህ በዚህ ስልክ ላይ ብቻ ያለውን የድጋፍ ፓስፖርትዎን ይጠቀማል። ቀጣሪዎች የሚያዩት ሲያመለክቱ ለማጋራት ከመረጡ ብቻ ነው።',
      noPassport: 'የትኞቹ ሥራዎች የሚፈልጉትን ድጋፍ እንደሚሰጡ ለማየት የድጋፍ ፓስፖርትዎን ይፍጠሩ።',
      makePassport: 'የድጋፍ ፓስፖርቴን ፍጠር', offers: 'ይህ ሥራ የሚሰጣቸው ድጋፎች', match: 'ከመረጧቸው {n} ድጋፎች {k}ቱን ይሰጣል',
      readAll: 'መልሶቼን ሁሉ አንብብልኝ',
      stopListening: 'ማዳመጥ አቁም',
      listen: 'ይህን ሥራ አዳምጥ', apply: 'አመልክት', sample: 'የናሙና ሥራ (የሙከራ መረጃ)', none: 'እስካሁን ሁሉንም የድጋፍ ፍላጎቶችዎን የሚያሟላ ሥራ የለም። ሁሉንም ለማየት ማጣሪያውን ያጥፉ።',
      myPassport: 'የድጋፍ ፓስፖርቴ', edit: 'የድጋፍ ፓስፖርቴን ቀይር', del: 'የድጋፍ ፓስፖርቴን ሰርዝ', deleted: 'የድጋፍ ፓስፖርትዎ ተሰርዟል።',
      onlyYou: 'ይህን ማየት የሚችሉት እርስዎ ብቻ ነዎት። በዚህ ስልክ ላይ ተቀምጧል።', nothing: 'ለአሁን ምንም ላለማጋራት መርጠዋል።',
      nextPassport: 'ቀጣይ፦ የሚረዳዎትን ይንገሩን (አማራጭ)', nextJobs: 'ሥራ ፈልግ', level: 'የመታወቂያዎ ሁኔታ፦',
      lv_no_id_yet: 'መማር ለመጀመር መታወቂያ አያስፈልግዎትም። ከፈለጉ በኋላ በ«የእኔ መገለጫ» ውስጥ መጨመር ይችላሉ።', addId: 'መታወቂያዎን ይጨምሩ (አማራጭ)', changeId: 'የመታወቂያ ዝርዝሬን ቀይር',
      lv_partner_referral_pending: 'ማንነትዎን ለማረጋገጥ አጋር ድርጅት ያገኝዎታል። አሁን መማር መጀመር ይችላሉ።',
      lv_document_number_recorded: 'የሰጡትን ቁጥር እንይዛለን። አሁን መማር መጀመር ይችላሉ።',
      lv_self_declared: 'መታወቂያዎ በራስዎ የተገለጸ ነው። ቁጥሩን በማንኛውም ጊዜ መጨመር ይችላሉ። አሁን መማር መጀመር ይችላሉ።',
      assisted: 'በ{org} እርዳታ ተመዝግበዋል።',
      handTitle: 'እባክዎ አሁን ስልኩን ለተማሪው ይስጡ',
      handText: 'ተማሪው የገባውን ያረጋግጣል፤ መለያውንም ይረከባል። የድጋፍ ፓስፖርቱ የግል ነው፤ ተማሪው በኋላ ብቻውን ይሞላዋል።',
      handBtn: 'እኔ ተማሪው ነኝ፦ መለያዬን ልረከብ',
      takeTitle: 'መለያዎን ይረከቡ', nothingToTake: 'የሚረከቡት ነገር የለም። ይህ መለያ አስቀድሞ የእርስዎ ነው።',
      takeFirst: 'መጀመሪያ መለያዎን ከረዳዎት ሰው ይረከቡ። የድጋፍ ፓስፖርትዎ የግል ስለሆነ መሙላት ያለብዎት እርስዎ ብቻ ነዎት።',
      whoSees: 'ይህን ማን ማየት ይችላል',
      who_ask: 'እርስዎ ብቻ። ለሥራ ሲያመለክቱ በእያንዳንዱ ጊዜ እንጠይቅዎታለን። ቀጣሪ የድጋፍ ዝርዝርዎን የሚያየው ለዚያ ሥራ «አዎ» ካሉ ብቻ ነው።',
      who_trainers: 'እርስዎና በALX ያሉ አሰልጣኞችዎ። ቀጣሪዎች አሁንም የሚያዩት ለአንድ ሥራ «አዎ» ካሉ ብቻ ነው።',
      allowTrainers: 'የALX አሰልጣኞቼ እንዲያዩት ፍቀድ', stopTrainers: 'ከአሰልጣኞቼ ጋር ማጋራት አቁም',
      sharingSaved: 'ተቀምጧል። ይህን ማየት የሚችለው፦ {who}',
      trainersDemo: 'ማሳያ፦ የአሰልጣኝ ሥርዓት ገና የለም፤ ስለዚህ ለማንም ምንም አይላክም።',
      sharedWith: 'ከቀጣሪዎች ጋር የተጋራ', sharedNone: 'ከማንኛውም ቀጣሪ ጋር አላጋሩትም።',
      sharedOn: '{date} ተጋርቷል', withdraw: 'መልስ', withdrawnOn: '{date} ተመልሷል',
      withdrawDone: 'ተመልሷል። ይህ ማሳያ የቀጣሪ ሥርዓት የለውም፤ ስለዚህ የተቀየረው በዚህ ስልክ ያለው ቅጂ ብቻ ነው። እውነተኛ ሥርዓት ቀጣሪው እንዲሰርዘው መንገር አለበት።',
      neverShared: 'በራስዎ ቃላት የጻፉት በዚህ ስልክ ላይ ይቆያል፤ አይጋራም።',
      ownWords: 'በራስዎ ቃላት (እርስዎ ብቻ ያዩታል)፦',
      jsonTitle: 'ሌሎች የሥራ ጣቢያዎች የሚቀበሉት (schema.org JobPosting)', receives: 'ቀጣሪው የሚቀበለው',
      notShared: 'የድጋፍ ፓስፖርት፦ አልተጋራም', seeJobs: 'በሥራ ገጹ ላይ ይመልከቱት', applyFor: 'የሚያመለክቱበት፦',
      sentTo: 'ማመልከቻዎ ለ{org} ተልኳል', sentJob: 'ሥራ', sharedYes: 'የድጋፍ ፓስፖርት፦ ተጋርቷል', sharedList: 'ቀጣሪው የሚያየው ይህን ዝርዝር ብቻ ነው፦ {list}።',
      sentDemo: 'ይህ ማሳያ ነው፤ በእውነት ምንም አልተላከም። ማመልከቻዎ በዚህ ስልክ ላይ ብቻ ይቀመጣል።',
      postedTitle: '«{title}» የተባለው ሥራዎ በሥራ ገጹ ላይ ነው', postedDemo: 'ይህ ማሳያ ነው፤ ሥራው በዚህ ስልክ ላይ ብቻ ይቀመጣል። ወደ ሌላ ቦታ ምንም አልተላከም፣ አልታተመም።',
      notFound: 'ይህ ሥራ አልተገኘም።', back: 'ወደ ሥራዎች ተመለስ',
      noProfile: 'እስካሁን አልተመዘገቡም፤ ስለዚህ በዚህ ስልክ ላይ መገለጫ የለም።', joinFirst: 'ሳቫናን ይቀላቀሉ', backProfile: 'ወደ መገለጫዬ ተመለስ'
    },
    // Afaan Oromo: DRAFT for review by a native speaker (team review planned)
    om: {
      home: 'Fuula jalqabaa',
      join: 'Galmaa\'i',
      profile: 'Piroofaayilii koo',
      passport: 'Paaspoortii Deeggarsaa',
      jobs: 'Hojiiwwan',
      post: 'Hojii beeksisi',
      settings: 'Qindaa\'ina',
      menu: 'Baafata',
      product: 'Savanna Accessible Onboarding Module',
      brandSub: 'Galmee hunda dandeessisu',
      foot: 'Agarsiisa Hakaatoonii Dhaqqabummaa 2026 (Kutaa 1: galmee hunda dandeessisu). Odeeffannoon hundi biraawuzara kana keessa hafa. Hojiiwwan fakkeenyaa dhugaa miti. Barreeffamni Afaan Amaaraa fi Afaan Oromoo dubbattoota afaanichaatiin kan ilaalamu dha.',
      jobsShown: 'Hojiiwwan {n} agarsiifamaniiru',
      jobShown: 'Hojiin 1 agarsiifameera',
      heroTitle: 'Galmaa\'i, waan si gargaaru himi, hojii siif ta\'u argadhu',
      heroText: 'Savanna Accessible Onboarding Module maashina unka tokko kan hunda dandeessisu dha. Iskiriinii tokko irratti gaaffii tokko gaafata, gaaffii hunda sagaleen dubbisuu danda\'a, deebii sagalee kan ilaaltee sirreessitu ni fudhata, daangaa yeroo hin qabu. Maashinni kun galmee, Paaspoortii Deeggarsaa, iyyannoo hojii fi unka qacaraa hojjechiisa.',
      start: 'Jalqabi: Savanna\'tti galmaa\'i',
      cards: 'Wantoota yaaluu dandeessu',
      c1: 'Eenyummaa kamiin ykn malee galmaa\'i',
      c1t: 'Faayda, waraqaa eenyummaa ganda, paaspoortii, eenyummaa baqataa, sanada biraa, ykn michuu karaa "na ergi". Hojjettoonni michuu hayyama barataatiin barataa galmeessuus ni danda\'u.',
      c2: 'Paaspoortii Deeggarsaa',
      c2t: 'Waan barachuu fi hojjechuuf si gargaaru nutti himi. Bilbila kee irra tura, eenyu akka argu ati filatta.',
      c3: 'Dhuunfaan hojii barbaadi',
      c3t: 'Hojiiwwan deeggarsa barbaadduun calali. Calaltichi bilbila kee irratti hojjeta.',
      c4: 'Hojii beeksisi',
      c4t: 'Qacartoonni deeggarsa hojiin tokko kennu tarree walfakkaataa sanaan mallattoo godhu. Hojichi akkaataa schema.org JobPosting tiin maxxanfama.',
      reset: 'Odeeffannoo agarsiisaa bilbila kana irra jiru hunda haqi',
      resetDone: 'Odeeffannoon agarsiisaa bilbila kana irra ture hundi haqameera.',
      jobsTitle: 'Hojiiwwan',
      filterAll: 'Hojiiwwan deeggarsa ani barbaadu hunda kennan qofa agarsiisi',
      filterNote: 'Kun Paaspoortii Deeggarsaa kee bilbila kana irra qofa jiru fayyadama. Qacartoonni kan argan yoo yeroo iyyattu qooduu filatte qofa.',
      noPassport: 'Hojiiwwan deeggarsa barbaaddu kennan ilaaluuf Paaspoortii Deeggarsaa kee uumi.',
      makePassport: 'Paaspoortii Deeggarsaa koo uumi',
      offers: 'Deeggarsa hojiin kun kennu',
      match: 'Gosa deeggarsaa ati filatte {n} keessaa {k} kenna',
      readAll: 'Deebii koo hunda naaf dubbisi',
      stopListening: 'Dhaggeeffachuu dhaabi',
      listen: 'Hojii kana dhaggeeffadhu',
      apply: 'Iyyadhu',
      sample: 'Hojii fakkeenyaa (odeeffannoo agarsiisaa)',
      none: 'Ammaaf hojiin fedhii deeggarsaa kee hunda guutu hin jiru. Hojiiwwan hunda ilaaluuf calaltii cufi.',
      myPassport: 'Paaspoortii Deeggarsaa koo',
      edit: 'Paaspoortii Deeggarsaa koo jijjiiri',
      del: 'Paaspoortii Deeggarsaa koo haqi',
      deleted: 'Paaspoortiin Deeggarsaa kee haqameera.',
      onlyYou: 'Kana kan argu ati qofa. Bilbila kana irratti kuufameera.',
      nothing: 'Ammaaf homaa qooduu dhiisuu filatteetta.',
      nextPassport: 'Itti aanee: waan si gargaaru nutti himi (dirqama miti)',
      nextJobs: 'Hojii barbaadi',
      level: 'Haala eenyummaa keetii:',
      lv_no_id_yet: 'Barachuu jalqabuuf eenyummaan si hin barbaachisu. Yoo barbaadde booda «Piroofaayilii koo» keessatti dabaluu dandeessa.', addId: 'Eenyummaa kee dabali (dirqama miti)', changeId: 'Odeeffannoo eenyummaa koo jijjiiri',
      lv_partner_referral_pending: 'Dhaabbanni michuu eenyummaa kee mirkaneessuuf si quunnama. Amma barachuu jalqabuu dandeessa.',
      lv_document_number_recorded: 'Lakkoofsa ati kennite ni qabanna. Amma barachuu jalqabuu dandeessa.',
      lv_self_declared: 'Eenyummaan kee ofiin kan himame dha. Yeroo kamiyyuu lakkoofsa dabaluu dandeessa. Amma barachuu jalqabuu dandeessa.',
      assisted: 'Gargaarsa {org} tiin galmaa\'e.',
      handTitle: 'Maaloo amma bilbila barataatti kenni',
      handText: 'Barataan waan galfame ilaalee herrega fudhata. Paaspoortiin Deeggarsaa dhuunfaa dha: barataan booda kophaa isaa guuta.',
      handBtn: 'Ani barataa dha: herrega koo fudhadhu',
      takeTitle: 'Herrega kee fudhadhu',
      nothingToTake: 'Wanti fudhatamu hin jiru. Herregni kun duraanuu kan kee dha.',
      takeFirst: 'Dura herrega kee nama si gargaare irraa fudhadhu. Paaspoortiin Deeggarsaa kee dhuunfaa dha, kanaaf kan guutu ati qofa.',
      whoSees: 'Eenyutu kana arga',
      who_ask: 'Ati qofa. Yeroo hojii iyyattu, yeroo hunda si gaafanna. Qacaraan tarree deeggarsaa kee kan argu yoo hojii sanaaf eeyyee jette qofa.',
      who_trainers: 'Atii fi leenjistoota kee ALX. Qacartoonni amma iyyuu kan argan yoo hojii tokkoof eeyyee jette qofa.',
      allowTrainers: 'Leenjistoonni koo ALX akka argan hayyami',
      stopTrainers: 'Leenjistoota kootiif qooduu dhaabi',
      sharingSaved: 'Kuufameera. Eenyutu arga: {who}',
      trainersDemo: 'Agarsiisa: ammaaf sirni leenjistootaa hin jiru, kanaaf namatti homtuu hin ergamu.',
      sharedWith: 'Qacartootaaf qoodame',
      sharedNone: 'Qacaraa kamiifuu hin qoodne.',
      sharedOn: 'guyyaa {date} qoodame',
      withdraw: 'Deebisi',
      withdrawnOn: 'guyyaa {date} deebi\'e',
      withdrawDone: 'Deebi\'eera. Agarsiisni kun sirna qacaraa hin qabu, kanaaf kan jijjiirame garagalcha bilbila kana irra jiru qofa. Sirni dhugaa qacaraan akka haqu itti himuu qaba.',
      neverShared: 'Waan jechoota keetiin barreessite bilbila kana irra tura, hin qoodamu.',
      ownWords: 'Jechoota keetiin (kan argu ati qofa):',
      jsonTitle: 'Waan waltajjiiwwan hojii biroo argatan (schema.org JobPosting)',
      receives: 'Waan qacaraan argatu',
      notShared: 'Paaspoortii Deeggarsaa: hin qoodamne',
      sentTo: 'Iyyannoon kee {org} tiif ergameera', sentJob: 'Hojii', sharedYes: 'Paaspoortii Deeggarsaa: qoodameera', sharedList: 'Qacaraan tarree kana qofa arga: {list}.',
      sentDemo: 'Kun agarsiisa qofa: dhugumaan wanti tokkollee hin ergamne. Iyyannoon kee bilbila kana irra qofa kuufama.',
      postedTitle: 'Hojiin kee "{title}" boordii hojii irra jira', postedDemo: 'Kun agarsiisa qofa: hojichi bilbila kana irra qofa kuufama. Bakka biraatti wanti tokkollee hin ergamne, hin maxxanfamne.',
      seeJobs: 'Boordii hojii irratti ilaali',
      applyFor: 'Kan iyyattu:',
      notFound: 'Hojiin kun hin argamne.',
      back: 'Gara hojiiwwaniitti deebi\'i',
      noProfile: 'Ammaaf hin galmoofne, kanaaf bilbila kana irratti piroofaayiliin hin jiru.',
      joinFirst: 'Savanna\'tti galmaa\'i',
      backProfile: 'Gara piroofaayilii kootti deebi\'i'
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
  function jobs() { return store.get('jobs', []).concat(SAMPLE); }
  var MODE = { onsite: { en: 'At the office', am: 'በቢሮ', om: 'Waajjira keessatti' }, remote: { en: 'From home', am: 'ከቤት', om: 'Mana irraa' }, hybrid: { en: 'Office and home', am: 'በቢሮና በቤት', om: 'Waajjiraa fi mana' } };

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
    var items = [['#/', 'home'], ['#/signup', 'join'], ['#/profile', 'profile'], ['#/passport', 'passport'], ['#/jobs', 'jobs'], ['#/employer', 'post'], ['#/settings', 'settings']];
    document.getElementById('nav').innerHTML = items.map(function (i) {
      var cur = route === i[0] || (i[0] === '#/jobs' && route.indexOf('#/apply') === 0);
      return '<li><a href="' + i[0] + '"' + (cur ? ' aria-current="page"' : '') + '>' + T(i[1]) + '</a></li>';
    }).join('');
    document.documentElement.lang = lang();
    document.getElementById('menu-label').textContent = T('menu');
    document.getElementById('brand-sub').textContent = T('brandSub');
    document.getElementById('foot-text').textContent = T('foot');
  }

  var SHOWROOM = !!document.getElementById('nav');
  /* ---- mobile menu: a disclosure button; links stay a plain list for screen readers ---- */
  if (SHOWROOM) (function () {
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
  })();

  // Every host form goes through the module's public mount() API.
  function mountForm(formId, instance, onDone) {
    view.innerHTML = '<div class="form-wrap"></div>';
    return D.mount(view.firstChild, { form: formId, instance: instance || null, welcome: formId === 'signup' && API_HOST.signupWelcome, backUrl: API_HOST.backUrl || null, onComplete: onDone }).element;
  }

  function home() {
    view.innerHTML =
      '<section class="hero"><p class="eyebrow" lang="en">Accessibility Hackathon 2026 · Track 1</p><h1 tabindex="-1">' + T('heroTitle') + '</h1><p class="lead">' + T('heroText') + '</p>' +
      '<p class="actions"><a class="btn primary big" href="' + R('#/signup') + '">' + T('start') + ' →</a> <a class="btn big ghost" href="' + R('#/settings') + '">⚙️ ' + T('settings') + '</a></p></section>' +
      '<h2>' + T('cards') + '</h2><ul class="cards">' +
      [['#/signup', 'c1', '🪪'], ['#/passport', 'c2', '🔒'], ['#/jobs', 'c3', '💼'], ['#/employer', 'c4', '🏢']].map(function (c) {
        return '<li class="card">' + (D.prefs().pictures ? '<span class="card-ico" aria-hidden="true">' + c[2] + '</span>' : '') + '<h3><a href="' + c[0] + '">' + T(c[1]) + '</a></h3><p>' + T(c[1] + 't') + '</p></li>';
      }).join('') + '</ul>' +
      '<p><button type="button" class="btn" id="reset">' + T('reset') + '</button></p><p role="status" id="reset-status"></p>';
    document.getElementById('reset').addEventListener('click', function () {
      store.keys().forEach(function (k) { if (k !== 'prefs') store.del(k); });
      document.getElementById('reset-status').textContent = T('resetDone');
    });
    focusH1();
  }

  function signup() {
    mountForm('signup', null, function (d, slot) {
      var a = d.answers;
      var partner = a.filler === 'partner';
      // No ID at sign-up: the learner may add one later ("Add your ID (optional)").
      // The staff member's name is kept only until the learner takes over the account.
      var p = { name: a.name, phone: a.phone, lang: d.lang, id_route: null, assurance_level: 'no_id_yet',
        referral_partner: null, registered_by: partner ? { org: a.partner_org, staff: a.staff_name } : null,
        takeover_pending: partner, dob: a.dob || null };
      store.set('profile', p);
      if (!slot) return;
      if (partner) slot.innerHTML = statusPanel(p) + '<div class="notice handover"><h2>' + T('handTitle') + '</h2><p>' + T('handText') + '</p>' +
        '<p class="actions"><a class="btn primary" href="' + R('#/takeover') + '">' + T('handBtn') + '</a></p></div>';
      else slot.innerHTML = statusPanel(p, true) +
        '<p class="actions"><a class="btn primary" href="' + R('#/passport') + '">' + T('nextPassport') + '</a> <a class="btn" href="' + R('#/jobs') + '">' + T('nextJobs') + '</a></p>';
    });
  }

  /* Honest ID status from the module (SavannaOnboarding.trustLevel): never "verified". */
  function assurance(a, old) {
    var lv = D.trustLevel(a);
    // profile update with the same ID and no new number: keep "number recorded"
    if (lv === 'self_declared' && old && old.id_route === a.id_route && old.assurance_level === 'document_number_recorded') return old.assurance_level;
    return lv;
  }
  var ORG = { aaapd: 'AAAPD', tib: 'Tomorrow is Better' };
  function statusPanel(p, idLink) {
    var lv = D.TRUST[p.assurance_level] ? p.assurance_level : 'no_id_yet';
    return '<div class="notice"><p><strong>' + T('level') + '</strong> <span class="badge">' + esc(L(D.TRUST[lv], lang())) + '</span></p>' +
      '<p>' + T('lv_' + lv) + '</p>' +
      (idLink ? '<p class="mb-0"><a class="btn" href="' + R('#/identity') + '">' + T(p.id_route ? 'changeId' : 'addId') + '</a></p>' : '') +
      (p.registered_by ? '<p>' + T('assisted', { org: esc(ORG[p.registered_by.org] || ({ am: 'አጋር ድርጅት', om: 'dhaabbata michuu' }[lang()] || 'a partner organisation')) }) + '</p>' : '') + '</div>';
  }

  function profileView() {
    var old = store.get('profile', null);
    if (!old) {
      view.innerHTML = '<h1 tabindex="-1">' + T('profile') + '</h1><p>' + T('noProfile') + '</p><p><a class="btn primary" href="' + R('#/signup') + '">' + T('joinFirst') + '</a></p>';
      focusH1(); return;
    }
    mountForm('profile', null, function (d, slot) {
      var a = d.answers, p = {};
      Object.keys(old).forEach(function (k) { p[k] = old[k]; });
      p.name = a.name; p.full_name = a.full_name || null; p.phone = a.phone; p.dob = a.dob || null;
      p.updated = new Date().toISOString();
      store.set('profile', p);
      if (slot) slot.innerHTML = statusPanel(p, true) + '<p class="actions"><a class="btn" href="' + R('#/jobs') + '">' + T('nextJobs') + '</a></p>';
    });
  }

  /* "Add your ID (optional)": the six ID routes, honest badges and the partner-referral path. Not part of sign-up. */
  function identityView() {
    var old = store.get('profile', null);
    if (!old) {
      view.innerHTML = '<h1 tabindex="-1">' + T('addId') + '</h1><p>' + T('noProfile') + '</p><p><a class="btn primary" href="' + R('#/signup') + '">' + T('joinFirst') + '</a></p>';
      focusH1(); return;
    }
    mountForm('identity', null, function (d, slot) {
      var a = d.answers, p = {};
      Object.keys(old).forEach(function (k) { p[k] = old[k]; });
      // The ID number itself is not kept by this demo host (data minimisation); only the status it gives.
      p.id_route = a.id_route; p.referral_partner = a.referral_partner || null;
      p.assurance_level = assurance(a, old);
      p.updated = new Date().toISOString();
      store.set('profile', p);
      if (slot) slot.innerHTML = statusPanel(p) + '<p class="actions"><a class="btn primary" href="' + R('#/profile') + '">' + T('backProfile') + '</a> <a class="btn" href="' + R('#/jobs') + '">' + T('nextJobs') + '</a></p>';
    });
  }

  /* Learner takeover after partner sign-up: the learner checks the details alone; the staff name is then removed. */
  function takeoverView() {
    var old = store.get('profile', null);
    if (!old || !old.takeover_pending) {
      view.innerHTML = '<h1 tabindex="-1">' + T('takeTitle') + '</h1><p>' + T('nothingToTake') + '</p><p><a class="btn" href="' + R('#/profile') + '">' + T('profile') + '</a></p>';
      focusH1(); return;
    }
    mountForm('takeover', null, function (d, slot) {
      var a = d.answers, p = {};
      Object.keys(old).forEach(function (k) { p[k] = old[k]; });
      p.name = a.name; p.phone = a.phone; p.dob = a.dob || null;
      p.registered_by = old.registered_by ? { org: old.registered_by.org } : null; // staff name removed
      p.takeover_pending = false; p.taken_over = new Date().toISOString();
      store.set('profile', p);
      if (slot) slot.innerHTML = statusPanel(p, true) +
        '<p class="actions"><a class="btn primary" href="' + R('#/passport') + '">' + T('nextPassport') + '</a> <a class="btn" href="' + R('#/jobs') + '">' + T('nextJobs') + '</a></p>';
    });
  }

  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return iso.slice(0, 10); } }
  // a status message for screen readers; read aloud too when automatic reading is on (the shared player)
  function sayStatus(id, msg) {
    setTimeout(function () { var s = document.getElementById(id); if (s) { s.textContent = ''; s.textContent = msg; } }, 80);
    if (D.readingOn()) D.player.play([{ key: null, text: msg, lang: lang() }], lang(), { audioIssue: function () {} });
  }

  function passportView() {
    var p = store.get('passport', null), prof = store.get('profile', null);
    if (prof && prof.takeover_pending) { // a helper may still be there: the Support Passport is for the learner alone
      view.innerHTML = '<h1 tabindex="-1">' + T('myPassport') + '</h1><div class="notice"><p>' + T('takeFirst') + '</p><p><a class="btn primary" href="' + R('#/takeover') + '">' + T('handBtn') + '</a></p></div>';
      focusH1(); return;
    }
    if (p && !window.__editPassport) {
      var list = (p.needs || []), sharing = p.sharing === 'trainers' ? 'trainers' : 'ask';
      var shared = store.get('applications', []).filter(function (x) { return x.packet && (x.packet.supportThatHelps || x.withdrawn); });
      view.innerHTML = '<h1 tabindex="-1">' + T('myPassport') + '</h1><div id="pp-answers">' +
        (list.length ? '<ul class="needs">' + list.map(function (n) { return '<li><span aria-hidden="true">' + needIcon(n) + '</span> ' + esc(needLabel(n)) + '</li>'; }).join('') + '</ul>' : '<p>' + T('nothing') + '</p>') +
        (p.other_need ? '<p><strong>' + T('ownWords') + '</strong> ' + esc(p.other_need) + '</p>' : '') + '</div>' +
        (list.length || p.other_need ? readAllButton('#pp-answers') : '') +
        '<section class="card-plain" aria-labelledby="who-h"><h2 id="who-h">' + T('whoSees') + '</h2><p>' + pic('🔒') + T('who_' + sharing) + '</p>' +
        '<p class="muted">' + T('neverShared') + '</p>' +
        '<p><button type="button" class="btn" id="sharing">' + T(sharing === 'trainers' ? 'stopTrainers' : 'allowTrainers') + '</button></p>' +
        (sharing === 'trainers' ? '<p class="muted">' + T('trainersDemo') + '</p>' : '') + '</section>' +
        '<section class="card-plain" aria-labelledby="shared-h"><h2 id="shared-h">' + T('sharedWith') + '</h2>' +
        (shared.length ? '<ul class="plain">' + shared.map(function (x) {
          var en = x.packet.sample && lang() !== 'en' ? ' lang="en"' : '';
          return '<li><span' + en + '>' + esc(x.packet.job) + ' · ' + esc(x.packet.employer) + '</span>: ' +
            (x.withdrawn ? T('withdrawnOn', { date: fmtDate(x.withdrawn) }) : T('sharedOn', { date: fmtDate(x.at) }) +
              ' <button type="button" class="btn small" data-withdraw="' + esc(x.at) + '">' + T('withdraw') + '<span class="vh"' + en + '> ' + esc(x.packet.job) + '</span></button>') + '</li>';
        }).join('') + '</ul>' : '<p>' + T('sharedNone') + '</p>') + '</section>' +
        '<p class="actions"><button type="button" class="btn primary" id="edit">' + T('edit') + '</button> <a class="btn" href="' + R('#/jobs') + '">' + T('nextJobs') + '</a> <button type="button" class="btn danger" id="del">' + T('del') + '</button></p><p role="status" id="pp-status"></p>';
      document.getElementById('edit').onclick = function () { window.__editPassport = true; hideHostLang(); passportView(); };
      document.getElementById('del').onclick = function () { store.del('passport'); window.__editPassport = false; passportView(); sayStatus('pp-status', T('deleted')); };
      document.getElementById('sharing').onclick = function () {
        var next = sharing === 'trainers' ? 'ask' : 'trainers';
        p.sharing = next; p.updated = new Date().toISOString(); store.set('passport', p);
        passportView();
        var b = document.getElementById('sharing'); if (b) b.focus();
        sayStatus('pp-status', T('sharingSaved', { who: T('who_' + next) }));
      };
      view.querySelectorAll('[data-withdraw]').forEach(function (b) {
        b.onclick = function () {
          var apps = store.get('applications', []);
          apps.forEach(function (x) { if (x.at === b.getAttribute('data-withdraw')) { delete x.packet.supportThatHelps; x.withdrawn = new Date().toISOString(); } });
          store.set('applications', apps);
          passportView();
          var h = document.getElementById('shared-h'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
          sayStatus('pp-status', T('withdrawDone'));
        };
      });
      focusH1();
      return;
    }
    hideHostLang();
    mountForm('passport', null, function (d, slot) {
      window.__editPassport = false;
      var a = d.answers;
      store.set('passport', { needs: a.want === 'yes' ? (a.needs || []) : [], other_need: a.other_need || '', sharing: a.sharing || 'ask', updated: new Date().toISOString() });
      if (slot) slot.innerHTML = '<p class="actions"><a class="btn primary" href="' + R('#/jobs') + '">' + T('nextJobs') + '</a></p>';
    });
  }

  function jobsView() {
    var p = store.get('passport', null), needs = (p && p.needs) || [];
    var filterOn = needs.length && store.get('jobFilter', false);
    var list = jobs().map(function (j) { var k = needs.filter(function (n) { return j.offers.indexOf(n) !== -1; }).length; return { j: j, k: k }; });
    if (needs.length) list.sort(function (a, b) { return b.k - a.k; });
    if (filterOn) list = list.filter(function (x) { return x.k === needs.length; });
    var h = '<h1 tabindex="-1">' + T('jobsTitle') + '</h1>';
    if (needs.length) h += '<div class="filter"><label><input type="checkbox" id="flt"' + (filterOn ? ' checked' : '') + '> ' + T('filterAll') + '</label><p class="muted">' + pic('🔒') + T('filterNote') + '</p></div>';
    else h += '<div class="notice"><p>' + T('noPassport') + '</p><p><a class="btn" href="' + R('#/passport') + '">' + T('makePassport') + '</a></p></div>';
    h += '<p role="status" id="jobs-status" class="muted"></p>';
    if (!list.length) h += '<p>' + T('none') + '</p>';
    h += '<ul class="jobs">' + list.map(function (x) {
      var j = x.j, en = j.sample && lang() !== 'en' ? ' lang="en"' : '';
      return '<li class="job"><article aria-labelledby="job-' + j.id + '"><h2 id="job-' + j.id + '"' + en + '>' + esc(j.title) + '</h2>' +
        '<p class="meta"><span' + en + '>' + esc(j.org) + ' · ' + esc(j.location) + '</span> · ' + esc(L(MODE[j.mode], lang())) + (j.sample ? ' · <span class="tag">' + T('sample') + '</span>' : '') + '</p>' +
        '<p' + en + '>' + esc(j.description) + '</p>' +
        (needs.length ? '<p class="match">' + T('match', { k: x.k, n: needs.length }) + '</p>' : '') +
        '<h3>' + T('offers') + '</h3><ul class="needs small">' + j.offers.map(function (o) { return '<li' + (needs.indexOf(o) !== -1 ? ' class="hit"' : '') + '><span aria-hidden="true">' + needIcon(o) + '</span> ' + esc(needLabel(o)) + '</li>'; }).join('') + '</ul>' +
        '<p class="actions"><button type="button" class="btn" data-listen="' + j.id + '" aria-pressed="false">' + pic('🔊') + '<span data-listen-label>' + T('listen') + '</span><span class="vh"' + en + '> ' + esc(j.title) + '</span></button> <a class="btn primary" href="' + R('#/apply/' + j.id) + '">' + T('apply') + '<span class="vh"' + en + '> ' + esc(j.title) + '</span></a></p></article></li>';
    }).join('') + '</ul>';
    h += '<script type="application/ld+json">' + JSON.stringify(jobs().map(jobPostingLd)) /* every job, whatever the private filter shows */.replace(/</g, '\\u003c') + '</' + 'script>';
    view.innerHTML = h;
    // The result count is announced on load and after filtering (status live region, filled after it exists).
    var count = list.length;
    setTimeout(function () { var s = document.getElementById('jobs-status'); if (s) s.textContent = count === 1 ? T('jobShown') : T('jobsShown', { n: count }); }, 60);
    var flt = document.getElementById('flt');
    if (flt) flt.addEventListener('change', function () {
      store.set('jobFilter', flt.checked); jobsView();
      var f = document.getElementById('flt'); if (f) f.focus();
    });
    /* "Listen to this job": the same player as automatic reading (bottom bar "Now reading… Pause · Stop", Escape stops),
       and the same order of sources (recording, Addis AI, the phone's voice). Each part is read in its own language:
       sample jobs are written in English, the labels follow the page. Another job, or leaving the page, stops it. */
    view.querySelectorAll('[data-listen]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-listen'), pl = D.player;
        if (pl.state !== 'idle' && pl.owner && pl.owner.job === id) { D.stopSpeaking(); return; } // "Stop listening"
        var j = jobs().filter(function (x) { return x.id === id; })[0];
        var jl = j.lang || (j.sample ? 'en' : lang()), ul = lang();
        var items = [{ key: null, text: j.title, lang: jl }, { key: null, text: j.org + '. ' + j.location, lang: jl },
          { key: null, text: L(MODE[j.mode], ul), lang: ul }, { key: null, text: j.description, lang: jl },
          { key: null, text: T('offers') + ': ' + j.offers.map(needLabel).join(', '), lang: ul }];
        pl.play(items, ul, { job: id, audioIssue: function (code) {
          var st = document.getElementById('jobs-status');
          if (st && code === 'readFail') { st.textContent = ''; setTimeout(function () { st.textContent = D.label({ en: 'Reading aloud isn\'t available right now. Everything is written on the screen.', am: 'ጮክ ብሎ ማንበብ አሁን አይገኝም። ሁሉም ነገር በማያ ገጹ ላይ ተጽፏል።', om: 'Sagaleen dubbisuun amma hin jiru. Wanti hundi iskiriinii irratti barreeffameera.' }, lang()); }, 50); }
        } });
      });
    });
    syncJobButtons();
    if (!flt) focusH1(); else if (document.activeElement === document.body) focusH1();
  }

  /* "Read all my answers" where answers are listed (confirmations, the Support Passport card): the shared player
     reads the list, each part in its own language (recording, Addis AI, the phone's voice). */
  function readAllButton(target) {
    return '<p class="actions"><button type="button" class="btn" data-read-all="' + target + '">' + pic('🔁') + T('readAll') + '</button></p>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-read-all]');
    if (!b) return;
    var el = document.querySelector(b.getAttribute('data-read-all'));
    if (el) D.player.play(D.itemsFromElement(el, lang()), lang(), { audioIssue: function () {} });
  });
  // the job being read shows "Stop listening" (pressed); the others "Listen to this job"
  function syncJobButtons() {
    var pl = D.player, playing = pl.state !== 'idle' && pl.owner && pl.owner.job;
    document.querySelectorAll('[data-listen]').forEach(function (b) {
      var on = playing === b.getAttribute('data-listen');
      b.setAttribute('aria-pressed', String(!!on));
      var lb = b.querySelector('[data-listen-label]'); if (lb) lb.textContent = T(on ? 'stopListening' : 'listen');
    });
  }
  D.player.on(syncJobButtons);
  window.addEventListener('pagehide', function () { try { D.stopSpeaking(); } catch (e) {} });

  function employer() {
    mountForm('employer', null, function (d, slot) {
      var a = d.answers;
      var job = { id: 'j' + Date.now().toString(36), lang: d.lang, title: a.title, org: a.org, location: a.location, mode: a.mode, offers: a.offers || [], description: a.description, contact: a.contact, datePosted: new Date().toISOString().slice(0, 10) };
      store.set('jobs', [job].concat(store.get('jobs', [])));
      if (!slot) return;
      if (SHOWROOM) slot.innerHTML = '<p class="actions"><a class="btn primary" href="' + R('#/jobs') + '">' + T('seeJobs') + '</a></p>' +
        '<details><summary>' + T('jsonTitle') + '</summary><pre tabindex="0"><code>' + esc(JSON.stringify(jobPostingLd(job), null, 2)) + '</code></pre></details>';
      // Learner and employer pages: a plain confirmation, never raw data (the JSON stays on the developer pages)
      else slot.innerHTML = '<h2>' + T('postedTitle', { title: esc(job.title) }) + '</h2>' + sentList(D.describe('employer', a, lang())) + readAllButton('.dm-done-slot .sj-sent') +
        '<p class="dm-note">' + T('postedDemo') + '</p><p class="actions"><a class="btn primary" href="' + R('#/jobs') + '">' + T('seeJobs') + '</a></p>';
    });
  }

  /** A readable list of answers (label: value), for the plain confirmations on learner and employer pages. */
  function sentList(rows) {
    return '<dl class="dm-review sj-sent">' + rows.map(function (r) {
      return '<div><dt>' + esc(r.label) + '</dt><dd' + (r.lang || '') + '>' + esc(r.value) + '</dd></div>';
    }).join('') + '</dl>';
  }

  function apply(id) {
    var j = jobs().filter(function (x) { return x.id === id; })[0];
    if (!j) { view.innerHTML = '<h1 tabindex="-1">' + T('notFound') + '</h1><p><a href="' + R('#/jobs') + '">' + T('back') + '</a></p>'; focusH1(); return; }
    var el = mountForm('apply', id, function (d, slot) {
      var a = d.answers;
      var packet = { job: j.title, employer: j.org, sample: !!j.sample, name: a.name, phone: a.phone, why: a.why, experience: a.experience, interview: a.interview || [] };
      var support = D.supportForEmployer(a); // empty unless the learner said "share" for this job
      if (support.length) packet.supportThatHelps = support.map(function (n) { return n.label.en; });
      var apps = store.get('applications', []); apps.unshift({ at: new Date().toISOString(), packet: packet }); store.set('applications', apps);
      if (!slot) return;
      var en = j.sample && lang() !== 'en' ? ' lang="en"' : ''; // sample jobs are written in English
      if (SHOWROOM) slot.innerHTML = '<h2>' + T('receives') + '</h2><pre tabindex="0"><code>' + esc(JSON.stringify(packet, null, 2)) + '</code></pre>' +
        (packet.supportThatHelps ? '' : '<p class="muted">' + T('notShared') + '</p>') +
        '<p><a class="btn" href="' + R('#/jobs') + '">' + T('back') + '</a></p>';
      // Learner pages: a plain confirmation of what was sent, never raw data
      else slot.innerHTML = '<h2>' + T('sentTo', { org: '<span' + en + '>' + esc(j.org) + '</span>' }) + '</h2>' +
        sentList([{ label: T('sentJob'), value: j.title, lang: en }].concat(D.describe('apply', a, lang()).filter(function (r) { return r.id !== 'share_passport'; }))) +
        readAllButton('.dm-done-slot .sj-sent') +
        '<p class="sj-shared"><strong>' + T(support.length ? 'sharedYes' : 'notShared') + '</strong>' +
        (support.length ? ' ' + T('sharedList', { list: esc(support.map(function (n) { return D.label(n.label, lang()); }).join('; ')) }) : '') + '</p>' +
        '<p class="dm-note">' + T('sentDemo') + '</p><p class="actions"><a class="btn" href="' + R('#/jobs') + '">' + T('back') + '</a></p>';
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

  var TITLES = { '#/': 'home', '#/signup': 'join', '#/profile': 'profile', '#/identity': 'addId', '#/takeover': 'takeTitle', '#/passport': 'passport', '#/jobs': 'jobs', '#/employer': 'post', '#/settings': 'settings' };
  function route() {
    var r = location.hash || '#/';
    if (r.indexOf('#/') !== 0) return; // in-page anchors such as the skip link
    D.stopSpeaking();
    nav(r);
    // the language button stays visible on every screen: forms have no language choice of their own
    var base = r.indexOf('#/apply/') === 0 ? '#/apply' : r;
    document.title = (base === '#/apply' ? T('apply') : T(TITLES[base] || 'home')) + ' · ' + T('product');
    if (base !== '#/passport') window.__editPassport = false;
    if (r === '#/' || r === '#') home();
    else if (r === '#/signup') signup();
    else if (r === '#/profile') profileView();
    else if (r === '#/identity') identityView();
    else if (r === '#/takeover') takeoverView();
    else if (r === '#/passport') passportView();
    else if (r === '#/jobs') jobsView();
    else if (r === '#/employer') employer();
    else if (base === '#/apply') apply(r.slice('#/apply/'.length));
    else if (r === '#/settings') settingsView();
    else home();
    window.scrollTo(0, 0);
  }

  /* ---- shared views for other hosts (the Savanna journey pages) ---- */
  var VIEWS = { signup: signup, profile: profileView, identity: identityView, takeover: takeoverView, passport: passportView, jobs: jobsView,
    employer: employer, apply: apply, settings: settingsView };
  var API_HOST = window.SavannaDemoHost = {
    // The Savanna journey asks "how would you like to answer?" on its home page, so its sign-up starts at the first question.
    signupWelcome: true,
    // Where "Back" on a form's first screen goes (the Savanna journey sets it; the showroom has none).
    backUrl: null,
    T: T, lang: lang, esc: esc, jobs: jobs, statusPanel: statusPanel,
    setLinks: function (fn) { linkFor = fn; },
    render: function (name, container, arg) { view = container; window.__editPassport = false; VIEWS[name](arg); }
  };
  if (!SHOWROOM) return;

  // The showroom's one language button goes round the three languages: Amharic, English, Afaan Oromo
  function nextLang() { var L = D.languages, i = L.indexOf(lang()); return L[(i + 1) % L.length]; }
  function syncHostLang() { var b = document.getElementById('host-lang'), n = nextLang(); b.textContent = D.languageNames[n]; b.setAttribute('lang', n); }
  // Preferences can change from any component (language switch, Settings): keep the host page in step.
  document.addEventListener('savanna-onboarding:prefs', function () {
    var r = location.hash || '#/';
    nav(r); syncHostLang();
    var formPage = r === '#/signup' || r === '#/employer' || r === '#/settings' || (r === '#/profile' && !!store.get('profile', null)) || (r === '#/takeover' && !!(store.get('profile', {}) || {}).takeover_pending) || r.indexOf('#/apply/') === 0 || (r === '#/passport' && (!store.get('passport', null) || window.__editPassport));
    if (!formPage) { var active = document.activeElement && document.activeElement.id; route(); if (active) { var el = document.getElementById(active); if (el) el.focus(); } }
  });
  document.getElementById('skip').addEventListener('click', function (e) { e.preventDefault(); var m = document.getElementById('main'); m.focus(); });
  document.getElementById('host-lang').addEventListener('click', function () { D.setPrefs({ lang: nextLang() }); });
  syncHostLang();
  // Minimum offline mode (see sw.js): the showroom works without a connection after one visit.
  if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register('sw.js').catch(function () {}); } catch (e) {} }
  window.addEventListener('hashchange', route);
  route();
})();
