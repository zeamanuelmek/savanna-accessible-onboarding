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

**179 clips, about 16 minutes of audio in total.**

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
| 19 | `am/signup-phone-question.mp3` | <span lang="am">ስልክ ቁጥርዎ ስንት ነው? ለመቀጠል ሊንክ ለመላክ ብቻ እንጠቀምበታለን። ለምሳሌ 0911 23 45 67።</span> | 14 s |  |
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
| 72 | `am/error-phone.mp3` | <span lang="am">ባለ 10 አሃዝ ስልክ ቁጥር ያስገቡ፤ ለምሳሌ 0911 23 45 67።</span> | 9 s |  |
| 73 | `am/error-date.mp3` | <span lang="am">በኢትዮጵያ አቆጣጠር ትክክለኛ ቀን ያስገቡ። ቀን ከ1 እስከ 30፣ ጳጉሜን ከ1 እስከ 5 ወይም 6።</span> | 13 s |  |
| 74 | `am/error-consent.mp3` | <span lang="am">ለመቀጠል መስማማት ያስፈልጋል። እርግጠኛ ካልሆኑ "እርዳታ"ን ይምረጡ።</span> | 10 s |  |
| 75 | `am/error-mode.mp3` | <span lang="am">ለመቀጠል አንድ መንገድ ይምረጡ።</span> | 5 s |  |
| 76 | `am/voice-consent.mp3` | <span lang="am">ድምፅዎን ከመጠቀምዎ በፊት። ድምፅዎን ወደ ጽሑፍ ለመቀየር ቅጂዎ ወደ የንግግር አገልግሎት ይላካል፦ ለአማርኛና ለአፋን ኦሮሞ Addis AI (ኢትዮጵያ)፣ ለእንግሊዝኛ ወይም Addis AI በማይገኝበት ጊዜ Google (በChrome)። በምትኩ መጻፍ ወይም መንካት ይችላሉ። ይህን በማንኛውም ጊዜ በቅንብሮች ውስጥ ማጥፋት ይችላሉ። ድምፅዎን መጠቀም ይፈልጋሉ?</span> | 42 s |  |
| 77 | `am/voice-check.mp3` | <span lang="am">ያረጋግጡት፤ ካስፈለገም ያስተካክሉት። «ይህን መልስ ተጠቀም»ን እስኪመርጡ ድረስ ምንም አይቀመጥም።</span> | 14 s |  |
| 78 | `am/voice-used.mp3` | <span lang="am">ከድምፅዎ መልስ ተጨምሯል። ያረጋግጡት፤ ከዚያ «ቀጥል»ን ይምረጡ።</span> | 9 s |  |
| 79 | `am/saved-for-later.mp3` | <span lang="am">መልሶችዎ ተቀምጠዋል። ምንም አልጠፋም። ለመቀጠል ይህን ሊንክ በዚህ ስልክ ይክፈቱ፦</span> | 12 s |  |

## Numbers 0-99 (phone and ID numbers, read on the phone only)

