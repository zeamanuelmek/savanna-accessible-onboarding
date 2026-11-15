# Amharic audio script: sign-up, Add your ID and Support Passport

> Generated from the live text (`forms.js`, `savanna-onboarding.js` and `journey/journey.js`, module 0.12.0) on
> 15 Nov 2026, so every line matches the screen word for word. Change the text **in the code first**, then regenerate this
> list (`node tools/audio-script.cjs`), so screen and audio never differ.
>
> **Demo audio:** the clips are generated with Microsoft's Amharic neural voice (edge-tts, an unofficial tool) by
> `python tools/generate-audio.py`. They will be replaced with human recordings, or Microsoft's official Azure service,
> in the hardening sprint. Human recordings use the same file names (see "How to record").
> Each clip plays from the "Listen" button and the per-option play buttons. Audio is never required: every clip has the
> same words on screen (WCAG 1.2.1). Amharic only: Afaan Oromo has no Microsoft voice and stays text only.

## How to record

- **Format:** MP3 (recommended), mono, 44.1 kHz or 48 kHz, 64–96 kbps, ideally under 300 KB (small files for 3G).
  M4A (AAC) also works: keep the same name with `.m4a`. One clip per file, file names exactly as listed.
- **Where:** `savanna-onboarding/assets/audio/am/`.
- **Check:** from `savanna-onboarding/`, run `node tools/check-audio.cjs`. It lists found, missing and broken clips
  and writes `assets/audio/manifest.json`. Commit the clips and the manifest together: a clip that is not in the
  manifest is never played.
- **Missing clips are fine:** the phone's voice reads instead (if it has one); otherwise a short message says the
  words are on the screen. Audio is never required.
- **Recorded for later:** six clips under "On every screen when needed" are not played yet: `help`, `resumed`,
  `prefilled`, `voice-consent`, `voice-check` and `voice-used`. Record them last. (The error clips and
  `saved-for-later` are played.)
- **Voice:** calm, slow and clear, as if to someone hearing it for the first time. Leave about half a second of silence
  at the start and end. No music.
- **Lengths** are estimates (about 4 syllables a second, plus a pause). Natural speech that runs longer is fine.
- **Names stay as written:** AAAPD, Tomorrow is Better, RRS / UNHCR, Fayda, ALX, Google.
- Read numbers as the learner will see them (for example "0911 234 567" digit by digit).

**79 clips, about 11 minutes of audio in total.**

## Start

| # | File | Exact Amharic text | About | Note |
|---|---|---|---|---|
| 1 | `am/home-question.mp3` | <span lang="am">እንዴት መመዝገብ ይፈልጋሉ? ይህ ቅጹን መሙላት የሚመርጡበትን መንገድ ብቻ ነው። በማንኛውም ጊዜ በቅንብሮች ውስጥ መቀየር ይችላሉ።</span> | 18 s | Home page (the four answers below are shared) |
| 2 | `am/welcome-question.mp3` | <span lang="am">ምዝገባውን እንዴት መሙላት ይፈልጋሉ? ይህ ቅጹን መጠቀም የሚመርጡበትን መንገድ ብቻ ነው። በማንኛውም ጊዜ በቅንብሮች ውስጥ መቀየር ይችላሉ።</span> | 19 s | Inside the form (test page and other sites) |
| 3 | `am/welcome-option-read-type.mp3` | <span lang="am">አንብቤ እጽፋለሁ</span> | 3 s |  |
| 4 | `am/welcome-option-listen.mp3` | <span lang="am">አዳምጬ እመልሳለሁ</span> | 4 s |  |
| 5 | `am/welcome-option-speak.mp3` | <span lang="am">በድምፅ እመልሳለሁ</span> | 4 s |  |
| 6 | `am/welcome-option-simple.mp3` | <span lang="am">ቀላል ደረጃዎች ከሥዕልና ከትልቅ ጽሑፍ ጋር</span> | 7 s |  |

## Sign-up

