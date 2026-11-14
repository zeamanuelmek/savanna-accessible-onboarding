/* Savanna Accessible Onboarding Module: form "recipes". Each form is plain data: the same engine renders all six.
   Amharic wording is a first draft: a native speaker must review it before testing with learners.
   Field flags used here (full list in docs/for-developers.md):
   - sensitive: true      support needs and ID questions. The engine never offers voice input on them, so that data is
                          never sent to a cloud speech service (CLAUDE.md decision 9).
   - clearIfChanged: 'x'  throw this answer away when the answer to field x changes (an ID number belongs to one ID).
   - prefill              fill from the learner's profile or Support Passport, so nothing is asked twice. */
(function () {
  var D = window.SavannaOnboarding;
  // Honest trust badges shown on each ID choice. Nothing is ever "verified".
  var NOT_CHECKED = { en: 'Self-declared · not verified', am: 'በራስ የተገለጸ · አልተረጋገጠም' };
  var ORGS = { aaapd: 'AAAPD', tib: 'Tomorrow is Better', other: { en: 'a partner organisation', am: 'አጋር ድርጅት' } };
  function orgName(v, lang) { var o = ORGS[v] || ORGS.other; return D.label(o, lang); }
  /* Names: speech recognition is unreliable for Ethiopian names, so the learner always checks a spoken name, can ask
     someone to type it, and may use Amharic (Ethiopic) or Latin letters. */
  var NAME = {
    voiceWarning: { en: 'Voice may get names wrong. Please check and correct it.', am: 'ድምፅ ስሞችን ሊሳሳት ይችላል። እባክዎ ያረጋግጡና ያስተካክሉ።' },
    askHelper: {
      button: { en: 'Ask someone to type this for me', am: 'ሌላ ሰው እንዲጽፍልኝ ልጠይቅ' },
      text: { en: 'You can hand the phone to someone you trust. They type your name, then give the phone back. You then check the name and choose Continue.',
        am: 'ስልኩን ለሚያምኑት ሰው መስጠት ይችላሉ። ስምዎን ጽፈው ስልኩን ይመልሱልዎታል። ከዚያ ስሙን አረጋግጠው «ቀጥል»ን ይምረጡ።' }
    },
    validate: function (v) {
      if (!/^[\p{L}\p{M}][\p{L}\p{M}\s'’.\-፡]*$/u.test(String(v).trim())) {
        return { en: 'Use letters only. Amharic or English letters are both fine.', am: 'ፊደላትን ብቻ ይጠቀሙ። የአማርኛም የእንግሊዝኛም ፊደላት ይቻላሉ።' };
      }
      return '';
    }
  };
  function withName(f) { f.voiceWarning = NAME.voiceWarning; f.askHelper = NAME.askHelper; f.validate = NAME.validate; return f; }

  /* 1. SIGN-UP (with ID ladder and partner-assisted mode) */
  D.register('signup', {
    title: { en: 'Join Savanna', am: 'ሳቫናን ይቀላቀሉ' },
    fields: [
      { id: 'filler', type: 'choice', reviewLabel: { en: 'Who filled in this form', am: 'ቅጹን የሞላው' },
        label: { en: 'Who is filling in this form?', am: 'ይህን ቅጽ የሚሞላው ማን ነው?' },
        options: [
          { value: 'self', icon: '🙋', label: { en: 'Me, for myself', am: 'እኔ፣ ለራሴ' }, say: ['me', 'myself', 'እኔ', 'ራሴ'] },
          { value: 'partner', icon: '🤝', label: { en: 'A partner organisation, together with the learner', am: 'አጋር ድርጅት፣ ከተማሪው ጋር' }, say: ['partner', 'organisation', 'አጋር', 'ድርጅት'] }
        ] },
      { id: 'partner_org', type: 'choice', showIf: { field: 'filler', equals: 'partner' },
        label: { en: 'Which organisation are you from?', am: 'ከየትኛው ድርጅት ነዎት?' },
        options: [
          { value: 'aaapd', label: { en: 'AAAPD', am: 'AAAPD (የአዲስ አበባ አካል ጉዳተኞች ማኅበር)' }, say: ['aaapd'] },
          { value: 'tib', label: { en: 'Tomorrow is Better', am: 'Tomorrow is Better' }, say: ['tomorrow'] },
          { value: 'other', label: { en: 'Another organisation', am: 'ሌላ ድርጅት' }, say: ['another', 'other', 'ሌላ'] }
        ] },
      { id: 'staff_name', type: 'text', showIf: { field: 'filler', equals: 'partner' }, autocomplete: 'off',
        label: { en: 'What is your name? (staff member)', am: 'የእርስዎ ስም ማን ነው? (ሠራተኛ)' },
        hint: { en: 'The learner sees your name when they take over the account. After that it is removed; only your organisation is kept.', am: 'ተማሪው መለያውን ሲረከብ ስምዎን ያያል። ከዚያ በኋላ ይሰረዛል፤ የድርጅትዎ ስም ብቻ ይቀመጣል።' } },
      { id: 'learner_consent', type: 'consent', requiredValue: 'yes', showIf: { field: 'filler', equals: 'partner' },
        reviewLabel: { en: 'Learner agreed to partner help', am: 'ተማሪው በአጋር እርዳታ ተስማምቷል' },
        label: { en: 'Learner: do you agree that this person fills in the form with you?', am: 'ተማሪ፦ ይህ ሰው ቅጹን አብሮዎት እንዲሞላ ይስማማሉ?' },
        hint: { en: 'Please read this aloud to the learner. The learner answers by voice or by tapping.', am: 'እባክዎ ይህን ለተማሪው ጮክ ብለው ያንብቡ። ተማሪው በድምፅ ወይም በመንካት ይመልሳል።' },
        options: [
          { value: 'yes', icon: '✅', label: { en: 'Yes, I agree', am: 'አዎ፣ እስማማለሁ' }, say: ['yes', 'agree', 'አዎ', 'እስማማለሁ'] },
          { value: 'no', icon: '✋', label: { en: 'No', am: 'አልስማማም' }, say: ['no', 'አልስማማም'] }
        ] },
      withName({ id: 'name', type: 'text', autocomplete: 'nickname', reviewLabel: { en: 'Name we call you', am: 'የምንጠራዎ ስም' },
        label: { en: 'What should we call you?', am: 'ምን ብለን እንጥራዎ?' },
        hint: { en: 'Amharic or English letters are both fine. You can add your full name later in My profile, if you want to.', am: 'የአማርኛም የእንግሊዝኛም ፊደላት ይቻላሉ። ከፈለጉ ሙሉ ስምዎን በኋላ በ«የእኔ መገለጫ» ውስጥ መጨመር ይችላሉ።' } }),
      { id: 'phone', type: 'tel', autocomplete: 'tel',
        label: { en: 'What is your phone number?', am: 'ስልክ ቁጥርዎ ስንት ነው?' },
        hint: { en: 'We use it only to send you a link to continue. For example 0911 234 567.', am: 'ለመቀጠል ሊንክ ለመላክ ብቻ እንጠቀምበታለን። ለምሳሌ 0911 234 567።' } },
      { id: 'id_route', type: 'choice', sensitive: true, reviewLabel: { en: 'ID', am: 'መታወቂያ' },
        label: { en: 'Which ID do you have?', am: 'የትኛው መታወቂያ አለዎት?' },
        hint: { en: 'Any of these is fine. You can start learning even without an ID. Nobody checks IDs automatically: we record what you tell us.', am: 'ከእነዚህ ማንኛውም ይበቃል። ያለ መታወቂያም መማር መጀመር ይችላሉ። መታወቂያዎች በራስ-ሰር አይረጋገጡም፤ የሚነግሩንን እንመዘግባለን።' },
        options: [
          { value: 'fayda', icon: '🪪', label: { en: 'Fayda national ID', am: 'ፋይዳ ብሔራዊ መታወቂያ' }, say: ['fayda', 'ፋይዳ'], badge: NOT_CHECKED },
          { value: 'kebele', icon: '🏘️', label: { en: 'Kebele ID', am: 'የቀበሌ መታወቂያ' }, say: ['kebele', 'ቀበሌ'], badge: NOT_CHECKED },
          { value: 'passport', icon: '📘', label: { en: 'Passport', am: 'ፓስፖርት' }, say: ['passport', 'ፓስፖርት'], badge: NOT_CHECKED },
          { value: 'refugee', icon: '📄', label: { en: 'Refugee ID or proof of registration (RRS / UNHCR)', am: 'የስደተኛ መታወቂያ ወይም የምዝገባ ማረጋገጫ' }, say: ['refugee', 'ስደተኛ'], badge: NOT_CHECKED },
          { value: 'other', icon: '🗂️', label: { en: 'Another document', am: 'ሌላ ሰነድ' }, say: ['another', 'document', 'ሰነድ'], badge: NOT_CHECKED },
          { value: 'none', icon: '🤝', label: { en: 'I have none of these. Refer me through a partner.', am: 'ምንም የለኝም። በአጋር ድርጅት በኩል ይመዝግቡኝ።' }, say: ['none', 'refer', 'ምንም', 'የለኝም'], badge: D.TRUST.partner_referral_pending }
        ] },
      { id: 'id_number', type: 'text', optional: true, sensitive: true, clearIfChanged: 'id_route', showIf: { field: 'id_route', in: ['fayda', 'kebele', 'passport', 'refugee', 'other'] },
        label: { en: 'What is the number on your ID?', am: 'በመታወቂያዎ ላይ ያለው ቁጥር ስንት ነው?' },
        hint: { en: 'You can skip this and add it later. We never ask for a photo of your ID. If you add the number, your status becomes "Number recorded — not verified".', am: 'ይህን መዝለልና በኋላ መጨመር ይችላሉ። የመታወቂያዎን ፎቶ በፍጹም አንጠይቅም። ቁጥሩን ካስገቡ ሁኔታዎ «ቁጥር ተመዝግቧል — አልተረጋገጠም» ይሆናል።' } },
      { id: 'referral_partner', type: 'choice', sensitive: true, showIf: { field: 'id_route', equals: 'none' },
        label: { en: 'Which organisation can confirm who you are?', am: 'ማንነትዎን የትኛው ድርጅት ሊያረጋግጥ ይችላል?' },
        hint: { en: 'They will contact you. You can start learning while you wait.', am: 'እነሱ ያገኙዎታል። እየጠበቁ መማር መጀመር ይችላሉ።' },
        options: [
          { value: 'aaapd', label: { en: 'AAAPD', am: 'AAAPD' }, say: ['aaapd'] },
          { value: 'tib', label: { en: 'Tomorrow is Better', am: 'Tomorrow is Better' }, say: ['tomorrow'] },
          { value: 'unhcr_partner', label: { en: 'A refugee support organisation', am: 'የስደተኞች ድጋፍ ድርጅት' }, say: ['refugee', 'ስደተኞች'] },
          { value: 'unsure', label: { en: "I'm not sure. Please help me choose.", am: 'እርግጠኛ አይደለሁም። እንድመርጥ እርዱኝ።' }, say: ['not sure', 'help', 'እርግጠኛ', 'እርዱኝ'] }
        ] },
      { id: 'dob', type: 'ethdate', optional: true,
        label: { en: 'When were you born?', am: 'መቼ ተወለዱ?' },
        hint: { en: 'Use the Ethiopian calendar. You can skip this if you are not sure.', am: 'የኢትዮጵያ አቆጣጠር ይጠቀሙ። እርግጠኛ ካልሆኑ መዝለል ይችላሉ።' } },
      { id: 'consent', type: 'consent', requiredValue: 'yes', reviewLabel: { en: 'Agreed to how we use your answers', am: 'መልሶች በሚያዙበት መንገድ ተስማምተዋል' },
        label: { en: 'Do you agree to how we keep your answers?', am: 'መልሶችዎን በምንይዝበት መንገድ ይስማማሉ?' },
        body: { en: 'We keep only what you tell us here. We never ask for medical papers. Nothing is shared with anyone without asking you first. You can change or delete your answers at any time.', am: 'እዚህ የሚነግሩንን ብቻ እንይዛለን። የሕክምና ወረቀት በፍጹም አንጠይቅም። መጀመሪያ እርስዎን ሳንጠይቅ ለማንም አናጋራም። መልሶችዎን በማንኛውም ጊዜ መቀየር ወይም መሰረዝ ይችላሉ።' },
        options: [
          { value: 'yes', icon: '✅', label: { en: 'Yes, I agree', am: 'አዎ፣ እስማማለሁ' }, say: ['yes', 'agree', 'አዎ', 'እስማማለሁ'] },
          { value: 'no', icon: '✋', label: { en: 'No, I do not agree', am: 'አይ፣ አልስማማም' }, say: ['no', 'አልስማማም'] }
        ] }
    ],
    submitLabel: { en: 'Create my account', am: 'መለያዬን ፍጠር' },
    doneTitle: { en: 'Welcome! Your account is ready.', am: 'እንኳን ደህና መጡ! መለያዎ ዝግጁ ነው።' },
    doneText: { en: 'You can start learning now.', am: 'አሁን መማር መጀመር ይችላሉ።' }
  });

  /* 2. SUPPORT PASSPORT (needs, not diagnosis; learner-owned) */
  D.register('passport', {
    title: { en: 'My Support Passport', am: 'የድጋፍ ፓስፖርቴ' },
    fields: [
      { id: 'want', type: 'choice', sensitive: true, reviewLabel: { en: 'Share what helps you', am: 'የሚረዳዎትን ማጋራት' },
        label: { en: 'Would you like to tell us what helps you learn and work?', am: 'ለመማርና ለመሥራት የሚረዳዎትን ሊነግሩን ይፈልጋሉ?' },
        hint: { en: "You don't have to. We never ask about a condition or for medical papers.", am: 'ግዴታ አይደለም። ስለ ጤና ሁኔታ ወይም የሕክምና ወረቀት በፍጹም አንጠይቅም።' },
        options: [
          { value: 'yes', icon: '✅', label: { en: 'Yes', am: 'አዎ' }, say: ['yes', 'አዎ'] },
          { value: 'later', icon: '⏭️', label: { en: 'Not now', am: 'አሁን አይደለም' }, say: ['not now', 'later', 'no', 'አሁን አይደለም', 'በኋላ'] }
        ] },
      { id: 'needs', type: 'multi', options: 'NEEDS', sensitive: true, showIf: { field: 'want', equals: 'yes' },
        prefill: { from: 'passport', key: 'needs' },
        label: { en: 'What would help you? Choose all that fit.', am: 'ምን ይረዳዎታል? የሚስማሙትን ሁሉ ይምረጡ።' } },
      { id: 'other_need', type: 'textarea', optional: true, sensitive: true, showIf: { field: 'want', equals: 'yes' },
        label: { en: 'Is there anything else that helps you?', am: 'የሚረዳዎት ሌላ ነገር አለ?' },
        hint: { en: 'Write it in your own words.', am: 'በራስዎ ቃላት ይጻፉ።' } },
      { id: 'sharing', type: 'choice', sensitive: true, default: 'ask', showIf: { field: 'want', equals: 'yes' },
        label: { en: 'Who can see this?', am: 'ይህን ማን ማየት ይችላል?' },
        hint: { en: 'Private is chosen for you. You can change this at any time.', am: 'ለእርስዎ «የግል» ተመርጧል። በማንኛውም ጊዜ መቀየር ይችላሉ።' },
        options: [
          { value: 'ask', icon: '🔒', label: { en: 'Only me. Ask me every time I apply for a job.', am: 'እኔ ብቻ። ለሥራ ባመለከትኩ ቁጥር ጠይቁኝ።' }, say: ['only me', 'ask', 'እኔ ብቻ', 'ጠይቁኝ'] },
          { value: 'trainers', icon: '👩‍🏫', label: { en: 'Me and my trainers at ALX', am: 'እኔና በALX ያሉ አሰልጣኞቼ' }, say: ['trainers', 'alx', 'አሰልጣኞቼ'] }
        ] }
    ],
    submitLabel: { en: 'Save my Support Passport', am: 'የድጋፍ ፓስፖርቴን አስቀምጥ' },
    reviewNote: { en: 'This stays on your phone. Job boards never see it unless you choose to share it.', am: 'ይህ በስልክዎ ላይ ይቆያል። እርስዎ ካላጋሩት በስተቀር የሥራ ማስታወቂያ ጣቢያዎች አያዩትም።' },
    doneTitle: { en: 'Your Support Passport is saved', am: 'የድጋፍ ፓስፖርትዎ ተቀምጧል' },
    doneText: { en: 'You can change it at any time. Now you can find jobs that offer this support.', am: 'በማንኛውም ጊዜ መቀየር ይችላሉ። አሁን ይህን ድጋፍ የሚሰጡ ሥራዎችን ማግኘት ይችላሉ።' }
  });

  /* 3. EMPLOYER: post a job and the support it offers (same vocabulary) */
  D.register('employer', {
    title: { en: 'Post a job', am: 'ሥራ ያስተዋውቁ' },
    fields: [
      { id: 'title', type: 'text', label: { en: 'What is the job title?', am: 'የሥራው መጠሪያ ምንድን ነው?' } },
      { id: 'org', type: 'text', autocomplete: 'organization', label: { en: 'What is your organisation called?', am: 'የድርጅትዎ ስም ማን ነው?' } },
      { id: 'location', type: 'text', label: { en: 'Where is the job?', am: 'ሥራው የት ነው?' }, hint: { en: 'For example: Bole, Addis Ababa', am: 'ለምሳሌ፦ ቦሌ፣ አዲስ አበባ' } },
      { id: 'mode', type: 'choice', label: { en: 'Where will people work?', am: 'ሠራተኞች የት ይሠራሉ?' },
        options: [
          { value: 'onsite', icon: '🏢', label: { en: 'At our office', am: 'በቢሯችን' }, say: ['office', 'onsite', 'ቢሮ'] },
          { value: 'remote', icon: '🏠', label: { en: 'From home', am: 'ከቤት' }, say: ['home', 'remote', 'ቤት'] },
          { value: 'hybrid', icon: '🔁', label: { en: 'Both office and home', am: 'በቢሮም በቤትም' }, say: ['both', 'hybrid'] }
        ] },
      { id: 'offers', type: 'multi', options: 'NEEDS',
        reviewLabel: { en: 'Support offered', am: 'የሚሰጡ ድጋፎች' },
        label: { en: 'Which support does this job offer?', am: 'ይህ ሥራ የትኞቹን ድጋፎች ይሰጣል?' },
        hint: { en: 'Job seekers can find your job by the support they need. They never have to tell you why.', am: 'ሥራ ፈላጊዎች በሚፈልጉት ድጋፍ ሥራዎን ማግኘት ይችላሉ። ምክንያታቸውን ሊነግሩዎ አይገደዱም።' } },
      { id: 'description', type: 'textarea', label: { en: 'Describe the job in a few simple sentences.', am: 'ሥራውን በጥቂት ቀላል ዓረፍተ ነገሮች ይግለጹ።' } },
      { id: 'contact', type: 'text', label: { en: 'How should applicants reach you?', am: 'አመልካቾች እንዴት ያግኙዎት?' }, hint: { en: 'Phone number or email', am: 'ስልክ ቁጥር ወይም ኢሜይል' } }
    ],
    allowLater: true,
    submitLabel: { en: 'Publish this job', am: 'ሥራውን አትም' },
    doneTitle: { en: 'Your job is published', am: 'ሥራዎ ታትሟል' },
    doneText: { en: 'It now appears on the job board with the support it offers.', am: 'አሁን ከሚሰጠው ድጋፍ ጋር በሥራ ማስታወቂያ ገጹ ላይ ይታያል።' }
  });

  /* 4. JOB APPLICATION: prefilled from profile (no asking twice), voice answers, opt-in sharing */
  D.register('apply', {
    title: { en: 'Apply for this job', am: 'ለዚህ ሥራ ያመልክቱ' },
    fields: [
      withName({ id: 'name', type: 'text', autocomplete: 'name', prefill: { from: 'profile', key: ['full_name', 'name'] },
        label: { en: 'Your name for this application', am: 'ለዚህ ማመልከቻ ስምዎ' } }),
      { id: 'phone', type: 'tel', prefill: { from: 'profile', key: 'phone' }, label: { en: 'Your phone number', am: 'ስልክ ቁጥርዎ' } },
      { id: 'why', type: 'textarea', label: { en: 'Why do you want this job?', am: 'ይህን ሥራ ለምን ይፈልጋሉ?' },
        hint: { en: 'A few sentences are enough. You can type, or answer by voice and check the words before they are used.', am: 'ጥቂት ዓረፍተ ነገሮች ይበቃሉ። መጻፍ፣ ወይም በድምፅ መልሰው ቃላቱን ከመጠቀምዎ በፊት ማረጋገጥ ይችላሉ።' } },
      { id: 'experience', type: 'textarea', label: { en: 'What work or learning have you done before?', am: 'ከዚህ በፊት ምን ዓይነት ሥራ ወይም ትምህርት አከናውነዋል?' },
        hint: { en: 'Paid work, volunteering, courses and family business all count.', am: 'የሚከፈልበት ሥራ፣ በጎ ፈቃድ፣ ኮርሶችና የቤተሰብ ንግድ ሁሉም ይቆጠራሉ።' } },
      { id: 'interview', type: 'multi', optional: true, label: { en: 'How would you like to be interviewed?', am: 'ቃለ መጠይቁ እንዴት እንዲሆን ይፈልጋሉ?' },
        options: [
          { value: 'phone', icon: '📞', label: { en: 'By phone', am: 'በስልክ' }, say: ['phone', 'ስልክ'] },
          { value: 'in_person', icon: '🧑‍🤝‍🧑', label: { en: 'In person', am: 'በአካል' }, say: ['person', 'አካል'] },
          { value: 'written', icon: '📝', label: { en: 'Written questions', am: 'በጽሑፍ ጥያቄዎች' }, say: ['written', 'ጽሑፍ'] },
          { value: 'interpreter', icon: '🤟', label: { en: 'With a sign language interpreter', am: 'ከምልክት ቋንቋ አስተርጓሚ ጋር' }, say: ['interpreter', 'sign', 'አስተርጓሚ'] }
        ] },
      { id: 'share_passport', type: 'choice', sensitive: true, showIf: function () { var p = D.store.get('passport', null); return !!(p && p.needs && p.needs.length); },
        label: { en: 'Do you want to share your Support Passport with this employer?', am: 'የድጋፍ ፓስፖርትዎን ለዚህ ቀጣሪ ማጋራት ይፈልጋሉ?' },
        hint: { en: 'You decide for each job. Saying no never affects your application.', am: 'ለእያንዳንዱ ሥራ እርስዎ ይወስናሉ። «አይ» ማለት ማመልከቻዎን አይጎዳም።' },
        body: function (lang) {
          var list = D.supportForEmployer({ share_passport: 'share' }).map(function (n) { return D.label(n.label, lang); }).join('; ');
          return lang === 'am' ? 'ካጋሩ ቀጣሪው የሚያየው ይህን ዝርዝር ብቻ ነው፦ ' + list + '። ምክንያት፣ ሁኔታ ወይም በራስዎ ቃላት የጻፉት በፍጹም አይጋራም።'
            : 'If you share, the employer sees exactly this list: ' + list + '. Never a reason, a condition, or what you wrote in your own words.';
        },
        options: [
          { value: 'share', icon: '📤', label: { en: 'Yes, share my support list', am: 'አዎ፣ የድጋፍ ዝርዝሬን አጋራ' }, say: ['yes', 'share', 'አዎ', 'አጋራ'] },
          { value: 'keep', icon: '🔒', label: { en: 'No, keep it private', am: 'አይ፣ በምስጢር ይቆይ' }, say: ['no', 'private', 'keep', 'አይ'] }
        ] }
    ],
    submitLabel: { en: 'Send my application', am: 'ማመልከቻዬን ላክ' },
    doneTitle: { en: 'Your application is sent', am: 'ማመልከቻዎ ተልኳል' },
    doneText: { en: 'Below is exactly what the employer receives.', am: 'ከዚህ በታች ቀጣሪው በትክክል የሚቀበለው ይታያል።' }
  });

  /* 5. PROFILE UPDATE: the sign-up questions again, prefilled from the profile. Starts on the summary; the learner
     chooses "Change" only for what they want to update. */
  function fromSignup(id, extra) {
    var f = D.forms.signup.fields.filter(function (x) { return x.id === id; })[0], copy = {};
    Object.keys(f).forEach(function (k) { copy[k] = f[k]; });
    Object.keys(extra || {}).forEach(function (k) { copy[k] = extra[k]; });
    return copy;
  }
  /* 6. LEARNER TAKEOVER: after a partner signs a learner up, the learner checks the details alone and takes over the
     account. The staff member's name is shown here once, then removed (only the organisation is kept). */
  function helper(lang) {
    var p = D.store.get('profile', {}) || {}, r = p.registered_by || {};
    var org = orgName(r.org, lang);
    if (lang === 'am') return (r.staff ? r.staff + ' ከ' + org : org) + ' ለመመዝገብ ረድቶዎታል።';
    return (r.staff ? r.staff + ' from ' + org : org) + ' helped you sign up.';
  }
  var takeoverFields = ['name', 'phone', 'id_route', 'id_number', 'referral_partner', 'dob'];
  D.register('takeover', {
    title: { en: 'Take over your account', am: 'መለያዎን ይረከቡ' },
    startAt: 'review',
    allowLater: false,
    fields: [], // filled in below, from the profile form
    reviewTitle: { en: 'Take over your account', am: 'መለያዎን ይረከቡ' },
    reviewHint: function (lang) {
      return helper(lang) + (lang === 'am' ? ' ያስገቡትን ያረጋግጡ፤ የተሳሳተውን ይቀይሩ። ከዚህ በኋላ መለያውን የሚጠቀሙት እርስዎ ብቻ ነዎት።'
        : ' Check what they entered and change anything that is wrong. After this, only you use this account.');
    },
    reviewNote: { en: 'When you finish, your helper\'s name is removed from your profile; only the organisation is kept. Your helper cannot see your Support Passport: fill it in yourself, when you are ready.', am: 'ሲጨርሱ የረዳዎት ሰው ስም ከመገለጫዎ ይሰረዛል፤ የድርጅቱ ስም ብቻ ይቀመጣል። የረዳዎት ሰው የድጋፍ ፓስፖርትዎን ማየት አይችልም፤ ሲዘጋጁ ራስዎ ይሙሉት።' },
    submitLabel: { en: 'This is my account now', am: 'ይህ አሁን የእኔ መለያ ነው' },
    doneTitle: { en: 'Your account is now yours', am: 'መለያው አሁን የእርስዎ ነው' },
    doneText: { en: 'Only you use it from now on. Your helper\'s name has been removed.', am: 'ከአሁን ጀምሮ የሚጠቀሙት እርስዎ ብቻ ነዎት። የረዳዎት ሰው ስም ተሰርዟል።' }
  });

  D.register('profile', {
    title: { en: 'My profile', am: 'የእኔ መገለጫ' },
    startAt: 'review',
    fields: [
      fromSignup('name', { prefill: { from: 'profile', key: 'name' } }),
      withName({ id: 'full_name', type: 'text', optional: true, autocomplete: 'name', prefill: { from: 'profile', key: 'full_name' },
        reviewLabel: { en: 'Full name (optional)', am: 'ሙሉ ስም (አማራጭ)' },
        label: { en: 'What is your full name?', am: 'ሙሉ ስምዎ ማን ነው?' },
        hint: { en: 'Optional. Add it only if you want it on job applications. Amharic or English letters are both fine.', am: 'አማራጭ። በሥራ ማመልከቻዎች ላይ እንዲታይ ከፈለጉ ብቻ ይጨምሩት። የአማርኛም የእንግሊዝኛም ፊደላት ይቻላሉ።' } }),
      fromSignup('phone', { prefill: { from: 'profile', key: 'phone' }, reviewLabel: { en: 'Phone number', am: 'ስልክ ቁጥር' } }),
      fromSignup('id_route', { prefill: { from: 'profile', key: 'id_route' } }),
      fromSignup('id_number', { reviewLabel: { en: 'ID number (only if you want to add or change it)', am: 'የመታወቂያ ቁጥር (መጨመር ወይም መቀየር ከፈለጉ ብቻ)' } }),
      fromSignup('referral_partner', { prefill: { from: 'profile', key: 'referral_partner' }, reviewLabel: { en: 'Organisation that can confirm who you are', am: 'ማንነትዎን የሚያረጋግጥ ድርጅት' } }),
      fromSignup('dob', { prefill: { from: 'profile', key: 'dob' }, reviewLabel: { en: 'Date of birth', am: 'የትውልድ ቀን' } })
    ],
    reviewTitle: { en: 'My profile', am: 'የእኔ መገለጫ' },
    reviewHint: { en: 'These are the details you gave us. Choose "Change" to update one, then save.', am: 'እነዚህ የሰጡን ዝርዝሮች ናቸው። አንዱን ለማዘመን "ቀይር"ን ይምረጡ፣ ከዚያ ያስቀምጡ።' },
    reviewNote: { en: 'Your profile is stored on this phone. We never ask for a photo of your ID, and IDs are never checked automatically.', am: 'መገለጫዎ በዚህ ስልክ ላይ ተቀምጧል። የመታወቂያዎን ፎቶ በፍጹም አንጠይቅም፤ መታወቂያዎችም በራስ-ሰር አይረጋገጡም።' },
    submitLabel: { en: 'Save my changes', am: 'ለውጦቼን አስቀምጥ' },
    doneTitle: { en: 'Your profile is updated', am: 'መገለጫዎ ተዘምኗል' },
    doneText: { en: 'Forms will now be filled in with your new details.', am: 'ቅጾች ከአሁን ጀምሮ በአዲሱ ዝርዝርዎ ይሞላሉ።' }
  });
  D.forms.takeover.fields = D.forms.profile.fields.filter(function (f) { return takeoverFields.indexOf(f.id) !== -1; });
})();