| # | File | Exact Amharic text | About | Note |
|---|---|---|---|---|
| 80 | `am/num-0.mp3` | <span lang="am">ዜሮ</span> | 2 s |  |
| 81 | `am/num-1.mp3` | <span lang="am">አንድ</span> | 2 s |  |
| 82 | `am/num-2.mp3` | <span lang="am">ሁለት</span> | 2 s |  |
| 83 | `am/num-3.mp3` | <span lang="am">ሶስት</span> | 2 s |  |
| 84 | `am/num-4.mp3` | <span lang="am">አራት</span> | 2 s |  |
| 85 | `am/num-5.mp3` | <span lang="am">አምስት</span> | 2 s |  |
| 86 | `am/num-6.mp3` | <span lang="am">ስድስት</span> | 2 s |  |
| 87 | `am/num-7.mp3` | <span lang="am">ሰባት</span> | 2 s |  |
| 88 | `am/num-8.mp3` | <span lang="am">ስምንት</span> | 2 s |  |
| 89 | `am/num-9.mp3` | <span lang="am">ዘጠኝ</span> | 2 s |  |
| 90 | `am/num-10.mp3` | <span lang="am">አስር</span> | 2 s |  |
| 91 | `am/num-11.mp3` | <span lang="am">አስራ አንድ</span> | 3 s |  |
| 92 | `am/num-12.mp3` | <span lang="am">አስራ ሁለት</span> | 3 s |  |
| 93 | `am/num-13.mp3` | <span lang="am">አስራ ሶስት</span> | 3 s |  |
| 94 | `am/num-14.mp3` | <span lang="am">አስራ አራት</span> | 3 s |  |
| 95 | `am/num-15.mp3` | <span lang="am">አስራ አምስት</span> | 3 s |  |
| 96 | `am/num-16.mp3` | <span lang="am">አስራ ስድስት</span> | 3 s |  |
| 97 | `am/num-17.mp3` | <span lang="am">አስራ ሰባት</span> | 3 s |  |
| 98 | `am/num-18.mp3` | <span lang="am">አስራ ስምንት</span> | 3 s |  |
| 99 | `am/num-19.mp3` | <span lang="am">አስራ ዘጠኝ</span> | 3 s |  |
| 100 | `am/num-20.mp3` | <span lang="am">ሃያ</span> | 2 s |  |
| 101 | `am/num-21.mp3` | <span lang="am">ሃያ አንድ</span> | 2 s |  |
| 102 | `am/num-22.mp3` | <span lang="am">ሃያ ሁለት</span> | 2 s |  |
| 103 | `am/num-23.mp3` | <span lang="am">ሃያ ሶስት</span> | 2 s |  |
| 104 | `am/num-24.mp3` | <span lang="am">ሃያ አራት</span> | 2 s |  |
| 105 | `am/num-25.mp3` | <span lang="am">ሃያ አምስት</span> | 3 s |  |
| 106 | `am/num-26.mp3` | <span lang="am">ሃያ ስድስት</span> | 3 s |  |
| 107 | `am/num-27.mp3` | <span lang="am">ሃያ ሰባት</span> | 2 s |  |
| 108 | `am/num-28.mp3` | <span lang="am">ሃያ ስምንት</span> | 3 s |  |
| 109 | `am/num-29.mp3` | <span lang="am">ሃያ ዘጠኝ</span> | 2 s |  |
| 110 | `am/num-30.mp3` | <span lang="am">ሰላሳ</span> | 2 s |  |
| 111 | `am/num-31.mp3` | <span lang="am">ሰላሳ አንድ</span> | 3 s |  |
| 112 | `am/num-32.mp3` | <span lang="am">ሰላሳ ሁለት</span> | 3 s |  |
| 113 | `am/num-33.mp3` | <span lang="am">ሰላሳ ሶስት</span> | 3 s |  |
| 114 | `am/num-34.mp3` | <span lang="am">ሰላሳ አራት</span> | 3 s |  |
| 115 | `am/num-35.mp3` | <span lang="am">ሰላሳ አምስት</span> | 3 s |  |
| 116 | `am/num-36.mp3` | <span lang="am">ሰላሳ ስድስት</span> | 3 s |  |
| 117 | `am/num-37.mp3` | <span lang="am">ሰላሳ ሰባት</span> | 3 s |  |
| 118 | `am/num-38.mp3` | <span lang="am">ሰላሳ ስምንት</span> | 3 s |  |
| 119 | `am/num-39.mp3` | <span lang="am">ሰላሳ ዘጠኝ</span> | 3 s |  |
| 120 | `am/num-40.mp3` | <span lang="am">አርባ</span> | 2 s |  |
| 121 | `am/num-41.mp3` | <span lang="am">አርባ አንድ</span> | 3 s |  |
| 122 | `am/num-42.mp3` | <span lang="am">አርባ ሁለት</span> | 3 s |  |
| 123 | `am/num-43.mp3` | <span lang="am">አርባ ሶስት</span> | 3 s |  |
| 124 | `am/num-44.mp3` | <span lang="am">አርባ አራት</span> | 3 s |  |
| 125 | `am/num-45.mp3` | <span lang="am">አርባ አምስት</span> | 3 s |  |
| 126 | `am/num-46.mp3` | <span lang="am">አርባ ስድስት</span> | 3 s |  |
| 127 | `am/num-47.mp3` | <span lang="am">አርባ ሰባት</span> | 3 s |  |
| 128 | `am/num-48.mp3` | <span lang="am">አርባ ስምንት</span> | 3 s |  |
| 129 | `am/num-49.mp3` | <span lang="am">አርባ ዘጠኝ</span> | 3 s |  |
| 130 | `am/num-50.mp3` | <span lang="am">ሃምሳ</span> | 2 s |  |
| 131 | `am/num-51.mp3` | <span lang="am">ሃምሳ አንድ</span> | 3 s |  |
| 132 | `am/num-52.mp3` | <span lang="am">ሃምሳ ሁለት</span> | 3 s |  |
| 133 | `am/num-53.mp3` | <span lang="am">ሃምሳ ሶስት</span> | 3 s |  |
| 134 | `am/num-54.mp3` | <span lang="am">ሃምሳ አራት</span> | 3 s |  |
| 135 | `am/num-55.mp3` | <span lang="am">ሃምሳ አምስት</span> | 3 s |  |
| 136 | `am/num-56.mp3` | <span lang="am">ሃምሳ ስድስት</span> | 3 s |  |
| 137 | `am/num-57.mp3` | <span lang="am">ሃምሳ ሰባት</span> | 3 s |  |
| 138 | `am/num-58.mp3` | <span lang="am">ሃምሳ ስምንት</span> | 3 s |  |
| 139 | `am/num-59.mp3` | <span lang="am">ሃምሳ ዘጠኝ</span> | 3 s |  |
| 140 | `am/num-60.mp3` | <span lang="am">ስልሳ</span> | 2 s |  |
| 141 | `am/num-61.mp3` | <span lang="am">ስልሳ አንድ</span> | 3 s |  |
| 142 | `am/num-62.mp3` | <span lang="am">ስልሳ ሁለት</span> | 3 s |  |
| 143 | `am/num-63.mp3` | <span lang="am">ስልሳ ሶስት</span> | 3 s |  |
| 144 | `am/num-64.mp3` | <span lang="am">ስልሳ አራት</span> | 3 s |  |
| 145 | `am/num-65.mp3` | <span lang="am">ስልሳ አምስት</span> | 3 s |  |
| 146 | `am/num-66.mp3` | <span lang="am">ስልሳ ስድስት</span> | 3 s |  |
| 147 | `am/num-67.mp3` | <span lang="am">ስልሳ ሰባት</span> | 3 s |  |
| 148 | `am/num-68.mp3` | <span lang="am">ስልሳ ስምንት</span> | 3 s |  |
| 149 | `am/num-69.mp3` | <span lang="am">ስልሳ ዘጠኝ</span> | 3 s |  |
| 150 | `am/num-70.mp3` | <span lang="am">ሰባ</span> | 2 s |  |
| 151 | `am/num-71.mp3` | <span lang="am">ሰባ አንድ</span> | 2 s |  |
| 152 | `am/num-72.mp3` | <span lang="am">ሰባ ሁለት</span> | 2 s |  |
| 153 | `am/num-73.mp3` | <span lang="am">ሰባ ሶስት</span> | 2 s |  |
| 154 | `am/num-74.mp3` | <span lang="am">ሰባ አራት</span> | 2 s |  |
| 155 | `am/num-75.mp3` | <span lang="am">ሰባ አምስት</span> | 3 s |  |
| 156 | `am/num-76.mp3` | <span lang="am">ሰባ ስድስት</span> | 3 s |  |
| 157 | `am/num-77.mp3` | <span lang="am">ሰባ ሰባት</span> | 2 s |  |
| 158 | `am/num-78.mp3` | <span lang="am">ሰባ ስምንት</span> | 3 s |  |
| 159 | `am/num-79.mp3` | <span lang="am">ሰባ ዘጠኝ</span> | 2 s |  |
| 160 | `am/num-80.mp3` | <span lang="am">ሰማንያ</span> | 2 s |  |
| 161 | `am/num-81.mp3` | <span lang="am">ሰማንያ አንድ</span> | 3 s |  |
| 162 | `am/num-82.mp3` | <span lang="am">ሰማንያ ሁለት</span> | 3 s |  |
| 163 | `am/num-83.mp3` | <span lang="am">ሰማንያ ሶስት</span> | 3 s |  |
| 164 | `am/num-84.mp3` | <span lang="am">ሰማንያ አራት</span> | 3 s |  |
| 165 | `am/num-85.mp3` | <span lang="am">ሰማንያ አምስት</span> | 3 s |  |
| 166 | `am/num-86.mp3` | <span lang="am">ሰማንያ ስድስት</span> | 3 s |  |
| 167 | `am/num-87.mp3` | <span lang="am">ሰማንያ ሰባት</span> | 3 s |  |
| 168 | `am/num-88.mp3` | <span lang="am">ሰማንያ ስምንት</span> | 3 s |  |
| 169 | `am/num-89.mp3` | <span lang="am">ሰማንያ ዘጠኝ</span> | 3 s |  |
| 170 | `am/num-90.mp3` | <span lang="am">ዘጠና</span> | 2 s |  |
| 171 | `am/num-91.mp3` | <span lang="am">ዘጠና አንድ</span> | 3 s |  |
| 172 | `am/num-92.mp3` | <span lang="am">ዘጠና ሁለት</span> | 3 s |  |
| 173 | `am/num-93.mp3` | <span lang="am">ዘጠና ሶስት</span> | 3 s |  |
| 174 | `am/num-94.mp3` | <span lang="am">ዘጠና አራት</span> | 3 s |  |
| 175 | `am/num-95.mp3` | <span lang="am">ዘጠና አምስት</span> | 3 s |  |
| 176 | `am/num-96.mp3` | <span lang="am">ዘጠና ስድስት</span> | 3 s |  |
| 177 | `am/num-97.mp3` | <span lang="am">ዘጠና ሰባት</span> | 3 s |  |
| 178 | `am/num-98.mp3` | <span lang="am">ዘጠና ስምንት</span> | 3 s |  |
| 179 | `am/num-99.mp3` | <span lang="am">ዘጠና ዘጠኝ</span> | 3 s |  |

## Not in this list (later, if time allows)

- English versions (the device voice usually reads English well enough).
- Job board, job application and employer form.
- Messages that contain a changing number (for example "There are now 10 questions"): read by the device voice.