| # | File | Exact Amharic text | About | Note |
|---|---|---|---|---|
| 7 | `am/signup-filler-question.mp3` | <span lang="am">ይህን ቅጽ የሚሞላው ማን ነው?</span> | 5 s |  |
| 8 | `am/signup-filler-option-self.mp3` | <span lang="am">እኔ፣ ለራሴ</span> | 3 s |  |
| 9 | `am/signup-filler-option-partner.mp3` | <span lang="am">አጋር ድርጅት፣ ከተማሪው ጋር</span> | 5 s |  |
| 10 | `am/signup-partner-org-question.mp3` | <span lang="am">ከየትኛው ድርጅት ነዎት?</span> | 4 s | Only when filler = partner |
| 11 | `am/signup-partner-org-option-aaapd.mp3` | <span lang="am">AAAPD (የአዲስ አበባ አካል ጉዳተኞች ማኅበር)</span> | 6 s |  |
| 12 | `am/signup-partner-org-option-tib.mp3` | <span lang="am">Tomorrow is Better</span> | 3 s |  |
| 13 | `am/signup-partner-org-option-other.mp3` | <span lang="am">ሌላ ድርጅት</span> | 3 s |  |
| 14 | `am/signup-staff-name-question.mp3` | <span lang="am">የእርስዎ ስም ማን ነው? (ሠራተኛ) ተማሪው መለያውን ሲረከብ ስምዎን ያያል። ከዚያ በኋላ ይሰረዛል፤ የድርጅትዎ ስም ብቻ ይቀመጣል።</span> | 17 s | Only when filler = partner |
| 15 | `am/signup-learner-consent-question.mp3` | <span lang="am">ተማሪ፦ ይህ ሰው ቅጹን አብሮዎት እንዲሞላ ይስማማሉ? እባክዎ ይህን ለተማሪው ጮክ ብለው ያንብቡ። ተማሪው በድምፅ ወይም በመንካት ይመልሳል።</span> | 19 s | Only when filler = partner |
| 16 | `am/signup-learner-consent-option-yes.mp3` | <span lang="am">አዎ፣ እስማማለሁ</span> | 3 s |  |
| 17 | `am/signup-learner-consent-option-no.mp3` | <span lang="am">አልስማማም</span> | 3 s |  |
| 18 | `am/signup-name-question.mp3` | <span lang="am">ምን ብለን እንጥራዎ? የአማርኛም የእንግሊዝኛም ፊደላት ይቻላሉ። ከፈለጉ ሙሉ ስምዎን በኋላ በ«የእኔ መገለጫ» ውስጥ መጨመር ይችላሉ።</span> | 18 s |  |
| 19 | `am/signup-phone-question.mp3` | <span lang="am">ስልክ ቁጥርዎ ስንት ነው? ለመቀጠል ሊንክ ለመላክ ብቻ እንጠቀምበታለን። ለምሳሌ 0911 234 567።</span> | 14 s |  |
| 20 | `am/signup-dob-question.mp3` | <span lang="am">መቼ ተወለዱ? መጀመሪያ የኢትዮጵያ ወይም የፈረንጆች አቆጣጠር ይምረጡ። እርግጠኛ ካልሆኑ መዝለል ይችላሉ።</span> | 15 s |  |
| 21 | `am/signup-dob-calendar.mp3` | <span lang="am">የትኛውን አቆጣጠር ይጠቀማሉ?</span> | 5 s | Date question: calendar choice |
| 22 | `am/signup-dob-option-eth.mp3` | <span lang="am">የኢትዮጵያ አቆጣጠር</span> | 4 s |  |
| 23 | `am/signup-dob-option-greg.mp3` | <span lang="am">የፈረንጆች (የአውሮፓ) አቆጣጠር</span> | 5 s |  |
| 24 | `am/signup-consent-question.mp3` | <span lang="am">መልሶችዎን በምንይዝበት መንገድ ይስማማሉ? እዚህ የሚነግሩንን ብቻ እንይዛለን። መጀመሪያ እርስዎን ሳንጠይቅ ለማንም አናጋራም። መልሶችዎን በማንኛውም ጊዜ መቀየር ወይም መሰረዝ ይችላሉ።</span> | 25 s |  |
| 25 | `am/signup-consent-option-yes.mp3` | <span lang="am">አዎ፣ እስማማለሁ</span> | 3 s |  |
| 26 | `am/signup-consent-option-no.mp3` | <span lang="am">አይ፣ አልስማማም</span> | 3 s |  |
| 27 | `am/signup-check-answers.mp3` | <span lang="am">መልሶችዎን ያረጋግጡ። ከመላክዎ በፊት ሁሉም ትክክል መሆኑን ያረጋግጡ።</span> | 10 s |  |
| 28 | `am/signup-done.mp3` | <span lang="am">እንኳን ደህና መጡ! መለያዎ ዝግጁ ነው። አሁን መማር መጀመር ይችላሉ።</span> | 10 s |  |

