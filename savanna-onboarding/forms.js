/* Savanna Accessible Onboarding Module: form "recipes". Each form is plain data: the same engine renders all four.
   Amharic wording is a first draft: a native speaker must review it before testing with learners. */
(function () {
  var D = window.SavannaOnboarding;

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
        hint: { en: 'We record who helped, so the learner can see it later.', am: 'ተማሪው በኋላ እንዲያየው ማን እንደረዳ እንመዘግባለን።' } },
      { id: 'learner_consent', type: 'consent', requiredValue: 'yes', showIf: { field: 'filler', equals: 'partner' },
        reviewLabel: { en: 'Learner agreed to partner help', am: 'ተማሪው በአጋር እርዳታ ተስማምቷል' },
        label: { en: 'Learner: do you agree that this person fills in the form with you?', am: 'ተማሪ፦ ይህ ሰው ቅጹን አብሮዎት እንዲሞላ ይስማማሉ?' },
        hint: { en: 'Please read this aloud to the learner. The learner answers by voice or by tapping.', am: 'እባክዎ ይህን ለተማሪው ጮክ ብለው ያንብቡ። ተማሪው በድምፅ ወይም በመንካት ይመልሳል።' },
        options: [
          { value: 'yes', icon: '✅', label: { en: 'Yes, I agree', am: 'አዎ፣ እስማማለሁ' }, say: ['yes', 'agree', 'አዎ', 'እስማማለሁ'] },
          { value: 'no', icon: '✋', label: { en: 'No', am: 'አልስማማም' }, say: ['no', 'አልስማማም'] }
        ] },
      { id: 'name', type: 'text', autocomplete: 'name',
        label: { en: 'What is your full name?', am: 'ሙሉ ስምዎ ማን ነው?' },
        hint: { en: 'Write it the way you like to be called.', am: 'መጠራት በሚፈልጉት መንገድ ይጻፉት።' } },
      { id: 'phone', type: 'tel', autocomplete: 'tel',
        label: { en: 'What is your phone number?', am: 'ስልክ ቁጥርዎ ስንት ነው?' },
        hint: { en: 'We use it only to send you a link to continue. For example 0911 234 567.', am: 'ለመቀጠል ሊንክ ለመላክ ብቻ እንጠቀምበታለን። ለምሳሌ 0911 234 567።' } },
      { id: 'id_route', type: 'choice', reviewLabel: { en: 'ID', am: 'መታወቂያ' },
        label: { en: 'Which ID do you have?', am: 'የትኛው መታወቂያ አለዎት?' },
        hint: { en: 'Any of these is fine. You can start learning even without an ID.', am: 'ከእነዚህ ማንኛውም ይበቃል። ያለ መታወቂያም መማር መጀመር ይችላሉ።' },
        options: [
          { value: 'fayda', icon: '🪪', label: { en: 'Fayda national ID', am: 'ፋይዳ ብሔራዊ መታወቂያ' }, say: ['fayda', 'ፋይዳ'] },
          { value: 'kebele', icon: '🏘️', label: { en: 'Kebele ID', am: 'የቀበሌ መታወቂያ' }, say: ['kebele', 'ቀበሌ'] },
          { value: 'passport', icon: '📘', label: { en: 'Passport', am: 'ፓስፖርት' }, say: ['passport', 'ፓስፖርት'] },
          { value: 'refugee', icon: '📄', label: { en: 'Refugee ID or proof of registration (RRS / UNHCR)', am: 'የስደተኛ መታወቂያ ወይም የምዝገባ ማረጋገጫ' }, say: ['refugee', 'ስደተኛ'] },
          { value: 'other', icon: '🗂️', label: { en: 'Another document', am: 'ሌላ ሰነድ' }, say: ['another', 'document', 'ሰነድ'] },
          { value: 'none', icon: '🤝', label: { en: 'I have none of these. Refer me through a partner.', am: 'ምንም የለኝም። በአጋር ድርጅት በኩል ይመዝግቡኝ።' }, say: ['none', 'refer', 'ምንም', 'የለኝም'] }
        ] },
      { id: 'id_number', type: 'text', optional: true, showIf: { field: 'id_route', in: ['fayda', 'kebele', 'passport', 'refugee', 'other'] },
        label: { en: 'What is the number on your ID?', am: 'በመታወቂያዎ ላይ ያለው ቁጥር ስንት ነው?' },
        hint: { en: 'You can skip this and add it later. We never ask for a photo of your ID.', am: 'ይህን መዝለልና በኋላ መጨመር ይችላሉ። የመታወቂያዎን ፎቶ በፍጹም አንጠይቅም።' } },
      { id: 'referral_partner', type: 'choice', showIf: { field: 'id_route', equals: 'none' },
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
      { id: 'want', type: 'choice', reviewLabel: { en: 'Share what helps you', am: 'የሚረዳዎትን ማጋራት' },
        label: { en: 'Would you like to tell us what helps you learn and work?', am: 'ለመማርና ለመሥራት የሚረዳዎትን ሊነግሩን ይፈልጋሉ?' },
        hint: { en: "You don't have to. We never ask about a condition or for medical papers.", am: 'ግዴታ አይደለም። ስለ ጤና ሁኔታ ወይም የሕክምና ወረቀት በፍጹም አንጠይቅም።' },
        options: [
          { value: 'yes', icon: '✅', label: { en: 'Yes', am: 'አዎ' }, say: ['yes', 'አዎ'] },
          { value: 'later', icon: '⏭️', label: { en: 'Not now', am: 'አሁን አይደለም' }, say: ['not now', 'later', 'no', 'አሁን አይደለም', 'በኋላ'] }
        ] },
      { id: 'needs', type: 'multi', options: 'NEEDS', showIf: { field: 'want', equals: 'yes' },
        prefill: { from: 'passport', key: 'needs' },
        label: { en: 'What would help you? Choose all that fit.', am: 'ምን ይረዳዎታል? የሚስማሙትን ሁሉ ይምረጡ።' } },
      { id: 'other_need', type: 'textarea', optional: true, showIf: { field: 'want', equals: 'yes' },
        label: { en: 'Is there anything else that helps you?', am: 'የሚረዳዎት ሌላ ነገር አለ?' },
        hint: { en: 'Say it or write it in your own words.', am: 'በራስዎ ቃላት ይናገሩ ወይም ይጻፉ።' } },
      { id: 'sharing', type: 'choice', showIf: { field: 'want', equals: 'yes' },
        label: { en: 'Who can see this?', am: 'ይህን ማን ማየት ይችላል?' },
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
      { id: 'name', type: 'text', prefill: { from: 'profile', key: 'name' }, label: { en: 'Your full name', am: 'ሙሉ ስምዎ' } },
      { id: 'phone', type: 'tel', prefill: { from: 'profile', key: 'phone' }, label: { en: 'Your phone number', am: 'ስልክ ቁጥርዎ' } },
      { id: 'why', type: 'textarea', label: { en: 'Why do you want this job?', am: 'ይህን ሥራ ለምን ይፈልጋሉ?' },
        hint: { en: 'A few sentences are enough. You can answer by voice.', am: 'ጥቂት ዓረፍተ ነገሮች ይበቃሉ። በድምፅ መመለስ ይችላሉ።' } },
      { id: 'experience', type: 'textarea', label: { en: 'What work or learning have you done before?', am: 'ከዚህ በፊት ምን ዓይነት ሥራ ወይም ትምህርት አከናውነዋል?' },
        hint: { en: 'Paid work, volunteering, courses and family business all count.', am: 'የሚከፈልበት ሥራ፣ በጎ ፈቃድ፣ ኮርሶችና የቤተሰብ ንግድ ሁሉም ይቆጠራሉ።' } },
      { id: 'interview', type: 'multi', optional: true, label: { en: 'How would you like to be interviewed?', am: 'ቃለ መጠይቁ እንዴት እንዲሆን ይፈልጋሉ?' },
        options: [
          { value: 'phone', icon: '📞', label: { en: 'By phone', am: 'በስልክ' }, say: ['phone', 'ስልክ'] },
          { value: 'in_person', icon: '🧑‍🤝‍🧑', label: { en: 'In person', am: 'በአካል' }, say: ['person', 'አካል'] },
          { value: 'written', icon: '📝', label: { en: 'Written questions', am: 'በጽሑፍ ጥያቄዎች' }, say: ['written', 'ጽሑፍ'] },
          { value: 'interpreter', icon: '🤟', label: { en: 'With a sign language interpreter', am: 'ከምልክት ቋንቋ አስተርጓሚ ጋር' }, say: ['interpreter', 'sign', 'አስተርጓሚ'] }
        ] },
      { id: 'share_passport', type: 'choice', showIf: function () { var p = D.store.get('dimts.passport', null); return !!(p && p.needs && p.needs.length); },
        label: { en: 'Do you want to share your Support Passport with this employer?', am: 'የድጋፍ ፓስፖርትዎን ለዚህ ቀጣሪ ማጋራት ይፈልጋሉ?' },
        hint: { en: 'If you share, the employer sees only the list of support that helps you. Never a reason or condition.', am: 'ካጋሩ ቀጣሪው የሚያየው የሚረዳዎትን የድጋፍ ዝርዝር ብቻ ነው። ምክንያት ወይም ሁኔታ በፍጹም አይታይም።' },
        options: [
          { value: 'share', icon: '📤', label: { en: 'Yes, share my support list', am: 'አዎ፣ የድጋፍ ዝርዝሬን አጋራ' }, say: ['yes', 'share', 'አዎ', 'አጋራ'] },
          { value: 'keep', icon: '🔒', label: { en: 'No, keep it private', am: 'አይ፣ በምስጢር ይቆይ' }, say: ['no', 'private', 'keep', 'አይ'] }
        ] }
    ],
    submitLabel: { en: 'Send my application', am: 'ማመልከቻዬን ላክ' },
    doneTitle: { en: 'Your application is sent', am: 'ማመልከቻዎ ተልኳል' },
    doneText: { en: 'Below is exactly what the employer receives.', am: 'ከዚህ በታች ቀጣሪው በትክክል የሚቀበለው ይታያል።' }
  });
})();
