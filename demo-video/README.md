# Demo scenes (recorded 20 Nov 2026 from https://savanna-accessible-onboarding.vercel.app)

Google Chrome (Chrome for Testing 153) driven by Playwright, 1920x1080, `recordVideo`; ~600 ms between actions,
typing at 150 ms per key, ~2 s pause after each result. The videos have no sound: `NN-events.json` gives the time
(ms from video start) of each audio clip (`audio-start`/`audio-end` + URL), each key and each click, plus `mark`
lines describing what is on screen. Clicks with `byKeyboard: true` came from Enter/Space, not the mouse.

| File | What | Length |
|---|---|---|
| 01-home.webm | Savanna home, choose "Listen and respond", Continue | 9 s |
| 02-voice-english.webm | **Not usable as a demo take**: English voice = "Voice: your browser"; Chrome here has no Google speech service, so the site says "No microphone was found." | 14 s |
| 03-voice-amharic.webm | Language → አማርኛ, question clips play, Answer by voice ("ድምፅ፦ Addis AI"), live Addis AI returns «መሮን», "I heard…", Use this answer | 49 s |
| 04-keyboard.webm | Keyboard only: phone → date of birth (Ethiopian calendar) → consent → check answers → account ready | 44 s |
| 05-passport.webm | Support Passport: Screen reader + Extra time, save, then My Profile → the passport card | 31 s |
| 06-jobs.webm | Jobs, private filter on, with the scene-05 passport → "0 jobs shown" (no demo job offers both) | 11 s |
| 06b-jobs-screen-reader-only.webm | Same, passport = Screen reader only → "2 jobs shown" | 11 s |
| 07-host-demo.webm | /host-demo/: sign-up, records arrive (all Pass), open the complete record → "Schema check: pass" | 31 s |
| 08-fallback.webm | Amharic name question showing "ድምፅ፦ የእርስዎ ብራውዘር" (Voice: your browser), with the proxy readiness check blocked | 10 s |

Recording aids (recording browser only; the site was not changed): a drawn mouse pointer (headless video has no
cursor; not in 04), Chrome's fake microphone (`--use-file-for-fake-audio-capture`), and in 08 the `GET /api/stt`
readiness check answered with 403.

English read-aloud: the recording machine has no speech-synthesis voices, so English reading was silent.
The `speech-synthesis` events give the text the browser was asked to say, if you want to dub it.
Amharic uses the site's recorded clips (and one Addis AI TTS `blob:` clip in 03).

`fake-mic/`: `meron-en.mp3` (edge-tts en-US-JennyNeural, "Meron") and `meron-am.mp3` (edge-tts am-ET-MekdesNeural, "መሮን"),
plus the WAVs fed to Chrome (0.8 s silence + word + 4 s silence, 48 kHz mono).

Re-record: `node tools/record-scenes.cjs [scene ids]` (needs Playwright and Google Chrome). For a working 02, run
`node tools/record-scenes.cjs 02` on a normal desktop Chrome with Google speech (untested whether Chrome's English
recognition accepts the fake microphone; if not, record 02 by hand).