## Add your ID (optional), from My profile

| # | File | Exact Amharic text | About | Note |
|---|---|---|---|---|
| 29 | `am/identity-id-route-question.mp3` | <span lang="am">የትኛው መታወቂያ አለዎት? ከእነዚህ ማንኛውም ይበቃል። ያለ መታወቂያም መማር መጀመር ይችላሉ።</span> | 13 s |  |
| 30 | `am/identity-id-route-option-fayda.mp3` | <span lang="am">ፋይዳ ብሔራዊ መታወቂያ</span> | 4 s |  |
| 31 | `am/identity-id-route-option-kebele.mp3` | <span lang="am">የቀበሌ መታወቂያ</span> | 3 s |  |
| 32 | `am/identity-id-route-option-passport.mp3` | <span lang="am">ፓስፖርት</span> | 2 s |  |
| 33 | `am/identity-id-route-option-refugee.mp3` | <span lang="am">የስደተኛ መታወቂያ ወይም የምዝገባ ማረጋገጫ</span> | 7 s |  |
| 34 | `am/identity-id-route-option-other.mp3` | <span lang="am">ሌላ ሰነድ</span> | 2 s |  |
| 35 | `am/identity-id-route-option-none.mp3` | <span lang="am">ምንም የለኝም። በአጋር ድርጅት በኩል ይመዝግቡኝ።</span> | 8 s |  |
| 36 | `am/identity-id-number-question.mp3` | <span lang="am">በመታወቂያዎ ላይ ያለው ቁጥር ስንት ነው? ይህን መዝለልና በኋላ መጨመር ይችላሉ። ቁጥሩን ካስገቡ ሁኔታዎ «ቁጥር ተመዝግቧል — አልተረጋገጠም» ይሆናል። ለግላዊነትዎ የመታወቂያ ቁጥሮች በድምፅ ሳይሆን በመጻፍ ይገባሉ። የሚያምኑትን ሰው እንዲጽፍልዎ መጠየቅ ይችላሉ።</span> | 34 s | Only when id_route is one of fayda, kebele, passport, refugee, other |
| 37 | `am/identity-referral-partner-question.mp3` | <span lang="am">ማንነትዎን የትኛው ድርጅት ሊያረጋግጥ ይችላል? እነሱ ያገኙዎታል። እየጠበቁ መማር መጀመር ይችላሉ።</span> | 14 s | Only when id_route = none |
| 38 | `am/identity-referral-partner-option-aaapd.mp3` | <span lang="am">AAAPD</span> | 2 s |  |
| 39 | `am/identity-referral-partner-option-tib.mp3` | <span lang="am">Tomorrow is Better</span> | 3 s |  |
| 40 | `am/identity-referral-partner-option-unhcr-partner.mp3` | <span lang="am">የስደተኞች ድጋፍ ድርጅት</span> | 4 s |  |
| 41 | `am/identity-referral-partner-option-unsure.mp3` | <span lang="am">እርግጠኛ አይደለሁም። እንድመርጥ እርዱኝ።</span> | 7 s |  |
| 42 | `am/identity-check-answers.mp3` | <span lang="am">መልሶችዎን ያረጋግጡ። ከመላክዎ በፊት ሁሉም ትክክል መሆኑን ያረጋግጡ።</span> | 10 s |  |
| 43 | `am/identity-done.mp3` | <span lang="am">የመታወቂያ ዝርዝርዎ ተቀምጧል መታወቂያዎ እንደሰጡት ተመዝግቧል፤ አልተረጋገጠም። ይህን በማንኛውም ጊዜ በ«የእኔ መገለጫ» ውስጥ መቀየር ይችላሉ።</span> | 20 s |  |

## Support Passport

