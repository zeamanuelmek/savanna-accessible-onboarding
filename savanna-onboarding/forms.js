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
  var NOT_CHECKED = { en: 'Self-declared · not verified', am: 'በራስ የተገለጸ · አልተረጋገጠም', om: 'Ofiin kan himame · hin mirkanoofne' };
  var ORGS = { aaapd: 'AAAPD', tib: 'Tomorrow is Better', other: { en: 'a partner organisation', am: 'አጋር ድርጅት', om: 'dhaabbata michuu' } };
  function orgName(v, lang) { var o = ORGS[v] || ORGS.other; return D.label(o, lang); }
  /* Names: speech recognition is unreliable for Ethiopian names, so the learner always checks a spoken name, can ask
     someone to type it, and may use Amharic (Ethiopic) or Latin letters. */
  var NAME = {
    voiceWarning: { en: 'Voice may get names wrong. Please check and correct it.', am: 'ድምፅ ስሞችን ሊሳሳት ይችላል። እባክዎ ያረጋግጡና ያስተካክሉ።', om: 'Sagaleen maqaa dogoggoraan qabachuu danda\'a. Maaloo ilaaliitii sirreessi.' },
    askHelper: {
      button: { en: 'Ask someone to type this for me', am: 'ሌላ ሰው እንዲጽፍልኝ ልጠይቅ', om: 'Nama kana naaf barreessu gaafadhu' },
      text: { en: 'You can hand the phone to someone you trust. They type your name, then give the phone back. You then check the name and choose Continue.',
        am: 'ስልኩን ለሚያምኑት ሰው መስጠት ይችላሉ። ስምዎን ጽፈው ስልኩን ይመልሱልዎታል። ከዚያ ስሙን አረጋግጠው «ቀጥል»ን ይምረጡ።', om: 'Bilbila nama amantu kennuu dandeessa. Inni maqaa kee barreessee bilbila siif deebisa. Achiis ati maqaa ilaaltee "Itti fufi" filatta.' }
    },
    validate: function (v) {
      if (!/^[\p{L}\p{M}][\p{L}\p{M}\s'’.\-፡]*$/u.test(String(v).trim())) {
        return { en: 'Use letters only. Amharic or English letters are both fine.', am: 'ፊደላትን ብቻ ይጠቀሙ። የአማርኛም የእንግሊዝኛም ፊደላት ይቻላሉ።', om: 'Qubee qofa fayyadami. Qubeen Afaan Amaaraa, Afaan Oromoo ykn Ingiliffaa hundi ni ta\'u.' };
      }
      return '';
    }
  };
  function withName(f) { f.voiceWarning = NAME.voiceWarning; f.askHelper = NAME.askHelper; f.validate = NAME.validate; return f; }

  /* 1. SIGN-UP (with ID ladder and partner-assisted mode) */
  D.register('signup', {
    title: { en: 'Join Savanna', am: 'ሳቫናን ይቀላቀሉ', om: 'Savanna\'tti galmaa\'i' },
    fields: [
      { id: 'filler', picture: '👥', type: 'choice', reviewLabel: { en: 'Who filled in this form', am: 'ቅጹን የሞላው', om: 'Eenyutu unka kana guute' },
        label: { en: 'Who is filling in this form?', am: 'ይህን ቅጽ የሚሞላው ማን ነው?', om: 'Eenyutu unka kana guutaa jira?' },
        options: [
          { value: 'self', icon: '🙋', label: { en: 'Me, for myself', am: 'እኔ፣ ለራሴ', om: 'Ana, ofii kootiif' }, say: ['me', 'myself', 'እኔ', 'ራሴ'] },
          { value: 'partner', icon: '🤝', label: { en: 'A partner organisation, together with the learner', am: 'አጋር ድርጅት፣ ከተማሪው ጋር', om: 'Dhaabbata michuu, barataa wajjin' }, say: ['partner', 'organisation', 'አጋር', 'ድርጅት'] }
        ] },
      { id: 'partner_org', picture: '🏢', type: 'choice', showIf: { field: 'filler', equals: 'partner' },
        label: { en: 'Which organisation are you from?', am: 'ከየትኛው ድርጅት ነዎት?', om: 'Dhaabbata kam irraa dhufte?' },
        options: [
          { value: 'aaapd', label: { en: 'AAAPD', am: 'AAAPD (የአዲስ አበባ አካል ጉዳተኞች ማኅበር)', om: 'AAAPD' }, say: ['aaapd'] },
          { value: 'tib', label: { en: 'Tomorrow is Better', am: 'Tomorrow is Better', om: 'Tomorrow is Better' }, say: ['tomorrow'] },
          { value: 'other', label: { en: 'Another organisation', am: 'ሌላ ድርጅት', om: 'Dhaabbata biraa' }, say: ['another', 'other', 'ሌላ'] }
        ] },
      { id: 'staff_name', picture: '🧑‍💼', type: 'text', showIf: { field: 'filler', equals: 'partner' }, autocomplete: 'off',
        label: { en: 'What is your name? (staff member)', am: 'የእርስዎ ስም ማን ነው? (ሠራተኛ)', om: 'Maqaan kee eenyu? (hojjetaa)' },
        hint: { en: 'The learner sees your name when they take over the account. After that it is removed; only your organisation is kept.', am: 'ተማሪው መለያውን ሲረከብ ስምዎን ያያል። ከዚያ በኋላ ይሰረዛል፤ የድርጅትዎ ስም ብቻ ይቀመጣል።', om: 'Barataan yeroo herrega fudhatu maqaa kee arga. Achii booda ni haqama; kan hafu dhaabbata kee qofa.' } },
      { id: 'learner_consent', picture: '🤝', type: 'consent', requiredValue: 'yes', showIf: { field: 'filler', equals: 'partner' },
        reviewLabel: { en: 'Learner agreed to partner help', am: 'ተማሪው በአጋር እርዳታ ተስማምቷል', om: 'Barataan gargaarsa michuutiif walii gale' },
        label: { en: 'Learner: do you agree that this person fills in the form with you?', am: 'ተማሪ፦ ይህ ሰው ቅጹን አብሮዎት እንዲሞላ ይስማማሉ?', om: 'Barataa: namni kun si wajjin unka kana akka guutu walii galtaa?' },
        hint: { en: 'Please read this aloud to the learner. The learner answers by voice or by tapping.', am: 'እባክዎ ይህን ለተማሪው ጮክ ብለው ያንብቡ። ተማሪው በድምፅ ወይም በመንካት ይመልሳል።', om: 'Maaloo kana barataadhaaf sagaleen dubbisi. Barataan sagaleen ykn tuquun deebisa.' },
        options: [
          { value: 'yes', icon: '✅', label: { en: 'Yes, I agree', am: 'አዎ፣ እስማማለሁ', om: 'Eeyyee, walii nan gala' }, say: ['yes', 'agree', 'አዎ', 'እስማማለሁ'] },
          { value: 'no', icon: '✋', label: { en: 'No', am: 'አልስማማም', om: 'Lakki' }, say: ['no', 'አልስማማም'] }
        ] },
      withName({ id: 'name', picture: '🙂', type: 'text', autocomplete: 'nickname', reviewLabel: { en: 'Name we call you', am: 'የምንጠራዎ ስም', om: 'Maqaa ittiin si waamnu' },
        label: { en: 'What should we call you?', am: 'ምን ብለን እንጥራዎ?', om: 'Maqaa akkamiin si waamuu qabna?' },
        hint: { en: 'Amharic or English letters are both fine. You can add your full name later in My profile, if you want to.', am: 'የአማርኛም የእንግሊዝኛም ፊደላት ይቻላሉ። ከፈለጉ ሙሉ ስምዎን በኋላ በ«የእኔ መገለጫ» ውስጥ መጨመር ይችላሉ።', om: 'Qubeen Afaan Amaaraa, Afaan Oromoo ykn Ingiliffaa hundi ni ta\'u. Yoo barbaadde, maqaa kee guutuu booda Piroofaayilii koo keessatti dabaluu dandeessa.' } }),
      { id: 'phone', picture: '📱', type: 'tel', autocomplete: 'tel',
        label: { en: 'What is your phone number?', am: 'ስልክ ቁጥርዎ ስንት ነው?', om: 'Lakkoofsi bilbila keetii meeqa?' },
        hint: { en: 'We use it only to send you a link to continue. For example 0911 234 567.', am: 'ለመቀጠል ሊንክ ለመላክ ብቻ እንጠቀምበታለን። ለምሳሌ 0911 234 567።', om: 'Kan itti fayyadamnu geessituu itti fufuu siif erguuf qofa. Fakkeenyaaf 0911 234 567.' } },
      { id: 'id_route', picture: '🪪', type: 'choice', sensitive: true, reviewLabel: { en: 'ID', am: 'መታወቂያ', om: 'Eenyummaa' },
        label: { en: 'Which ID do you have?', am: 'የትኛው መታወቂያ አለዎት?', om: 'Waraqaa eenyummaa kam qabda?' },
        hint: { en: 'Any of these is fine. You can start learning even without an ID. Nobody checks IDs automatically: we record what you tell us.', am: 'ከእነዚህ ማንኛውም ይበቃል። ያለ መታወቂያም መማር መጀመር ይችላሉ። መታወቂያዎች በራስ-ሰር አይረጋገጡም፤ የሚነግሩንን እንመዘግባለን።', om: 'Kamiyyuu ni ta\'a. Waraqaa eenyummaa malees barachuu jalqabuu dandeessa. Namni eenyummaa ofumaan mirkaneessu hin jiru: waan ati nutti himtu galmeessina.' },
        options: [
          { value: 'fayda', icon: '🪪', label: { en: 'Fayda national ID', am: 'ፋይዳ ብሔራዊ መታወቂያ', om: 'Eenyummaa biyyaalessaa Faayda' }, say: ['fayda', 'ፋይዳ'], badge: NOT_CHECKED },
          { value: 'kebele', icon: '🏘️', label: { en: 'Kebele ID', am: 'የቀበሌ መታወቂያ', om: 'Waraqaa eenyummaa ganda' }, say: ['kebele', 'ቀበሌ'], badge: NOT_CHECKED },
          { value: 'passport', icon: '📘', label: { en: 'Passport', am: 'ፓስፖርት', om: 'Paaspoortii' }, say: ['passport', 'ፓስፖርት'], badge: NOT_CHECKED },
          { value: 'refugee', icon: '📄', label: { en: 'Refugee ID or proof of registration (RRS / UNHCR)', am: 'የስደተኛ መታወቂያ ወይም የምዝገባ ማረጋገጫ', om: 'Eenyummaa baqataa ykn ragaa galmee (RRS / UNHCR)' }, say: ['refugee', 'ስደተኛ'], badge: NOT_CHECKED },
          { value: 'other', icon: '🗂️', label: { en: 'Another document', am: 'ሌላ ሰነድ', om: 'Sanada biraa' }, say: ['another', 'document', 'ሰነድ'], badge: NOT_CHECKED },
          { value: 'none', icon: '🤝', label: { en: 'I have none of these. Refer me through a partner.', am: 'ምንም የለኝም። በአጋር ድርጅት በኩል ይመዝግቡኝ።', om: 'Kana keessaa tokkollee hin qabu. Karaa michuu na ergi.' }, say: ['none', 'refer', 'ምንም', 'የለኝም'], badge: D.TRUST.partner_referral_pending }
        ] },
      { id: 'id_number', picture: '🔢', type: 'text', optional: true, sensitive: true, clearIfChanged: 'id_route', showIf: { field: 'id_route', in: ['fayda', 'kebele', 'passport', 'refugee', 'other'] },
        label: { en: 'What is the number on your ID?', am: 'በመታወቂያዎ ላይ ያለው ቁጥር ስንት ነው?', om: 'Lakkoofsi waraqaa eenyummaa kee irra jiru meeqa?' },
        hint: { en: 'You can skip this and add it later. We never ask for a photo of your ID. If you add the number, your status becomes "Number recorded — not verified".', am: 'ይህን መዝለልና በኋላ መጨመር ይችላሉ። የመታወቂያዎን ፎቶ በፍጹም አንጠይቅም። ቁጥሩን ካስገቡ ሁኔታዎ «ቁጥር ተመዝግቧል — አልተረጋገጠም» ይሆናል።', om: 'Kana dabarsitee booda dabaluu dandeessa. Suuraa eenyummaa kee gonkumaa hin gaafannu. Yoo lakkoofsa dabalte, haalli kee "Lakkoofsi galmeeffameera — hin mirkanoofne" ta\'a.' } },
      { id: 'referral_partner', picture: '🤝', type: 'choice', sensitive: true, showIf: { field: 'id_route', equals: 'none' },
        label: { en: 'Which organisation can confirm who you are?', am: 'ማንነትዎን የትኛው ድርጅት ሊያረጋግጥ ይችላል?', om: 'Dhaabbanni kam eenyummaa kee mirkaneessuu danda\'a?' },
        hint: { en: 'They will contact you. You can start learning while you wait.', am: 'እነሱ ያገኙዎታል። እየጠበቁ መማር መጀመር ይችላሉ።', om: 'Isaan si quunnamu. Osoo eegduu barachuu jalqabuu dandeessa.' },
        options: [
          { value: 'aaapd', label: { en: 'AAAPD', am: 'AAAPD', om: 'AAAPD' }, say: ['aaapd'] },
          { value: 'tib', label: { en: 'Tomorrow is Better', am: 'Tomorrow is Better', om: 'Tomorrow is Better' }, say: ['tomorrow'] },
          { value: 'unhcr_partner', label: { en: 'A refugee support organisation', am: 'የስደተኞች ድጋፍ ድርጅት', om: 'Dhaabbata deeggarsa baqattootaa' }, say: ['refugee', 'ስደተኞች'] },
          { value: 'unsure', label: { en: "I'm not sure. Please help me choose.", am: 'እርግጠኛ አይደለሁም። እንድመርጥ እርዱኝ።', om: 'Hin mirkaneeffadhu. Maaloo akkan filadhu na gargaari.' }, say: ['not sure', 'help', 'እርግጠኛ', 'እርዱኝ'] }
        ] },
      { id: 'dob', picture: '🎂', type: 'ethdate', optional: true,
        label: { en: 'When were you born?', am: 'መቼ ተወለዱ?', om: 'Yoom dhalatte?' },
        hint: { en: 'First choose the Ethiopian or the Gregorian calendar. You can skip this if you are not sure.', am: 'መጀመሪያ የኢትዮጵያ ወይም የፈረንጆች አቆጣጠር ይምረጡ። እርግጠኛ ካልሆኑ መዝለል ይችላሉ።', om: 'Dura dhaha Itoophiyaa ykn dhaha Gorgooriyaan filadhu. Yoo hin mirkaneeffatin kana dabarsuu dandeessa.' } },
      { id: 'consent', picture: '✅', type: 'consent', requiredValue: 'yes', reviewLabel: { en: 'Agreed to how we use your answers', am: 'መልሶች በሚያዙበት መንገድ ተስማምተዋል', om: 'Akkaataa deebii kee itti fayyadamnuuf walii gale' },
        label: { en: 'Do you agree to how we keep your answers?', am: 'መልሶችዎን በምንይዝበት መንገድ ይስማማሉ?', om: 'Akkaataa deebii kee itti kuufnuuf walii galtaa?' },
        body: { en: 'We keep only what you tell us here. We never ask for medical papers. Nothing is shared with anyone without asking you first. You can change or delete your answers at any time.', am: 'እዚህ የሚነግሩንን ብቻ እንይዛለን። የሕክምና ወረቀት በፍጹም አንጠይቅም። መጀመሪያ እርስዎን ሳንጠይቅ ለማንም አናጋራም። መልሶችዎን በማንኛውም ጊዜ መቀየር ወይም መሰረዝ ይችላሉ።', om: 'Kan kuufnu waan ati asitti nutti himtu qofa. Waraqaa yaalaa gonkumaa hin gaafannu. Osoo dura si hin gaafatin namaaf homtuu hin qoodamu. Yeroo kamiyyuu deebii kee jijjiiruu ykn haquu dandeessa.' },
        options: [
          { value: 'yes', icon: '✅', label: { en: 'Yes, I agree', am: 'አዎ፣ እስማማለሁ', om: 'Eeyyee, walii nan gala' }, say: ['yes', 'agree', 'አዎ', 'እስማማለሁ'] },
          { value: 'no', icon: '✋', label: { en: 'No, I do not agree', am: 'አይ፣ አልስማማም', om: 'Lakki, walii hin galu' }, say: ['no', 'አልስማማም'] }
        ] }
    ],
    submitLabel: { en: 'Create my account', am: 'መለያዬን ፍጠር', om: 'Herrega koo uumi' },
    doneTitle: { en: 'Welcome! Your account is ready.', am: 'እንኳን ደህና መጡ! መለያዎ ዝግጁ ነው።', om: 'Baga nagaan dhufte! Herregni kee qophaa\'eera.' },
    doneText: { en: 'You can start learning now.', am: 'አሁን መማር መጀመር ይችላሉ።', om: 'Amma barachuu jalqabuu dandeessa.' }
  });

  /* 2. SUPPORT PASSPORT (needs, not diagnosis; learner-owned) */
  D.register('passport', {
    title: { en: 'My Support Passport', am: 'የድጋፍ ፓስፖርቴ', om: 'Paaspoortii Deeggarsaa koo' },
    fields: [
      { id: 'want', picture: '💬', type: 'choice', sensitive: true, reviewLabel: { en: 'Share what helps you', am: 'የሚረዳዎትን ማጋራት', om: 'Waan si gargaaru qoodi' },
        label: { en: 'Would you like to tell us what helps you learn and work?', am: 'ለመማርና ለመሥራት የሚረዳዎትን ሊነግሩን ይፈልጋሉ?', om: 'Waan barachuu fi hojjechuuf si gargaaru nutti himuu barbaaddaa?' },
        hint: { en: "You don't have to. We never ask about a condition or for medical papers.", am: 'ግዴታ አይደለም። ስለ ጤና ሁኔታ ወይም የሕክምና ወረቀት በፍጹም አንጠይቅም።', om: 'Dirqama miti. Waa\'ee haala fayyaa ykn waraqaa yaalaa gonkumaa hin gaafannu.' },
        options: [
          { value: 'yes', icon: '✅', label: { en: 'Yes', am: 'አዎ', om: 'Eeyyee' }, say: ['yes', 'አዎ'] },
          { value: 'later', icon: '⏭️', label: { en: 'Not now', am: 'አሁን አይደለም', om: 'Amma miti' }, say: ['not now', 'later', 'no', 'አሁን አይደለም', 'በኋላ'] }
        ] },
      { id: 'needs', picture: '🧩', type: 'multi', options: 'NEEDS', sensitive: true, showIf: { field: 'want', equals: 'yes' },
        prefill: { from: 'passport', key: 'needs' },
        label: { en: 'What would help you? Choose all that fit.', am: 'ምን ይረዳዎታል? የሚስማሙትን ሁሉ ይምረጡ።', om: 'Maaltu si gargaara? Kan siif ta\'u hunda filadhu.' } },
      { id: 'other_need', picture: '📝', type: 'textarea', optional: true, sensitive: true, showIf: { field: 'want', equals: 'yes' },
        label: { en: 'Is there anything else that helps you?', am: 'የሚረዳዎት ሌላ ነገር አለ?', om: 'Wanti biraa si gargaaru jiraa?' },
        hint: { en: 'Write it in your own words.', am: 'በራስዎ ቃላት ይጻፉ።', om: 'Jechoota keetiin barreessi.' } },
      { id: 'sharing', picture: '🔒', type: 'choice', sensitive: true, default: 'ask', showIf: { field: 'want', equals: 'yes' },
        label: { en: 'Who can see this?', am: 'ይህን ማን ማየት ይችላል?', om: 'Eenyutu kana arguu danda\'a?' },
        hint: { en: 'Private is chosen for you. You can change this at any time.', am: 'ለእርስዎ «የግል» ተመርጧል። በማንኛውም ጊዜ መቀየር ይችላሉ።', om: 'Dhuunfaan siif filatameera. Yeroo kamiyyuu kana jijjiiruu dandeessa.' },
        options: [
          { value: 'ask', icon: '🔒', label: { en: 'Only me. Ask me every time I apply for a job.', am: 'እኔ ብቻ። ለሥራ ባመለከትኩ ቁጥር ጠይቁኝ።', om: 'Ana qofa. Yeroo hojii iyyadhu hunda na gaafadhu.' }, say: ['only me', 'ask', 'እኔ ብቻ', 'ጠይቁኝ'] },
          { value: 'trainers', icon: '👩‍🏫', label: { en: 'Me and my trainers at ALX', am: 'እኔና በALX ያሉ አሰልጣኞቼ', om: 'Anaa fi leenjistoota koo ALX' }, say: ['trainers', 'alx', 'አሰልጣኞቼ'] }
        ] }
    ],
    submitLabel: { en: 'Save my Support Passport', am: 'የድጋፍ ፓስፖርቴን አስቀምጥ', om: 'Paaspoortii Deeggarsaa koo kuusi' },
    reviewNote: { en: 'This stays on your phone. Job boards never see it unless you choose to share it.', am: 'ይህ በስልክዎ ላይ ይቆያል። እርስዎ ካላጋሩት በስተቀር የሥራ ማስታወቂያ ጣቢያዎች አያዩትም።', om: 'Kun bilbila kee irra tura. Boordiiwwan hojii yoo ati qooduu filatte malee gonkumaa hin argan.' },
    doneTitle: { en: 'Your Support Passport is saved', am: 'የድጋፍ ፓስፖርትዎ ተቀምጧል', om: 'Paaspoortiin Deeggarsaa kee kuufameera' },
    doneText: { en: 'You can change it at any time. Now you can find jobs that offer this support.', am: 'በማንኛውም ጊዜ መቀየር ይችላሉ። አሁን ይህን ድጋፍ የሚሰጡ ሥራዎችን ማግኘት ይችላሉ።', om: 'Yeroo kamiyyuu jijjiiruu dandeessa. Amma hojiiwwan deeggarsa kana kennan argachuu dandeessa.' }
  });

  /* 3. EMPLOYER: post a job and the support it offers (same vocabulary) */
  D.register('employer', {
    title: { en: 'Post a job', am: 'ሥራ ያስተዋውቁ', om: 'Hojii beeksisi' },
    fields: [
      { id: 'title', type: 'text', label: { en: 'What is the job title?', am: 'የሥራው መጠሪያ ምንድን ነው?', om: 'Maqaan hojichaa maali?' } },
      { id: 'org', type: 'text', autocomplete: 'organization', label: { en: 'What is your organisation called?', am: 'የድርጅትዎ ስም ማን ነው?', om: 'Dhaabbanni kee maal jedhama?' } },
      { id: 'location', type: 'text', label: { en: 'Where is the job?', am: 'ሥራው የት ነው?', om: 'Hojichi eessa jira?' }, hint: { en: 'For example: Bole, Addis Ababa', am: 'ለምሳሌ፦ ቦሌ፣ አዲስ አበባ', om: 'Fakkeenyaaf: Boolee, Finfinnee' } },
      { id: 'mode', type: 'choice', label: { en: 'Where will people work?', am: 'ሠራተኞች የት ይሠራሉ?', om: 'Namoonni eessatti hojjetu?' },
        options: [
          { value: 'onsite', icon: '🏢', label: { en: 'At our office', am: 'በቢሯችን', om: 'Waajjira keenya keessatti' }, say: ['office', 'onsite', 'ቢሮ'] },
          { value: 'remote', icon: '🏠', label: { en: 'From home', am: 'ከቤት', om: 'Mana irraa' }, say: ['home', 'remote', 'ቤት'] },
          { value: 'hybrid', icon: '🔁', label: { en: 'Both office and home', am: 'በቢሮም በቤትም', om: 'Waajjiraa fi mana lamaanuu' }, say: ['both', 'hybrid'] }
        ] },
      { id: 'offers', type: 'multi', options: 'NEEDS',
        reviewLabel: { en: 'Support offered', am: 'የሚሰጡ ድጋፎች', om: 'Deeggarsa kennamu' },
        label: { en: 'Which support does this job offer?', am: 'ይህ ሥራ የትኞቹን ድጋፎች ይሰጣል?', om: 'Hojiin kun deeggarsa kam kenna?' },
        hint: { en: 'Job seekers can find your job by the support they need. They never have to tell you why.', am: 'ሥራ ፈላጊዎች በሚፈልጉት ድጋፍ ሥራዎን ማግኘት ይችላሉ። ምክንያታቸውን ሊነግሩዎ አይገደዱም።', om: 'Hojii barbaadonni deeggarsa isaan barbaachisuun hojii kee argachuu danda\'u. Sababa sitti himuu gonkumaa hin qaban.' } },
      { id: 'description', type: 'textarea', label: { en: 'Describe the job in a few simple sentences.', am: 'ሥራውን በጥቂት ቀላል ዓረፍተ ነገሮች ይግለጹ።', om: 'Hojicha hima salphaa muraasaan ibsi.' } },
      { id: 'contact', type: 'text', label: { en: 'How should applicants reach you?', am: 'አመልካቾች እንዴት ያግኙዎት?', om: 'Iyyattoonni akkamitti si quunnamu?' }, hint: { en: 'Phone number or email', am: 'ስልክ ቁጥር ወይም ኢሜይል', om: 'Lakkoofsa bilbilaa ykn imeelii' } }
    ],
    allowLater: true,
    submitLabel: { en: 'Publish this job', am: 'ሥራውን አትም', om: 'Hojii kana maxxansi' },
    doneTitle: { en: 'Your job is published', am: 'ሥራዎ ታትሟል', om: 'Hojiin kee maxxanfameera' },
    doneText: { en: 'It now appears on the job board with the support it offers.', am: 'አሁን ከሚሰጠው ድጋፍ ጋር በሥራ ማስታወቂያ ገጹ ላይ ይታያል።', om: 'Amma deeggarsa inni kennu wajjin boordii hojii irratti mul\'ata.' }
  });

  /* 4. JOB APPLICATION: prefilled from profile (no asking twice), voice answers, opt-in sharing */
  D.register('apply', {
    title: { en: 'Apply for this job', am: 'ለዚህ ሥራ ያመልክቱ', om: 'Hojii kanaaf iyyadhu' },
    fields: [
      withName({ id: 'name', type: 'text', autocomplete: 'name', prefill: { from: 'profile', key: ['full_name', 'name'] },
        label: { en: 'Your name for this application', am: 'ለዚህ ማመልከቻ ስምዎ', om: 'Maqaa kee iyyannoo kanaaf' } }),
      { id: 'phone', type: 'tel', prefill: { from: 'profile', key: 'phone' }, label: { en: 'Your phone number', am: 'ስልክ ቁጥርዎ', om: 'Lakkoofsa bilbila keetii' } },
      { id: 'why', type: 'textarea', label: { en: 'Why do you want this job?', am: 'ይህን ሥራ ለምን ይፈልጋሉ?', om: 'Hojii kana maaliif barbaadda?' },
        hint: { en: 'A few sentences are enough. You can type, or answer by voice and check the words before they are used.', am: 'ጥቂት ዓረፍተ ነገሮች ይበቃሉ። መጻፍ፣ ወይም በድምፅ መልሰው ቃላቱን ከመጠቀምዎ በፊት ማረጋገጥ ይችላሉ።', om: 'Himoonni muraasni ni ga\'u. Barreessuu, ykn sagaleen deebiftee jechoota osoo hin fayyadamin dura ilaaluu dandeessa.' } },
      { id: 'experience', type: 'textarea', label: { en: 'What work or learning have you done before?', am: 'ከዚህ በፊት ምን ዓይነት ሥራ ወይም ትምህርት አከናውነዋል?', om: 'Kanaan dura hojii ykn barnoota akkamii hojjette?' },
        hint: { en: 'Paid work, volunteering, courses and family business all count.', am: 'የሚከፈልበት ሥራ፣ በጎ ፈቃድ፣ ኮርሶችና የቤተሰብ ንግድ ሁሉም ይቆጠራሉ።', om: 'Hojiin kaffaltii qabu, tola ooltummaan, koorsiiwwan fi daldalli maatii hundi ni lakkaa\'amu.' } },
      { id: 'interview', type: 'multi', optional: true, label: { en: 'How would you like to be interviewed?', am: 'ቃለ መጠይቁ እንዴት እንዲሆን ይፈልጋሉ?', om: 'Akkamitti gaafatamuu barbaadda?' },
        options: [
          { value: 'phone', icon: '📞', label: { en: 'By phone', am: 'በስልክ', om: 'Bilbilaan' }, say: ['phone', 'ስልክ'] },
          { value: 'in_person', icon: '🧑‍🤝‍🧑', label: { en: 'In person', am: 'በአካል', om: 'Fuulaa fuulatti' }, say: ['person', 'አካል'] },
          { value: 'written', icon: '📝', label: { en: 'Written questions', am: 'በጽሑፍ ጥያቄዎች', om: 'Gaaffii barreeffamaan' }, say: ['written', 'ጽሑፍ'] },
          { value: 'interpreter', icon: '🤟', label: { en: 'With a sign language interpreter', am: 'ከምልክት ቋንቋ አስተርጓሚ ጋር', om: 'Hiikaa afaan mallattoo wajjin' }, say: ['interpreter', 'sign', 'አስተርጓሚ'] }
        ] },
      { id: 'share_passport', type: 'choice', sensitive: true, showIf: function () { var p = D.store.get('passport', null); return !!(p && p.needs && p.needs.length); },
        label: { en: 'Do you want to share your Support Passport with this employer?', am: 'የድጋፍ ፓስፖርትዎን ለዚህ ቀጣሪ ማጋራት ይፈልጋሉ?', om: 'Paaspoortii Deeggarsaa kee qacaraa kanaaf qooduu barbaaddaa?' },
        hint: { en: 'You decide for each job. Saying no never affects your application.', am: 'ለእያንዳንዱ ሥራ እርስዎ ይወስናሉ። «አይ» ማለት ማመልከቻዎን አይጎዳም።', om: 'Hojii hundaaf ati murteessita. Lakki jechuun iyyannoo kee gonkumaa hin miidhu.' },
        body: function (lang) {
          var list = D.supportForEmployer({ share_passport: 'share' }).map(function (n) { return D.label(n.label, lang); }).join('; ');
          if (lang === 'am') return 'ካጋሩ ቀጣሪው የሚያየው ይህን ዝርዝር ብቻ ነው፦ ' + list + '። ምክንያት፣ ሁኔታ ወይም በራስዎ ቃላት የጻፉት በፍጹም አይጋራም።';
          if (lang === 'om') return 'Yoo qoodde, qacaraan tarree kana qofa arga: ' + list + '. Sababa, haala fayyaa, ykn waan jechoota keetiin barreessite gonkumaa hin argu.';
          return 'If you share, the employer sees exactly this list: ' + list + '. Never a reason, a condition, or what you wrote in your own words.';
        },
        options: [
          { value: 'share', icon: '📤', label: { en: 'Yes, share my support list', am: 'አዎ፣ የድጋፍ ዝርዝሬን አጋራ', om: 'Eeyyee, tarree deeggarsaa koo qoodi' }, say: ['yes', 'share', 'አዎ', 'አጋራ'] },
          { value: 'keep', icon: '🔒', label: { en: 'No, keep it private', am: 'አይ፣ በምስጢር ይቆይ', om: 'Lakki, dhuunfaan haa turu' }, say: ['no', 'private', 'keep', 'አይ'] }
        ] }
    ],
    submitLabel: { en: 'Send my application', am: 'ማመልከቻዬን ላክ', om: 'Iyyannoo koo ergi' },
    doneTitle: { en: 'Your application is sent', am: 'ማመልከቻዎ ተልኳል', om: 'Iyyannoon kee ergameera' },
    doneText: { en: 'Below is exactly what the employer receives.', am: 'ከዚህ በታች ቀጣሪው በትክክል የሚቀበለው ይታያል።', om: 'Armaan gaditti waan qacaraan argatu sirriitti jira.' }
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
    if (lang === 'om') return (r.staff ? r.staff + ' ' + org + ' irraa' : org) + ' akka galmooftu si gargaare.';
    return (r.staff ? r.staff + ' from ' + org : org) + ' helped you sign up.';
  }
  var takeoverFields = ['name', 'phone', 'id_route', 'id_number', 'referral_partner', 'dob'];
  D.register('takeover', {
    title: { en: 'Take over your account', am: 'መለያዎን ይረከቡ', om: 'Herrega kee fudhadhu' },
    startAt: 'review',
    allowLater: false,
    fields: [], // filled in below, from the profile form
    reviewTitle: { en: 'Take over your account', am: 'መለያዎን ይረከቡ', om: 'Herrega kee fudhadhu' },
    reviewHint: function (lang) {
      return helper(lang) + ({ am: ' ያስገቡትን ያረጋግጡ፤ የተሳሳተውን ይቀይሩ። ከዚህ በኋላ መለያውን የሚጠቀሙት እርስዎ ብቻ ነዎት።',
        om: ' Waan galchan ilaali, kan dogoggora ta\'e jijjiiri. Kana booda herrega kana kan fayyadamu ati qofa.' }[lang] ||
        ' Check what they entered and change anything that is wrong. After this, only you use this account.');
    },
    reviewNote: { en: 'When you finish, your helper\'s name is removed from your profile; only the organisation is kept. Your helper cannot see your Support Passport: fill it in yourself, when you are ready.', am: 'ሲጨርሱ የረዳዎት ሰው ስም ከመገለጫዎ ይሰረዛል፤ የድርጅቱ ስም ብቻ ይቀመጣል። የረዳዎት ሰው የድጋፍ ፓስፖርትዎን ማየት አይችልም፤ ሲዘጋጁ ራስዎ ይሙሉት።', om: 'Yeroo xumurtu, maqaan nama si gargaaree piroofaayilii kee irraa haqama; kan hafu dhaabbaticha qofa. Namni si gargaare Paaspoortii Deeggarsaa kee arguu hin danda\'u: yeroo qophoofte ofii keetii guuti.' },
    submitLabel: { en: 'This is my account now', am: 'ይህ አሁን የእኔ መለያ ነው', om: 'Amma herregni kun kan koo ti' },
    doneTitle: { en: 'Your account is now yours', am: 'መለያው አሁን የእርስዎ ነው', om: 'Herregni kee amma kan kee ti' },
    doneText: { en: 'Only you use it from now on. Your helper\'s name has been removed.', am: 'ከአሁን ጀምሮ የሚጠቀሙት እርስዎ ብቻ ነዎት። የረዳዎት ሰው ስም ተሰርዟል።', om: 'Amma booda kan itti fayyadamu ati qofa. Maqaan nama si gargaaree haqameera.' }
  });

  D.register('profile', {
    title: { en: 'My profile', am: 'የእኔ መገለጫ', om: 'Piroofaayilii koo' },
    startAt: 'review',
    fields: [
      fromSignup('name', { prefill: { from: 'profile', key: 'name' } }),
      withName({ id: 'full_name', type: 'text', optional: true, autocomplete: 'name', prefill: { from: 'profile', key: 'full_name' },
        reviewLabel: { en: 'Full name (optional)', am: 'ሙሉ ስም (አማራጭ)', om: 'Maqaa guutuu (dirqama miti)' },
        label: { en: 'What is your full name?', am: 'ሙሉ ስምዎ ማን ነው?', om: 'Maqaan kee guutuun eenyu?' },
        hint: { en: 'Optional. Add it only if you want it on job applications. Amharic or English letters are both fine.', am: 'አማራጭ። በሥራ ማመልከቻዎች ላይ እንዲታይ ከፈለጉ ብቻ ይጨምሩት። የአማርኛም የእንግሊዝኛም ፊደላት ይቻላሉ።', om: 'Dirqama miti. Yoo iyyannoo hojii irratti akka mul\'atu barbaadde qofa dabali. Qubeen Afaan Amaaraa, Afaan Oromoo ykn Ingiliffaa hundi ni ta\'u.' } }),
      fromSignup('phone', { prefill: { from: 'profile', key: 'phone' }, reviewLabel: { en: 'Phone number', am: 'ስልክ ቁጥር', om: 'Lakkoofsa bilbilaa' } }),
      fromSignup('id_route', { prefill: { from: 'profile', key: 'id_route' } }),
      fromSignup('id_number', { reviewLabel: { en: 'ID number (only if you want to add or change it)', am: 'የመታወቂያ ቁጥር (መጨመር ወይም መቀየር ከፈለጉ ብቻ)', om: 'Lakkoofsa eenyummaa (yoo dabaluu ykn jijjiiruu barbaadde qofa)' } }),
      fromSignup('referral_partner', { prefill: { from: 'profile', key: 'referral_partner' }, reviewLabel: { en: 'Organisation that can confirm who you are', am: 'ማንነትዎን የሚያረጋግጥ ድርጅት', om: 'Dhaabbata eenyummaa kee mirkaneessuu danda\'u' } }),
      fromSignup('dob', { prefill: { from: 'profile', key: 'dob' }, reviewLabel: { en: 'Date of birth', am: 'የትውልድ ቀን', om: 'Guyyaa dhalootaa' } })
    ],
    reviewTitle: { en: 'My profile', am: 'የእኔ መገለጫ', om: 'Piroofaayilii koo' },
    reviewHint: { en: 'These are the details you gave us. Choose "Change" to update one, then save.', am: 'እነዚህ የሰጡን ዝርዝሮች ናቸው። አንዱን ለማዘመን "ቀይር"ን ይምረጡ፣ ከዚያ ያስቀምጡ።', om: 'Kunneen odeeffannoo ati nuuf kennite dha. Tokko haaromsuuf "Jijjiiri" filadhu, achiis kuusi.' },
    reviewNote: { en: 'Your profile is stored on this phone. We never ask for a photo of your ID, and IDs are never checked automatically.', am: 'መገለጫዎ በዚህ ስልክ ላይ ተቀምጧል። የመታወቂያዎን ፎቶ በፍጹም አንጠይቅም፤ መታወቂያዎችም በራስ-ሰር አይረጋገጡም።', om: 'Piroofaayiliin kee bilbila kana irratti kuufameera. Suuraa eenyummaa kee gonkumaa hin gaafannu, eenyummaanis ofumaan gonkumaa hin mirkanaa\'u.' },
    submitLabel: { en: 'Save my changes', am: 'ለውጦቼን አስቀምጥ', om: 'Jijjiirama koo kuusi' },
    doneTitle: { en: 'Your profile is updated', am: 'መገለጫዎ ተዘምኗል', om: 'Piroofaayiliin kee haaromfameera' },
    doneText: { en: 'Forms will now be filled in with your new details.', am: 'ቅጾች ከአሁን ጀምሮ በአዲሱ ዝርዝርዎ ይሞላሉ።', om: 'Amma unkaaleen odeeffannoo kee haaraan guutamu.' }
  });
  D.forms.takeover.fields = D.forms.profile.fields.filter(function (f) { return takeoverFields.indexOf(f.id) !== -1; });
})();