| # | File | Exact Amharic text | About | Note |
|---|---|---|---|---|
| 44 | `am/passport-want-question.mp3` | <span lang="am">ለመማርና ለመሥራት የሚረዳዎትን ሊነግሩን ይፈልጋሉ? ይህ አማራጭ ነው። ምንም ሰነድ አያስፈልግም።</span> | 14 s |  |
| 45 | `am/passport-want-option-yes.mp3` | <span lang="am">አዎ</span> | 2 s |  |
| 46 | `am/passport-want-option-later.mp3` | <span lang="am">አሁን አይደለም</span> | 3 s |  |
| 47 | `am/passport-needs-question.mp3` | <span lang="am">ምን ይረዳዎታል? የሚስማሙትን ሁሉ ይምረጡ።</span> | 7 s | Only when want = yes |
| 48 | `am/passport-needs-option-screen-reader.mp3` | <span lang="am">ከስክሪን አንባቢ ጋር የሚሰራ</span> | 5 s |  |
| 49 | `am/passport-needs-option-audio.mp3` | <span lang="am">ሁሉም ነገር በድምፅ</span> | 4 s |  |
| 50 | `am/passport-needs-option-sign-language.mp3` | <span lang="am">የምልክት ቋንቋ አስተርጓሚ</span> | 5 s |  |
| 51 | `am/passport-needs-option-captions.mp3` | <span lang="am">በቪዲዮና በጥሪ ላይ የጽሑፍ ትርጉም</span> | 6 s |  |
| 52 | `am/passport-needs-option-simple-words.mp3` | <span lang="am">ቀላል ቃላት</span> | 3 s |  |
| 53 | `am/passport-needs-option-written.mp3` | <span lang="am">በጽሑፍ የተሰጠ መመሪያ</span> | 4 s |  |
| 54 | `am/passport-needs-option-step-free.mp3` | <span lang="am">ደረጃ የሌለው መግቢያ</span> | 4 s |  |
| 55 | `am/passport-needs-option-extra-time.mp3` | <span lang="am">ለሥራና ለፈተና ተጨማሪ ጊዜ</span> | 5 s |  |
| 56 | `am/passport-needs-option-flexible-hours.mp3` | <span lang="am">ተለዋዋጭ የሥራ ሰዓት</span> | 4 s |  |
| 57 | `am/passport-needs-option-remote.mp3` | <span lang="am">ከቤት መሥራት</span> | 3 s |  |
| 58 | `am/passport-needs-option-helper.mp3` | <span lang="am">ቅጽ ለመሙላት የሚረዳ ሰው</span> | 4 s |  |
| 59 | `am/passport-other-need-question.mp3` | <span lang="am">የሚረዳዎት ሌላ ነገር አለ? በራስዎ ቃላት ይጻፉ።</span> | 7 s | Only when want = yes |
| 60 | `am/passport-sharing-question.mp3` | <span lang="am">ይህን ማን ማየት ይችላል? ለእርስዎ «የግል» ተመርጧል። በማንኛውም ጊዜ መቀየር ይችላሉ።</span> | 12 s | Only when want = yes |
| 61 | `am/passport-sharing-option-ask.mp3` | <span lang="am">እኔ ብቻ። ለሥራ ባመለከትኩ ቁጥር ጠይቁኝ።</span> | 7 s |  |
| 62 | `am/passport-sharing-option-trainers.mp3` | <span lang="am">እኔና በALX ያሉ አሰልጣኞቼ</span> | 5 s |  |
| 63 | `am/passport-check-answers.mp3` | <span lang="am">መልሶችዎን ያረጋግጡ። ከመላክዎ በፊት ሁሉም ትክክል መሆኑን ያረጋግጡ።</span> | 10 s |  |
| 64 | `am/passport-check-answers-note.mp3` | <span lang="am">ይህ በስልክዎ ላይ ይቆያል። ለቀጣሪ የሚጋራው ሲያመለክቱ ለማጋራት ከመረጡ ብቻ ነው።</span> | 12 s |  |
| 65 | `am/passport-done.mp3` | <span lang="am">የድጋፍ ፓስፖርትዎ ተቀምጧል በማንኛውም ጊዜ መቀየር ይችላሉ። አሁን ይህን ድጋፍ የሚሰጡ ሥራዎችን ማግኘት ይችላሉ።</span> | 16 s |  |

## On every screen when needed

| # | File | Exact Amharic text | About | Note |
|---|---|---|---|---|
| 66 | `am/help.mp3` | <span lang="am">እርዳታ ይፈልጋሉ? የጊዜ ገደብ የለም። መልሶችዎ ከእያንዳንዱ ጥያቄ በኋላ በዚህ ስልክ ላይ ይቀመጣሉ። እንደ AAAPD ያለ አጋር ድርጅት አብሮዎት እንዲሞላ መጠየቅ ወይም በኋላ መመለስ ይችላሉ።</span> | 25 s |  |
| 67 | `am/resumed.mp3` | <span lang="am">እንኳን ደህና መጡ። መልሶችዎን አስቀምጠናል።</span> | 7 s |  |
| 68 | `am/prefilled.mp3` | <span lang="am">ይህን ከመገለጫዎ ሞልተነዋል። መቀየር ይችላሉ።</span> | 7 s |  |
| 69 | `am/error-choose-one.mp3` | <span lang="am">ለመቀጠል አንድ መልስ ይምረጡ።</span> | 5 s |  |
| 70 | `am/error-choose-some.mp3` | <span lang="am">ቢያንስ አንድ መልስ ይምረጡ።</span> | 5 s |  |
| 71 | `am/error-required.mp3` | <span lang="am">ለመቀጠል እባክዎ ይህን ጥያቄ ይመልሱ።</span> | 6 s |  |
| 72 | `am/error-phone.mp3` | <span lang="am">ባለ 10 አሃዝ ስልክ ቁጥር ያስገቡ፤ ለምሳሌ 0911 234 567።</span> | 9 s |  |
| 73 | `am/error-date.mp3` | <span lang="am">በኢትዮጵያ አቆጣጠር ትክክለኛ ቀን ያስገቡ። ቀን ከ1 እስከ 30፣ ጳጉሜን ከ1 እስከ 5 ወይም 6።</span> | 13 s |  |
| 74 | `am/error-consent.mp3` | <span lang="am">ለመቀጠል መስማማት ያስፈልጋል። እርግጠኛ ካልሆኑ "እርዳታ"ን ይምረጡ።</span> | 10 s |  |
| 75 | `am/error-mode.mp3` | <span lang="am">ለመቀጠል አንድ መንገድ ይምረጡ።</span> | 5 s |  |
| 76 | `am/voice-consent.mp3` | <span lang="am">ድምፅዎን ከመጠቀምዎ በፊት። ድምፅዎን ወደ ጽሑፍ ለመቀየር ቅጂዎ ወደ የንግግር አገልግሎት ይላካል፦ ለአማርኛና ለአፋን ኦሮሞ Addis AI (ኢትዮጵያ)፣ ለእንግሊዝኛ ወይም Addis AI በማይገኝበት ጊዜ Google (በChrome)። በምትኩ መጻፍ ወይም መንካት ይችላሉ። ይህን በማንኛውም ጊዜ በቅንብሮች ውስጥ ማጥፋት ይችላሉ። ድምፅዎን መጠቀም ይፈልጋሉ?</span> | 42 s |  |
| 77 | `am/voice-check.mp3` | <span lang="am">ያረጋግጡት፤ ካስፈለገም ያስተካክሉት። «ይህን መልስ ተጠቀም»ን እስኪመርጡ ድረስ ምንም አይቀመጥም።</span> | 14 s |  |
| 78 | `am/voice-used.mp3` | <span lang="am">ከድምፅዎ መልስ ተጨምሯል። ያረጋግጡት፤ ከዚያ «ቀጥል»ን ይምረጡ።</span> | 9 s |  |
| 79 | `am/saved-for-later.mp3` | <span lang="am">መልሶችዎ ተቀምጠዋል። ምንም አልጠፋም። ለመቀጠል ይህን ሊንክ በዚህ ስልክ ይክፈቱ፦</span> | 12 s |  |

## Not in this list (later, if time allows)

- English versions (the device voice usually reads English well enough).
- Job board, job application and employer form.
- Messages that contain a changing number (for example "There are now 10 questions"): read by the device voice.
